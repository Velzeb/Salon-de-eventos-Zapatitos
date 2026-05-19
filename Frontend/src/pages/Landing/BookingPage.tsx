import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { configService } from '../../services/configService';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CalendarDays, 
  ChevronRight, 
  ChevronLeft, 
  Users, 
  Clock,
  CheckCircle2,
  Plus,
  Minus,
  Star,
  Info,
  ArrowRight,
  QrCode,
  Upload,
  PartyPopper
} from 'lucide-react';
import { disponibilidadService, type AvailableSlot } from '../../services/disponibilidadService';
import { paquetesService, type Paquete, type Servicio } from '../../services/paquetesService';
import { eventosService } from '../../services/eventosService';
import { authService } from '../../services/authService';


const BookingPage = () => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Booking State
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<AvailableSlot | null>(null);
  const [selectedPaquete, setSelectedPaquete] = useState<Paquete | null>(null);
  const [selectedExtras, setSelectedExtras] = useState<{ servicioId: number, cantidad: number, info: Servicio }[]>([]);
  
  // Payment & Info State
  const [formData, setFormData] = useState({
    nombreCumpleanero: '',
    edadCumpleanero: '',
    observaciones: ''
  });
  const [comprobante, setComprobante] = useState<File | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [paymentPercent, setPaymentPercent] = useState(30);
  
  // Data State
  const [availableSlots, setAvailableSlots] = useState<AvailableSlot[]>([]);
  const [paquetes, setPaquetes] = useState<Paquete[]>([]);
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      const [pData, sData, qrVal] = await Promise.all([
        paquetesService.getPaquetes(),
        paquetesService.getServicios(),
        configService.getConfig('qr_pago_base64').catch(() => null)
      ]);
      setPaquetes(pData);
      setServicios(sData);
      
      if (qrVal) setQrCode(qrVal);
    } catch (e) {
      console.error("Error loading data", e);
    }
  };

  const handleDateClick = async (date: Date) => {
    setSelectedDate(date);
    setSelectedSlot(null);
    setLoading(true);
    try {
      const dateStr = date.toISOString().split('T')[0];
      const slots = await disponibilidadService.getAvailableSlots(dateStr);
      setAvailableSlots(slots);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const toggleExtra = (servicio: Servicio) => {
    const exists = selectedExtras.find(e => e.servicioId === servicio.id);
    if (exists) {
      setSelectedExtras(selectedExtras.filter(e => e.servicioId !== servicio.id));
    } else {
      setSelectedExtras([...selectedExtras, { servicioId: servicio.id, cantidad: 1, info: servicio }]);
    }
  };

  const updateExtraQty = (servicioId: number, delta: number) => {
    setSelectedExtras(selectedExtras.map(e => 
      e.servicioId === servicioId ? { ...e, cantidad: Math.max(1, e.cantidad + delta) } : e
    ));
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      alert('Solo se permiten imágenes JPEG o PNG.');
      return;
    }

    if (file.size > 2 * 1024 * 1024) { // 2MB
      alert('El tamaño de la imagen no debe superar los 2MB.');
      return;
    }

    setComprobante(file);
  };

  const handleSubmit = async () => {
    if (!selectedPaquete || !selectedDate || !selectedSlot || !comprobante) return;

    setLoading(true);
    try {
      const userId = authService.getUserId();
      if (!userId) {
        alert("Sesión expirada. Por favor inicia sesión.");
        navigate('/login');
        return;
      }

      // Convertir comprobante a base64
      const base64Comprobante = await fileToBase64(comprobante);

      // Mapear items (Servicios del paquete + Extras)
      const items = [
        ...selectedPaquete.servicios.map(s => ({
          servicioId: s.id,
          nombre: s.nombre || 'Servicio de Paquete',
          cantidad: s.cantidad,
          esIncluidoEnPaquete: true,
          precioUnitario: 0 // Ya incluido en el base
        })),
        ...selectedExtras.map(e => ({
          servicioId: e.servicioId,
          nombre: e.info.nombre,
          cantidad: e.cantidad,
          esIncluidoEnPaquete: false,
          precioUnitario: e.info.costoBase
        }))
      ];

      await eventosService.createEvento({
        clienteIds: [], // El backend resolverá el ClienteId usando el UsuarioId del token
        paqueteId: selectedPaquete.id,
        fechaEvento: selectedDate.toISOString().split('T')[0], // Solo la fecha YYYY-MM-DD
        horaInicio: selectedSlot.horaInicio,
        horaFin: selectedSlot.horaFin,
        cantidadNinosEstimada: Math.max(1, selectedPaquete.capacidadNinos), // Evitar 0
        pagoInicial: total * (paymentPercent / 100), 
        precioTotal: total,
        comprobantePago: base64Comprobante,
        origen: 1, // 1 = Online (Enum OrigenEvento)
        cumpleaneros: [{ 
          ninoId: 0, 
          nombre: formData.nombreCumpleanero, 
          edad: parseInt(formData.edadCumpleanero) || 0 
        }], 
        items: items
      });

      setStep(5);
    } catch (e: any) {
      console.error("Error al crear reserva", e);
      let errorMsg = "Hubo un error al procesar tu reserva.";
      
      if (e.response?.data?.errors) {
        // Formato FluentValidation { errors: { Prop: ["Msg1", "Msg2"] } }
        errorMsg = Object.values(e.response.data.errors).flat().join(', ');
      } else if (Array.isArray(e.response?.data)) {
        errorMsg = e.response.data.join(', ');
      } else if (typeof e.response?.data === 'string') {
        errorMsg = e.response.data;
      }
      
      alert(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const total = (selectedPaquete?.precioBase || 0) + selectedExtras.reduce((sum, e) => sum + (e.info.costoBase * e.cantidad), 0);

  // Render Helpers
  const renderCalendar = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const totalDays = new Date(year, month + 1, 0).getDate();
    const startDay = new Date(year, month, 1).getDay();
    
    const days = [];
    for (let i = 0; i < startDay; i++) days.push(<div key={`e-${i}`} />);
    
    for (let d = 1; d <= totalDays; d++) {
      const date = new Date(year, month, d);
      const isSelected = selectedDate?.toDateString() === date.toDateString();
      const isPast = date < new Date(new Date().setHours(0,0,0,0));
      
      days.push(
        <button 
          key={d}
          disabled={isPast}
          onClick={() => handleDateClick(date)}
          className={`h-14 w-full rounded-2xl flex flex-col items-center justify-center transition-all relative ${
            isSelected ? 'bg-primary text-white shadow-lg shadow-primary/30 scale-110 z-10' : 
            isPast ? 'opacity-20 cursor-not-allowed' : 'hover:bg-slate-50 text-slate-700 font-bold'
          }`}
        >
          <span className="text-sm">{d}</span>
          {isSelected && <motion.div layoutId="dot" className="w-1 h-1 bg-white rounded-full mt-1" />}
        </button>
      );
    }
    return days;
  };

  return (
    <div className="min-h-screen bg-[#FBFBFE] flex flex-col">
      {/* TOP NAVIGATION BAR */}
      <header className="sticky top-0 bg-white/80 backdrop-blur-md border-bottom border-slate-100 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-50 rounded-full transition-all">
              <ChevronLeft size={20} className="text-slate-400" />
            </button>
            <div className="h-6 w-px bg-slate-200" />
            <h1 className="text-xl font-display font-black text-slate-800 tracking-tight">Nueva Reserva</h1>
          </div>

          <div className="hidden lg:flex items-center gap-8">
            {[
              { n: 1, l: 'Fecha' },
              { n: 2, l: 'Paquete' },
              { n: 3, l: 'Extras' },
              { n: 4, l: 'Pago' }
            ].map(s => (
              <div key={s.n} className={`flex items-center gap-2 transition-all ${step === s.n ? 'opacity-100' : 'opacity-30'}`}>
                <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black ${step >= s.n ? 'bg-primary text-white' : 'bg-slate-100 text-slate-400'}`}>
                  {s.n}
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest">{s.l}</span>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-4">
            {step < 5 && (
              <>
                <div className="text-right hidden sm:block">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Estimado</p>
                  <p className="text-lg font-black text-primary">${total.toLocaleString()}</p>
                </div>
                <button 
                  onClick={() => step < 4 ? setStep(step + 1) : navigate('/cliente/dashboard')}
                  disabled={step === 1 && !selectedSlot}
                  className="bg-slate-900 text-white px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-[0.15em] hover:bg-primary transition-all disabled:opacity-20 flex items-center gap-2"
                >
                  {step === 4 ? 'Finalizar' : 'Siguiente'} <ChevronRight size={14} />
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full p-6 lg:p-10">
        <AnimatePresence mode="wait">
          {/* STEP 1: DATE & TIME */}
          {step === 1 && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-10"
            >
              <div className="lg:col-span-7 bg-white rounded-[3rem] p-10 shadow-premium border border-slate-100">
                <div className="flex items-center justify-between mb-10">
                  <div className="space-y-1">
                    <h2 className="text-3xl font-black text-slate-800 tracking-tight italic">Paso 1. Selecciona la Fecha</h2>
                    <p className="text-slate-400 font-medium">Consulta la disponibilidad en tiempo real de nuestro salón.</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth()-1)))} className="p-2 hover:bg-slate-50 rounded-xl transition-all border border-slate-100"><ChevronLeft size={16}/></button>
                    <button onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth()+1)))} className="p-2 hover:bg-slate-50 rounded-xl transition-all border border-slate-100"><ChevronRight size={16}/></button>
                  </div>
                </div>

                <div className="mb-6 flex items-center justify-between">
                  <h3 className="text-lg font-black text-primary uppercase tracking-widest">
                    {currentMonth.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
                  </h3>
                </div>

                <div className="grid grid-cols-7 gap-2 mb-4">
                  {['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'].map(d => (
                    <div key={d} className="text-center text-[10px] font-black text-slate-300 uppercase tracking-widest py-2">{d}</div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-2">
                  {renderCalendar()}
                </div>
              </div>

              <div className="lg:col-span-5 space-y-6">
                {selectedDate ? (
                  <div className="bg-slate-900 rounded-[3rem] p-10 text-white shadow-2xl shadow-slate-900/30 min-h-full flex flex-col">
                    <div className="space-y-2 mb-8">
                      <span className="inline-block px-3 py-1 bg-primary/20 rounded-full text-[10px] font-black uppercase tracking-widest text-primary">Horarios Disponibles</span>
                      <h3 className="text-2xl font-black">{selectedDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}</h3>
                    </div>

                    <div className="space-y-4 flex-1">
                      {loading ? (
                        <div className="flex items-center gap-3 text-slate-400"><Clock className="animate-spin" /> Buscando espacios...</div>
                      ) : availableSlots.length > 0 ? (
                        availableSlots.map((slot, i) => (
                          <button 
                            key={i}
                            disabled={!slot.isAvailable}
                            onClick={() => setSelectedSlot(slot)}
                            className={`w-full p-6 rounded-[2rem] border transition-all flex items-center justify-between group ${
                              selectedSlot === slot ? 'bg-primary border-primary text-white scale-[1.02]' :
                              !slot.isAvailable ? 'bg-white/5 border-white/5 opacity-40 grayscale cursor-not-allowed' :
                              'bg-white/10 border-white/10 hover:bg-white/20'
                            }`}
                          >
                            <div className="flex items-center gap-4 text-left">
                              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${selectedSlot === slot ? 'bg-white/20' : 'bg-white/10'}`}>
                                <Clock size={20} />
                              </div>
                              <div>
                                <p className="font-black tracking-tight">{slot.nombreBloque}</p>
                                <p className="text-xs opacity-60 font-medium">{(slot.horaInicio).substring(0,5)} — {(slot.horaFin).substring(0,5)}</p>
                              </div>
                            </div>
                            {slot.isAvailable ? (
                              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${selectedSlot === slot ? 'bg-white border-white' : 'border-white/20'}`}>
                                {selectedSlot === slot && <CheckCircle2 size={12} className="text-primary" />}
                              </div>
                            ) : (
                              <span className="text-[8px] font-black uppercase bg-white/10 px-2 py-1 rounded-md">Ocupado</span>
                            )}
                          </button>
                        ))
                      ) : (
                        <p className="text-slate-400 italic">No hay horarios configurados para este día.</p>
                      )}
                    </div>
                    
                    {selectedSlot && (
                      <div className="mt-8 p-6 bg-white/10 rounded-[2rem] border border-white/10 flex items-center justify-between animate-in slide-in-from-bottom-4 duration-500">
                        <div>
                          <p className="text-[10px] font-black uppercase text-primary tracking-widest">Seleccionado</p>
                          <p className="font-black">{selectedSlot.nombreBloque}</p>
                        </div>
                        <ArrowRight className="text-primary" />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-white rounded-[3rem] border border-dashed border-slate-200 p-16 flex flex-col items-center justify-center text-center space-y-4 min-h-[400px]">
                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-300">
                      <CalendarDays size={40} />
                    </div>
                    <p className="text-slate-500 font-bold max-w-[200px]">Selecciona un día para ver turnos disponibles</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* STEP 2: PAQUETES */}
          {step === 2 && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.05 }}
              className="space-y-10"
            >
              <div className="text-center space-y-2">
                <h2 className="text-4xl font-black text-slate-800 tracking-tight">Elige tu <span className="text-primary italic">Experiencia</span></h2>
                <p className="text-slate-400 font-medium max-w-md mx-auto">Selecciona el paquete que mejor se adapte al estilo de tu celebración.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {paquetes.map((p, i) => (
                  <div 
                    key={p.id}
                    onClick={() => setSelectedPaquete(p)}
                    className={`group bg-white rounded-[3rem] border-2 transition-all cursor-pointer overflow-hidden flex flex-col ${
                      selectedPaquete?.id === p.id ? 'border-primary shadow-2xl scale-[1.02]' : 'border-slate-100 hover:border-slate-200'
                    }`}
                  >
                    <div className="h-56 relative bg-slate-100">
                      <img 
                        src={[
                          "https://images.unsplash.com/photo-1533910534207-90f31029a78e?auto=format&fit=crop&q=80&w=800",
                          "https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&q=80&w=800",
                          "https://images.unsplash.com/photo-1464347601390-25e2842a37f7?auto=format&fit=crop&q=80&w=800"
                        ][i % 3]} 
                        alt={p.nombre} 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" 
                      />
                      <div className="absolute top-6 left-6 flex flex-col gap-2">
                        {i === 1 && <span className="bg-primary text-white px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest shadow-xl">Más Popular</span>}
                        <span className="bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest text-slate-800 flex items-center gap-1 shadow-sm"><Users size={10}/> Hasta {p.capacidadNinos} niños</span>
                      </div>
                      <div className="absolute bottom-6 left-6">
                        <span className="text-3xl font-black text-white drop-shadow-lg">${p.precioBase.toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="p-10 space-y-6 flex-1 flex flex-col">
                      <div className="space-y-2">
                        <h3 className="text-2xl font-black text-slate-800 group-hover:text-primary transition-colors">{p.nombre}</h3>
                        <p className="text-slate-500 text-sm font-medium leading-relaxed line-clamp-3">{p.descripcion || "Una experiencia mágica diseñada para crear recuerdos inolvidables."}</p>
                      </div>
                      <div className="pt-6 border-t border-slate-50 flex items-center justify-between mt-auto">
                        <div className="flex items-center gap-2">
                          <Clock size={16} className="text-slate-300" />
                          <span className="text-xs font-black text-slate-400 uppercase tracking-widest">{p.duracionHoras} Horas</span>
                        </div>
                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${selectedPaquete?.id === p.id ? 'bg-primary text-white' : 'bg-slate-50 text-slate-300 group-hover:bg-primary/10 group-hover:text-primary'}`}>
                          <CheckCircle2 size={20} />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* STEP 3: EXTRAS */}
          {step === 3 && (
            <motion.div 
              initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }}
              className="space-y-12"
            >
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-2">
                  <h2 className="text-4xl font-black text-slate-800 tracking-tight">Mejora la <span className="text-primary italic">Magia</span></h2>
                  <p className="text-slate-400 font-medium">Añade servicios adicionales para personalizar tu evento al máximo.</p>
                </div>
                <div className="bg-white px-6 py-4 rounded-2xl border border-slate-100 flex items-center gap-4">
                  <Star className="text-amber-400 fill-amber-400" size={20} />
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Has seleccionado</p>
                    <p className="font-black text-slate-800">{selectedExtras.length} Servicios Extra</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {servicios.map((s, i) => {
                  const extra = selectedExtras.find(e => e.servicioId === s.id);
                  return (
                    <div 
                      key={s.id}
                      className={`group bg-white rounded-[2.5rem] border transition-all duration-300 overflow-hidden flex flex-col ${
                        extra ? 'border-primary shadow-xl ring-4 ring-primary/5' : 'border-slate-100 hover:border-primary/20'
                      }`}
                    >
                      <div className="h-40 relative bg-slate-100 overflow-hidden">
                        <img 
                          src={[
                            "https://images.unsplash.com/photo-1504194104404-4cd3c27f354b?auto=format&fit=crop&q=80&w=400",
                            "https://images.unsplash.com/photo-1533910534207-90f31029a78e?auto=format&fit=crop&q=80&w=400",
                            "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&q=80&w=400",
                            "https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&q=80&w=400"
                          ][i % 4]} 
                          alt={s.nombre} 
                          className="w-full h-full object-cover group-hover:scale-125 transition-transform duration-1000" 
                        />
                        <div className="absolute top-4 right-4">
                          <button 
                            onClick={() => toggleExtra(s)}
                            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${extra ? 'bg-primary text-white' : 'bg-white/90 backdrop-blur-md text-slate-400 hover:bg-primary hover:text-white'}`}
                          >
                            {extra ? <CheckCircle2 size={20} /> : <Plus size={20} />}
                          </button>
                        </div>
                      </div>
                      <div className="p-6 space-y-4 flex-1 flex flex-col">
                        <div className="space-y-1">
                          <h4 className="font-black text-slate-800 leading-tight">{s.nombre}</h4>
                          <p className="text-primary font-black text-lg">${s.costoBase.toLocaleString()}</p>
                        </div>
                        
                        {extra ? (
                          <div className="mt-auto flex items-center justify-between bg-slate-50 p-2 rounded-xl border border-slate-100 animate-in zoom-in-95 duration-300">
                            <button onClick={() => updateExtraQty(s.id, -1)} className="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center text-slate-400 hover:text-primary transition-all"><Minus size={14}/></button>
                            <span className="font-black text-sm">{extra.cantidad}</span>
                            <button onClick={() => updateExtraQty(s.id, 1)} className="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center text-slate-400 hover:text-primary transition-all"><Plus size={14}/></button>
                          </div>
                        ) : (
                          <p className="text-[10px] text-slate-400 font-medium leading-relaxed line-clamp-2 mt-auto">Añade este servicio para que tu fiesta sea única.</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.1 }}
              className="max-w-6xl mx-auto"
            >
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                {/* Lado Izquierdo: Resumen y Formulario */}
                <div className="lg:col-span-7 space-y-8">
                  <div className="bg-white rounded-[3rem] shadow-premium border border-slate-100 overflow-hidden">
                    <div className="bg-slate-900 p-8 text-white relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-2xl" />
                      <div className="relative z-10 flex justify-between items-center">
                        <div className="space-y-1">
                          <p className="text-[10px] font-black uppercase tracking-widest text-primary">Resumen de Reserva</p>
                          <h2 className="text-2xl font-black">{selectedPaquete?.nombre}</h2>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total</p>
                          <p className="text-3xl font-black text-white">${total.toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-8 space-y-6">
                      <div className="grid grid-cols-3 gap-4">
                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                          <CalendarDays className="text-primary mb-2" size={18} />
                          <p className="text-[8px] font-black text-slate-400 uppercase">Fecha</p>
                          <p className="text-xs font-black">{selectedDate?.toLocaleDateString()}</p>
                        </div>
                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                          <Clock className="text-primary mb-2" size={18} />
                          <p className="text-[8px] font-black text-slate-400 uppercase">Horario</p>
                          <p className="text-xs font-black">{selectedSlot?.horaInicio.substring(0,5)} - {selectedSlot?.horaFin.substring(0,5)}</p>
                        </div>
                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                          <Users className="text-primary mb-2" size={18} />
                          <p className="text-[8px] font-black text-slate-400 uppercase">Capacidad</p>
                          <p className="text-xs font-black">{selectedPaquete?.capacidadNinos} niños</p>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
                          <PartyPopper size={18} className="text-primary" /> Información del Festejado
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Nombre del Cumpleañero</label>
                            <input 
                              type="text" 
                              placeholder="Ej. Juanito Pérez"
                              className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-medium focus:ring-2 ring-primary/20 outline-none transition-all"
                              value={formData.nombreCumpleanero}
                              onChange={(e) => setFormData({...formData, nombreCumpleanero: e.target.value})}
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Edad a Cumplir</label>
                            <input 
                              type="number" 
                              placeholder="Ej. 5"
                              className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-medium focus:ring-2 ring-primary/20 outline-none transition-all"
                              value={formData.edadCumpleanero}
                              onChange={(e) => setFormData({...formData, edadCumpleanero: e.target.value})}
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Notas u Observaciones</label>
                          <textarea 
                            rows={3}
                            placeholder="¿Alguna alergia o pedido especial?"
                            className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-medium focus:ring-2 ring-primary/20 outline-none transition-all resize-none"
                            value={formData.observaciones}
                            onChange={(e) => setFormData({...formData, observaciones: e.target.value})}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Lado Derecho: Pago */}
                <div className="lg:col-span-5 space-y-8">
                  <div className="bg-white rounded-[3rem] shadow-premium border border-slate-100 p-8 space-y-8">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
                            <QrCode size={24} className="text-primary" /> Método de Pago
                          </h3>
                          <div className="px-3 py-1 bg-primary/10 rounded-full">
                            <span className="text-[10px] font-black text-primary uppercase">Mínimo 30%</span>
                          </div>
                        </div>
                        <p className="text-slate-400 text-sm font-medium">Puedes reservar con el 30% o pagar el total ahora.</p>
                      </div>

                      {/* Payment Amount Selector */}
                      <div className="space-y-4 p-6 bg-slate-50 rounded-[2rem] border border-slate-100">
                        <div className="flex justify-between items-end">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Monto a Pagar Hoy</p>
                          <p className="text-2xl font-black text-primary">${Math.round(total * (paymentPercent / 100)).toLocaleString()}</p>
                        </div>
                        <input 
                          type="range" min="30" max="100" step="5"
                          value={paymentPercent}
                          onChange={(e) => setPaymentPercent(parseInt(e.target.value))}
                          className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-primary"
                        />
                        <div className="flex justify-between text-[8px] font-black text-slate-300 uppercase tracking-tighter">
                          <span>30% (Reserva)</span>
                          <span>100% (Total)</span>
                        </div>
                      </div>

                      <div className="aspect-square bg-white rounded-[2rem] border-2 border-dashed border-slate-200 p-8 flex items-center justify-center overflow-hidden">
                        {qrCode ? (
                          <img src={qrCode} alt="QR Pago" className="w-full h-full object-contain" />
                        ) : (
                          <div className="text-center space-y-2">
                            <QrCode size={40} className="mx-auto text-slate-300" />
                            <p className="text-[10px] font-black text-slate-400 uppercase">Cargando QR...</p>
                          </div>
                        )}
                      </div>

                      <div className="space-y-4">
                        <label className="block space-y-2">
                          <span className="text-[10px] font-black text-slate-400 uppercase ml-1">Subir Comprobante</span>
                          <div className="relative group">
                            <input 
                              type="file" 
                              className="hidden" 
                              accept="image/jpeg,image/png"
                              onChange={handleFileChange}
                              id="upload-proof"
                            />
                            <label 
                              htmlFor="upload-proof"
                              className={`w-full p-6 rounded-[2rem] border-2 border-dashed flex flex-col items-center justify-center gap-3 transition-all cursor-pointer ${
                                comprobante ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : 'bg-white border-slate-200 hover:border-primary text-slate-400'
                              }`}
                            >
                              <Upload size={24} />
                              <span className="text-xs font-black uppercase tracking-widest text-center">
                                {comprobante ? comprobante.name : 'Seleccionar Comprobante'}
                              </span>
                            </label>
                          </div>
                        </label>

                        <div className="p-6 bg-amber-50 rounded-[2rem] border border-amber-100 flex gap-4">
                          <Info className="text-amber-500 shrink-0" size={20} />
                          <p className="text-[10px] font-medium text-amber-700 leading-relaxed">
                            Recuerda que para confirmar tu fecha debes subir el comprobante de pago por el monto seleccionado (${Math.round(total * (paymentPercent/100)).toLocaleString()}). Nuestro equipo validará el pago en las próximas 24h.
                          </p>
                        </div>
                      </div>

                      <button 
                        onClick={handleSubmit}
                        disabled={!comprobante || !formData.nombreCumpleanero || loading}
                        className="w-full py-6 bg-slate-900 text-white font-black text-[10px] uppercase tracking-widest rounded-[2rem] hover:bg-primary transition-all shadow-xl shadow-slate-900/20 disabled:opacity-20 flex items-center justify-center gap-2"
                      >
                        {loading ? 'Procesando...' : 'Finalizar Reserva'}
                      </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {step === 5 && (
            <motion.div 
              initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
              className="max-w-2xl mx-auto text-center space-y-8 py-20"
            >
              <div className="w-24 h-24 bg-emerald-50 text-emerald-500 rounded-[2.5rem] flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/10">
                <CheckCircle2 size={48} />
              </div>
              <div className="space-y-4">
                <h2 className="text-4xl font-black text-slate-800 tracking-tight">¡Reserva <span className="text-primary italic">Confirmada</span> para {formData.nombreCumpleanero || 'tu peque'}!</h2>
                <p className="text-slate-500 text-lg font-medium">Todo está listo. Hemos enviado un correo con los detalles y los próximos pasos para tu gran día.</p>
              </div>
              <div className="pt-6">
                <button 
                  onClick={() => navigate('/cliente/dashboard')}
                  className="px-12 py-5 bg-primary text-white font-black text-[10px] uppercase tracking-widest rounded-2xl hover:bg-secondary transition-all shadow-2xl shadow-primary/30"
                >
                  Ir a Mis Eventos
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* FOOTER BAR (MOBILE ONLY) */}
      {step < 5 && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 p-6 flex items-center justify-between z-[100]">
          <div>
            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Total</p>
            <p className="text-xl font-black text-primary">${total.toLocaleString()}</p>
          </div>
          <button 
            onClick={() => setStep(step + 1)}
            className="bg-primary text-white px-8 py-4 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-primary/20"
          >
            Siguiente
          </button>
        </div>
      )}
    </div>
  );
};

export default BookingPage;



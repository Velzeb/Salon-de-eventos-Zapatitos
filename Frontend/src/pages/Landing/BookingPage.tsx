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
  PartyPopper,
  Sun,
  Moon,
  Sparkles
} from 'lucide-react';
import { disponibilidadService, type AvailableSlot } from '../../services/disponibilidadService';
import { paquetesService, type Paquete, type Servicio } from '../../services/paquetesService';
import { eventosService } from '../../services/eventosService';
import { authService } from '../../services/authService';
import { clientePortalService, type PerfilCliente } from '../../services/clientePortalService';
import { getPackageImageFallback, getServiceImageFallback } from '../../utils/imageFallbacks';


const BookingPage = () => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Booking State
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<AvailableSlot | null>(null);
  const [selectedPaquete, setSelectedPaquete] = useState<Paquete | null>(null);
  const [soloSalon, setSoloSalon] = useState(false);
  const [selectedExtras, setSelectedExtras] = useState<{ servicioId: number, cantidad: number, info: Servicio }[]>([]);

  // Payment & Info State
  const [formData, setFormData] = useState({
    tematica: '',
    observaciones: ''
  });
  const [responsables, setResponsables] = useState([{ nombre: '', telefonos: [''] }]);
  const [cumpleaneros, setCumpleaneros] = useState([{ nombre: '', edad: '' }]);
  const [comprobante, setComprobante] = useState<File | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [paymentPercent, setPaymentPercent] = useState(30);
  const [paymentAmount, setPaymentAmount] = useState(0);

  // Data State
  const [availableSlots, setAvailableSlots] = useState<AvailableSlot[]>([]);
  const [paquetes, setPaquetes] = useState<Paquete[]>([]);
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [perfilCliente, setPerfilCliente] = useState<PerfilCliente | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [monthStatus, setMonthStatus] = useState<Record<number, { status: 'free' | 'partial' | 'full' | 'closed', availableCount: number, slotsCount: number }>>({});
  const [slideDirection, setSlideDirection] = useState(0);

  const getSlotIcon = (horaInicio: string) => {
    const hour = parseInt(horaInicio.split(':')[0], 10);
    if (hour < 13) return <Sun size={18} className="text-amber-500" />;
    if (hour < 17) return <Sparkles size={18} className="text-purple-500" />;
    return <Moon size={18} className="text-indigo-500" />;
  };

  useEffect(() => {
    loadMonthAvailability(currentMonth);
  }, [currentMonth]);

  const loadMonthAvailability = async (date: Date) => {
    try {
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const data = await disponibilidadService.getMonthAvailable(year, month);
      const statusMap: Record<number, any> = {};
      data.forEach(d => {
        statusMap[d.day] = d;
      });
      setMonthStatus(statusMap);
    } catch (e) {
      console.error("Error al cargar disponibilidad mensual:", e);
      setMonthStatus({});
    }
  };

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      const currentUrl = window.location.pathname + window.location.search;
      navigate(`/cliente/login?redirect=${encodeURIComponent(currentUrl)}`, { replace: true });
      return;
    }
    loadInitialData();
  }, []);

  const total = (selectedPaquete?.precioBase || 0) + selectedExtras.reduce((sum, e) => sum + (e.info.costoBase * e.cantidad), 0);

  useEffect(() => {
    setPaymentAmount(Math.round(total * (paymentPercent / 100)));
  }, [total, paymentPercent]);

  const calculateAge = (birthDate?: string) => {
    if (!birthDate || !selectedDate) return '';
    const birth = new Date(birthDate);
    if (Number.isNaN(birth.getTime())) return '';
    let age = selectedDate.getFullYear() - birth.getFullYear();
    const monthDiff = selectedDate.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && selectedDate.getDate() < birth.getDate())) age--;
    return age >= 0 ? age.toString() : '';
  };

  const addProfileKid = (nino: PerfilCliente['ninos'][number]) => {
    const exists = cumpleaneros.some(c => c.nombre.trim().toLowerCase() === nino.nombre.trim().toLowerCase());
    if (exists) return;
    const entry = { nombre: nino.nombre, edad: calculateAge(nino.fechaNacimiento) || nino.edad?.toString() || '' };
    const emptyIndex = cumpleaneros.findIndex(c => !c.nombre.trim() && !c.edad.trim());
    if (emptyIndex >= 0) {
      setCumpleaneros(cumpleaneros.map((item, index) => index === emptyIndex ? entry : item));
    } else {
      setCumpleaneros([...cumpleaneros, entry]);
    }
  };

  const loadInitialData = async () => {
    try {
      const [pData, sData, qrVal, perfil] = await Promise.all([
        paquetesService.getPaquetes(),
        paquetesService.getServicios(),
        configService.getConfig('qr_pago_base64').catch(() => null),
        clientePortalService.getPerfil().catch(() => null)
      ]);
      setPaquetes(pData);
      setServicios(sData);
      setPerfilCliente(perfil);
      if (perfil) {
        setResponsables([
          {
            nombre: perfil.nombreCompleto || '',
            telefonos: perfil.telefono ? [perfil.telefono] : ['']
          }
        ]);
      }

      if (qrVal) setQrCode(qrVal);

      // Parse query parameters
      const params = new URLSearchParams(window.location.search);
      const fechaParam = params.get('fecha');
      const paqueteIdParam = params.get('paqueteId');

      if (fechaParam) {
        const [y, m, d] = fechaParam.split('-').map(Number);
        const date = new Date(y, m - 1, d);
        setSelectedDate(date);
        setCurrentMonth(new Date(y, m - 1, 1)); // Focus month on preselected date
        setSelectedSlot(null);
        setLoading(true);
        try {
          const slots = await disponibilidadService.getAvailableSlots(fechaParam);
          setAvailableSlots(slots);
        } catch (err) {
          console.error("Error loading slot availability", err);
        } finally {
          setLoading(false);
        }
      }

      if (paqueteIdParam) {
        const pId = parseInt(paqueteIdParam, 10);
        const preselectedPkg = pData.find(p => p.id === pId);
        if (preselectedPkg) {
          setSelectedPaquete(preselectedPkg);
          setSoloSalon(false);
        }
      }
    } catch (e) {
      console.error("Error loading data", e);
    }
  };

  const handleDateClick = async (date: Date) => {
    setSelectedDate(date);
    setSelectedSlot(null);
    setLoading(true);
    try {
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, '0');
      const d = String(date.getDate()).padStart(2, '0');
      const dateStr = `${y}-${m}-${d}`;
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

  const hasPackageChoice = soloSalon || !!selectedPaquete;
  const effectivePackageName = soloSalon ? 'Solo salón' : selectedPaquete?.nombre;
  const effectiveCapacity = soloSalon ? 1 : Math.max(1, selectedPaquete?.capacidadNinos || 1);
  const validCumpleaneros = cumpleaneros.filter(c => c.nombre.trim() && Number(c.edad) > 0);
  const validResponsables = responsables
    .map(r => ({ nombre: r.nombre.trim(), telefonos: r.telefonos.map(t => t.trim()).filter(Boolean) }))
    .filter(r => r.nombre && r.telefonos.length > 0);
  const minPayment = Math.ceil(total * 0.3);
  const resolvedPaymentAmount = total > 0 ? Math.min(total, Math.max(paymentAmount, minPayment)) : 0;
  const canContinue = () => {
    if (step === 1) return !!selectedDate && !!selectedSlot;
    if (step === 2) return hasPackageChoice;
    if (step === 3) return true;
    if (step === 4) return !!comprobante && validResponsables.length > 0 && validCumpleaneros.length > 0 && total > 0 && resolvedPaymentAmount >= minPayment;
    return true;
  };

  const getNextLabel = () => {
    if (step === 1) return 'Elegir paquete';
    if (step === 2) return 'Agregar extras';
    if (step === 3) return 'Ir al pago';
    if (step === 4) return 'Confirmar reserva';
    return 'Siguiente';
  };

  const goNext = () => {
    if (!canContinue()) return;
    if (step < 4) setStep(step + 1);
    else handleSubmit();
  };

  const handleSubmit = async () => {
    if (!hasPackageChoice || !selectedDate || !selectedSlot || !comprobante) return;

    setLoading(true);
    try {
      const userId = authService.getUserId();
      if (!userId) {
        alert("Sesión expirada. Por favor inicia sesión.");
        navigate('/cliente/login');
        return;
      }

      // Convertir comprobante a base64
      const base64Comprobante = await fileToBase64(comprobante);

      // Mapear items (Servicios del paquete + Extras)
      const items = [
        ...(selectedPaquete?.servicios || []).map(s => ({
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
        paqueteId: selectedPaquete?.id ?? null,
        fechaEvento: selectedDate.toISOString().split('T')[0], // Solo la fecha YYYY-MM-DD
        horaInicio: selectedSlot.horaInicio,
        horaFin: selectedSlot.horaFin,
        cantidadNinosEstimada: effectiveCapacity,
        pagoInicial: resolvedPaymentAmount,
        precioTotal: total,
        comprobantePago: base64Comprobante,
        origen: 1, // 1 = Online (Enum OrigenEvento)
        tematica: formData.tematica || undefined,
        notasAdmin: [
          validResponsables.length ? `Responsables: ${validResponsables.map((r, index) => `${index + 1}. ${r.nombre} (${r.telefonos.join(', ')})`).join(' | ')}` : '',
          formData.observaciones ? `Observaciones del cliente: ${formData.observaciones}` : ''
        ].filter(Boolean).join('\n'),
        cumpleaneros: validCumpleaneros.map(c => ({
          ninoId: 0,
          nombre: c.nombre,
          edad: parseInt(c.edad) || 0
        })),
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

  // Render Helpers
  const renderCalendar = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const totalDays = new Date(year, month + 1, 0).getDate();
    const startDay = new Date(year, month, 1).getDay();

    const days = [];
    for (let i = 0; i < startDay; i++) days.push(<div key={`e-${i}`} />);

    const today = new Date();
    today.setHours(0,0,0,0);

    for (let d = 1; d <= totalDays; d++) {
      const dateToCheck = new Date(year, month, d);
      const isPast = dateToCheck < today;
      const isSelected = selectedDate?.toDateString() === dateToCheck.toDateString();

      const dayInfo = monthStatus[d];

      let dayBgClass = 'bg-slate-50 border-purple-50 hover:bg-purple-100 hover:border-purple-200 text-slate-700';

      if (isPast) {
        dayBgClass = 'bg-slate-50/40 text-slate-300 border-transparent opacity-40 cursor-not-allowed';
      } else if (dayInfo) {
        if (dayInfo.status === 'closed') {
          dayBgClass = 'bg-slate-100/40 text-slate-400 border-slate-100 cursor-not-allowed';
        } else if (dayInfo.status === 'full') {
          dayBgClass = 'bg-rose-50/70 text-rose-600 border-rose-100 cursor-not-allowed';
        } else if (dayInfo.status === 'partial') {
          dayBgClass = 'bg-amber-50/70 text-amber-800 border-amber-100 hover:bg-amber-100/40';
        } else {
          dayBgClass = 'bg-emerald-50/60 text-emerald-800 border-emerald-100 hover:bg-emerald-100/40';
        }
      }

      const canSelect = !isPast && (!dayInfo || (dayInfo.status !== 'closed' && dayInfo.status !== 'full'));

      days.push(
        <button
          key={d}
          disabled={!canSelect}
          type="button"
          onClick={() => handleDateClick(dateToCheck)}
          className={`aspect-square w-full rounded-xl sm:rounded-2xl flex flex-col items-center justify-center transition-all border relative ${
            isSelected
              ? '!bg-gradient-to-tr !from-primary !via-purple-600 !to-pink-500 !text-white !border-transparent shadow-lg shadow-primary/25 scale-105 z-10 font-bold'
              : today.toDateString() === dateToCheck.toDateString()
                ? 'border-2 border-primary-light text-slate-800 font-extrabold shadow-sm'
                : dayBgClass
          }`}
        >
          <span className="text-base lg:text-lg font-display font-black leading-none">{d}</span>

          {/* Availability Status Indicator Dot */}
          {!isPast && (!dayInfo || dayInfo.status !== 'closed') && (
            <span className={`w-2 h-2 rounded-full absolute bottom-2.5 left-1/2 -translate-x-1/2 ${
              isSelected
                ? 'bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]'
                : dayInfo?.status === 'full'
                  ? 'bg-rose-500 shadow-[0_0_6px_rgba(239,68,68,0.4)]'
                  : dayInfo?.status === 'partial'
                    ? 'bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.4)]'
                    : 'bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.4)]'
            }`} />
          )}
        </button>
      );
    }
    return days;
  };

  return (
    <div className="min-h-screen bg-bg-main flex flex-col">
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
                  onClick={goNext}
                  disabled={!canContinue() || loading}
                  className="bg-slate-900 text-white px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-[0.15em] hover:bg-primary transition-all disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 flex items-center gap-2"
                >
                  {getNextLabel()} <ChevronRight size={14} />
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
                    <button
                      type="button"
                      onClick={() => {
                        setSlideDirection(-1);
                        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
                      }}
                      className="p-2.5 hover:bg-slate-50 hover:text-primary rounded-xl transition-all border border-slate-100 active:scale-90"
                    >
                      <ChevronLeft size={18}/>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSlideDirection(1);
                        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
                      }}
                      className="p-2.5 hover:bg-slate-50 hover:text-primary rounded-xl transition-all border border-slate-100 active:scale-90"
                    >
                      <ChevronRight size={18}/>
                    </button>
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
                <div className="overflow-hidden relative min-h-[350px]">
                  <AnimatePresence initial={false} custom={slideDirection} mode="popLayout">
                    <motion.div
                      key={currentMonth.toISOString()}
                      custom={slideDirection}
                      variants={{
                        enter: (dir: number) => ({
                          x: dir > 0 ? 250 : -250,
                          opacity: 0
                        }),
                        center: {
                          x: 0,
                          opacity: 1
                        },
                        exit: (dir: number) => ({
                          x: dir < 0 ? 250 : -250,
                          opacity: 0
                        })
                      }}
                      initial="enter"
                      animate="center"
                      exit="exit"
                      transition={{ type: 'spring', stiffness: 260, damping: 26 }}
                      className="grid grid-cols-7 gap-2.5"
                    >
                      {renderCalendar()}
                    </motion.div>
                  </AnimatePresence>
                </div>
                {/* Legend */}
                <div className="flex flex-wrap gap-4 pt-6 mt-6 border-t border-purple-50/50 text-[8px] font-black text-slate-400 uppercase tracking-widest">
                  <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-md inline-block bg-emerald-500"></span> Libre</div>
                  <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-md inline-block bg-amber-400"></span> Parcial</div>
                  <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-md inline-block bg-rose-400"></span> Agotado</div>
                  <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-md inline-block bg-slate-200"></span> Cerrado</div>
                </div>
              </div>

              <div className="lg:col-span-5 space-y-6">
                {selectedDate ? (
                  <div className="bg-white rounded-[3rem] p-8 lg:p-10 text-slate-900 shadow-premium border border-slate-100 min-h-full flex flex-col">
                    <div className="space-y-2 mb-8">
                      <span className="inline-block px-3 py-1 bg-purple-50 rounded-full text-[10px] font-black uppercase tracking-widest text-primary">Horarios disponibles</span>
                      <h3 className="text-2xl font-black">{selectedDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}</h3>
                    </div>

                    <div className="space-y-4 flex-1">
                      {loading ? (
                        <div className="flex items-center gap-3 text-slate-500"><Clock className="animate-spin" /> Buscando espacios...</div>
                      ) : availableSlots.length > 0 ? (
                        availableSlots.map((slot, i) => (
                          <motion.button
                            key={i}
                            whileHover={slot.isAvailable ? { scale: 1.02, y: -1 } : {}}
                            whileTap={slot.isAvailable ? { scale: 0.98 } : {}}
                            disabled={!slot.isAvailable}
                            type="button"
                            onClick={() => setSelectedSlot(slot)}
                            className={`w-full p-5 rounded-2xl border transition-all relative overflow-hidden flex items-center justify-between group ${
                              selectedSlot === slot ? 'bg-primary border-primary text-white scale-[1.02] shadow-xl shadow-primary/20' :
                              !slot.isAvailable ? 'bg-slate-50 border-slate-100 opacity-55 grayscale cursor-not-allowed text-slate-400' :
                              'bg-slate-50 border-slate-200 hover:bg-purple-50 hover:border-primary/30 text-slate-800'
                            }`}
                          >
                            {/* Translucent Ticket Notches */}
                            {slot.isAvailable && (
                              <>
                                <div className="absolute -left-2.5 top-1/2 -translate-y-1/2 w-4.5 h-8 bg-white border-r border-slate-200 rounded-r-full z-10"></div>
                                <div className="absolute -right-2.5 top-1/2 -translate-y-1/2 w-4.5 h-8 bg-white border-l border-slate-200 rounded-l-full z-10"></div>
                                {/* Dashed divider */}
                                <div className={`absolute left-[70%] top-0 bottom-0 border-l border-dashed z-0 ${selectedSlot === slot ? 'border-white/30' : 'border-slate-200'}`}></div>
                              </>
                            )}

                            {/* Left Info Section */}
                            <div className="flex items-center gap-4 text-left z-10 w-[63%]">
                              <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0 ${
                                selectedSlot === slot ? 'bg-white/25 text-white' : 'bg-white text-slate-700 shadow-sm'
                              }`}>
                                {getSlotIcon(slot.horaInicio)}
                              </div>
                              <div className="min-w-0">
                                <p className="font-extrabold tracking-tight text-sm truncate">{slot.nombreBloque}</p>
                                <p className={`text-[10px] font-semibold mt-0.5 ${selectedSlot === slot ? 'text-white/80' : 'text-slate-500'}`}>{(slot.horaInicio).substring(0,5)} — {(slot.horaFin).substring(0,5)}</p>
                              </div>
                            </div>

                            {/* Right Action/Select section */}
                            <div className="z-10 shrink-0 text-center pl-2 w-[32%] flex justify-center">
                              {slot.isAvailable ? (
                                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                                  selectedSlot === slot ? 'bg-white border-white' : 'border-slate-300 bg-white group-hover:border-primary'
                                }`}>
                                  {selectedSlot === slot && <CheckCircle2 size={12} className="text-primary" />}
                                </div>
                              ) : (
                                <span className="text-[8px] font-black uppercase bg-slate-200 px-2 py-1 rounded-md text-slate-500">Ocupado</span>
                              )}
                            </div>
                          </motion.button>
                        ))
                      ) : (
                        <p className="text-slate-500 italic">No hay horarios configurados para este día.</p>
                      )}
                    </div>

                    {selectedSlot && (
                      <div className="mt-8 p-5 bg-purple-50 rounded-2xl border border-purple-100 flex items-center justify-between animate-in slide-in-from-bottom-4 duration-500">
                        <div>
                          <p className="text-[10px] font-black uppercase text-primary tracking-widest">Seleccionado</p>
                          <p className="font-black text-slate-900">{selectedSlot.nombreBloque}</p>
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
                <p className="text-slate-500 font-medium max-w-xl mx-auto">Selecciona un paquete completo o reserva solo el salón y agrega servicios por separado.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div
                  onClick={() => {
                    setSoloSalon(true);
                    setSelectedPaquete(null);
                  }}
                  className={`group bg-white rounded-[3rem] border-2 transition-all cursor-pointer overflow-hidden flex flex-col ${
                    soloSalon ? 'border-primary shadow-2xl scale-[1.02]' : 'border-slate-100 hover:border-slate-200'
                  }`}
                >
                  <div className="h-56 relative bg-slate-900 overflow-hidden">
                    <img
                      src="https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&q=80&w=800"
                      alt="Solo salón"
                      className="w-full h-full object-cover opacity-85 group-hover:scale-110 transition-transform duration-1000"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 to-transparent" />
                    <div className="absolute top-6 left-6">
                      <span className="bg-white/95 backdrop-blur-md px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest text-slate-800 flex items-center gap-1 shadow-sm">
                        <Users size={10}/> Modalidad flexible
                      </span>
                    </div>
                    <div className="absolute bottom-6 left-6">
                      <span className="text-3xl font-black text-white drop-shadow-lg">Solo salón</span>
                    </div>
                  </div>
                  <div className="p-10 space-y-6 flex-1 flex flex-col">
                    <div className="space-y-2">
                      <h3 className="text-2xl font-black text-slate-800 group-hover:text-primary transition-colors">Solo salón</h3>
                      <p className="text-slate-500 text-sm font-medium leading-relaxed">Reserva el espacio y arma tu evento con extras según lo que necesites.</p>
                    </div>
                    <div className="pt-6 border-t border-slate-100 flex items-center justify-between mt-auto">
                      <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Sin paquete base</span>
                      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${soloSalon ? 'bg-primary text-white' : 'bg-slate-50 text-slate-300 group-hover:bg-primary/10 group-hover:text-primary'}`}>
                        <CheckCircle2 size={20} />
                      </div>
                    </div>
                  </div>
                </div>

                {paquetes.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => {
                      setSelectedPaquete(p);
                      setSoloSalon(false);
                    }}
                    className={`group bg-white rounded-[3rem] border-2 transition-all cursor-pointer overflow-hidden flex flex-col ${
                      selectedPaquete?.id === p.id ? 'border-primary shadow-2xl scale-[1.02]' : 'border-slate-100 hover:border-slate-200'
                    }`}
                  >
                    <div className="h-56 relative bg-slate-100">
                      <img
                        src={p.imagenUrl || getPackageImageFallback(p.nombre)}
                        alt={p.nombre}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"
                      />
                      <div className="absolute top-6 left-6 flex flex-col gap-2">
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
                      <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                        <p className="mb-3 text-[10px] font-black uppercase tracking-widest text-slate-400">Incluye</p>
                        <div className="space-y-2">
                          {p.servicios.slice(0, 4).map((service) => (
                            <div key={service.id} className="flex items-center justify-between gap-3 text-xs font-bold">
                              <span className="truncate text-slate-700">{service.nombre}</span>
                              <span className="shrink-0 rounded-full bg-white px-2 py-0.5 text-primary">x{service.cantidad}</span>
                            </div>
                          ))}
                          {p.articulos.slice(0, 3).map((articulo) => (
                            <div key={articulo.articuloId} className="flex items-center justify-between gap-3 text-xs font-bold">
                              <span className="truncate text-slate-700">{articulo.nombreArticulo}</span>
                              <span className="shrink-0 rounded-full bg-white px-2 py-0.5 text-slate-500">x{articulo.cantidad}</span>
                            </div>
                          ))}
                          {p.servicios.length + p.articulos.length === 0 && (
                            <p className="text-xs font-semibold text-slate-400">Sin servicios detallados en el paquete.</p>
                          )}
                          {p.servicios.length + p.articulos.length > 7 && (
                            <p className="pt-1 text-[10px] font-black uppercase tracking-widest text-primary">
                              +{p.servicios.length + p.articulos.length - 7} incluidos más
                            </p>
                          )}
                        </div>
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
                {servicios.map((s) => {
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
                          src={s.imagenUrl || getServiceImageFallback(s.nombre)}
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
                    <div className="bg-white p-8 text-slate-950 relative overflow-hidden border-b border-slate-100">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-purple-100 rounded-full blur-2xl" />
                      <div className="relative z-10 flex justify-between items-center">
                        <div className="space-y-1">
                          <p className="text-[10px] font-black uppercase tracking-widest text-primary">Resumen de Reserva</p>
                          <h2 className="text-2xl font-black text-slate-950">{effectivePackageName}</h2>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Total</p>
                          <p className="text-3xl font-black text-primary">${total.toLocaleString()}</p>
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
                          <p className="text-xs font-black">{soloSalon ? 'Flexible' : `${selectedPaquete?.capacidadNinos} niños`}</p>
                        </div>
                      </div>

                      <div className="space-y-5">
                        <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
                          <PartyPopper size={18} className="text-primary" /> Responsables y cumpleañeros
                        </h3>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between gap-3">
                            <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Responsables</label>
                            <button
                              type="button"
                              onClick={() => setResponsables([...responsables, { nombre: '', telefonos: [''] }])}
                              className="inline-flex items-center gap-2 rounded-xl bg-purple-50 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-primary"
                            >
                              <Plus size={14} /> Añadir responsable
                            </button>
                          </div>
                          {responsables.map((responsable, responsableIndex) => (
                            <div key={responsableIndex} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                              <div className="grid grid-cols-[minmax(0,1fr)_40px] gap-3">
                                <input
                                  type="text"
                                  placeholder={`Responsable ${responsableIndex + 1}`}
                                  className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl text-sm font-medium focus:ring-2 ring-primary/20 outline-none transition-all"
                                  value={responsable.nombre}
                                  onChange={(e) => setResponsables(responsables.map((item, index) => index === responsableIndex ? { ...item, nombre: e.target.value } : item))}
                                />
                                <button
                                  type="button"
                                  disabled={responsables.length === 1}
                                  onClick={() => setResponsables(responsables.filter((_, index) => index !== responsableIndex))}
                                  className="flex h-full items-center justify-center rounded-2xl text-slate-300 transition hover:bg-rose-50 hover:text-rose-500 disabled:cursor-not-allowed disabled:opacity-30"
                                >
                                  <Minus size={16} />
                                </button>
                              </div>
                              <div className="mt-3 space-y-2">
                                <div className="flex items-center justify-between gap-3">
                                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Celulares</p>
                                  <button
                                    type="button"
                                    onClick={() => setResponsables(responsables.map((item, index) => index === responsableIndex ? { ...item, telefonos: [...item.telefonos, ''] } : item))}
                                    className="text-[10px] font-black uppercase tracking-widest text-primary"
                                  >
                                    + celular
                                  </button>
                                </div>
                                {responsable.telefonos.map((telefono, phoneIndex) => (
                                  <div key={phoneIndex} className="grid grid-cols-[minmax(0,1fr)_40px] gap-2">
                                    <input
                                      type="tel"
                                      placeholder="Ej. 70000000"
                                      className="w-full px-5 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 ring-primary/20 outline-none transition-all"
                                      value={telefono}
                                      onChange={(e) => setResponsables(responsables.map((item, index) => index === responsableIndex ? { ...item, telefonos: item.telefonos.map((value, valueIndex) => valueIndex === phoneIndex ? e.target.value : value) } : item))}
                                    />
                                    <button
                                      type="button"
                                      disabled={responsable.telefonos.length === 1}
                                      onClick={() => setResponsables(responsables.map((item, index) => index === responsableIndex ? { ...item, telefonos: item.telefonos.filter((_, valueIndex) => valueIndex !== phoneIndex) } : item))}
                                      className="flex h-full items-center justify-center rounded-xl text-slate-300 transition hover:bg-rose-50 hover:text-rose-500 disabled:cursor-not-allowed disabled:opacity-30"
                                    >
                                      <Minus size={14} />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="space-y-3">
                          <div className="flex items-center justify-between gap-3">
                            <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Cumpleañeros</label>
                            <button
                              type="button"
                              onClick={() => setCumpleaneros([...cumpleaneros, { nombre: '', edad: '' }])}
                              className="inline-flex items-center gap-2 rounded-xl bg-purple-50 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-primary"
                            >
                              <Plus size={14} /> Añadir
                            </button>
                          </div>
                          {perfilCliente?.ninos?.length ? (
                            <div className="rounded-2xl border border-purple-100 bg-purple-50/60 p-4">
                              <p className="mb-3 text-[10px] font-black uppercase tracking-widest text-primary">Asociados a tu cuenta</p>
                              <div className="flex flex-wrap gap-2">
                                {perfilCliente.ninos.map((nino) => {
                                  const alreadySelected = cumpleaneros.some(c => c.nombre.trim().toLowerCase() === nino.nombre.trim().toLowerCase());
                                  return (
                                    <button
                                      key={nino.id}
                                      type="button"
                                      disabled={alreadySelected}
                                      onClick={() => addProfileKid(nino)}
                                      className={`rounded-full px-3 py-2 text-xs font-black transition ${
                                        alreadySelected ? 'bg-white text-slate-300 cursor-not-allowed' : 'bg-white text-slate-700 hover:bg-primary hover:text-white'
                                      }`}
                                    >
                                      {nino.nombre}
                                      {calculateAge(nino.fechaNacimiento) ? ` · ${calculateAge(nino.fechaNacimiento)} años` : ''}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          ) : (
                            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-xs font-semibold text-slate-500">
                              No tienes cumpleañeros guardados en esta cuenta. Puedes agregarlos manualmente para esta reserva.
                            </div>
                          )}
                          {cumpleaneros.map((cumpleanero, index) => (
                            <div key={index} className="grid grid-cols-[minmax(0,1fr)_96px_40px] gap-3">
                              <input
                                type="text"
                                placeholder={`Cumpleañero ${index + 1}`}
                                className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium focus:ring-2 ring-primary/20 outline-none transition-all"
                                value={cumpleanero.nombre}
                                onChange={(e) => setCumpleaneros(cumpleaneros.map((item, itemIndex) => itemIndex === index ? { ...item, nombre: e.target.value } : item))}
                              />
                              <input
                                type="number"
                                min="0"
                                placeholder="Edad"
                                className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium focus:ring-2 ring-primary/20 outline-none transition-all"
                                value={cumpleanero.edad}
                                onChange={(e) => setCumpleaneros(cumpleaneros.map((item, itemIndex) => itemIndex === index ? { ...item, edad: e.target.value } : item))}
                              />
                              <button
                                type="button"
                                disabled={cumpleaneros.length === 1}
                                onClick={() => setCumpleaneros(cumpleaneros.filter((_, itemIndex) => itemIndex !== index))}
                                className="flex h-full items-center justify-center rounded-2xl text-slate-300 transition hover:bg-rose-50 hover:text-rose-500 disabled:cursor-not-allowed disabled:opacity-30"
                              >
                                <Minus size={16} />
                              </button>
                            </div>
                          ))}
                        </div>

                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Temática deseada</label>
                          <input
                            type="text"
                            placeholder="Ej. Princesas, dinosaurios, fútbol..."
                            className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium focus:ring-2 ring-primary/20 outline-none transition-all"
                            value={formData.tematica}
                            onChange={(e) => setFormData({...formData, tematica: e.target.value})}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Notas u Observaciones</label>
                          <textarea
                            rows={3}
                            placeholder="Alergias, pedido especial, color favorito, indicaciones para decoración..."
                            className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium focus:ring-2 ring-primary/20 outline-none transition-all resize-none"
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

                      <div className="space-y-4 p-6 bg-slate-50 rounded-[2rem] border border-slate-100">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                          <div>
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Monto a pagar ahora</p>
                            <p className="mt-1 text-xs font-bold text-slate-500">Mínimo {minPayment.toLocaleString()} ({paymentPercent}%)</p>
                          </div>
                          <p className="text-2xl font-black text-primary">${resolvedPaymentAmount.toLocaleString()}</p>
                        </div>
                        <input
                          type="number"
                          min={minPayment}
                          max={total}
                          step="1"
                          value={paymentAmount}
                          onChange={(e) => {
                            const value = Number(e.target.value) || 0;
                            setPaymentAmount(value);
                            setPaymentPercent(total > 0 ? Math.round((value / total) * 100) : 30);
                          }}
                          className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl text-lg font-black text-slate-900 focus:ring-2 ring-primary/20 outline-none transition-all"
                        />
                        <div className="grid grid-cols-3 gap-2">
                          {[30, 50, 100].map((percent) => (
                            <button
                              key={percent}
                              type="button"
                              onClick={() => {
                                setPaymentPercent(percent);
                                setPaymentAmount(Math.round(total * (percent / 100)));
                              }}
                              className={`rounded-xl px-3 py-2 text-xs font-black transition ${paymentPercent === percent ? 'bg-primary text-white' : 'bg-white text-slate-500 hover:bg-purple-50 hover:text-primary'}`}
                            >
                              {percent === 100 ? 'Total' : `${percent}%`}
                            </button>
                          ))}
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
                            Recuerda que para confirmar tu fecha debes subir el comprobante de pago por el monto seleccionado (${resolvedPaymentAmount.toLocaleString()}). Nuestro equipo validará el pago en las próximas 24h.
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={handleSubmit}
                        disabled={!canContinue() || loading}
                        className="w-full py-6 bg-slate-900 text-white font-black text-[10px] uppercase tracking-widest rounded-[2rem] hover:bg-primary transition-all shadow-xl shadow-slate-900/20 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 flex items-center justify-center gap-2"
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
                <h2 className="text-4xl font-black text-slate-800 tracking-tight">¡Reserva <span className="text-primary italic">Confirmada</span> para {validCumpleaneros[0]?.nombre || 'tu peque'}!</h2>
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
            onClick={goNext}
            disabled={!canContinue() || loading}
            className="bg-primary text-white px-8 py-4 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-primary/20 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
          >
            {getNextLabel()}
          </button>
        </div>
      )}
    </div>
  );
};

export default BookingPage;



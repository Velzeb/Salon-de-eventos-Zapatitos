import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, 
  CalendarDays, 
  Clock, 
  CreditCard, 
  Star, 
  Sparkles, 
  Gift,
  CheckCircle,
  Image as ImageIcon,
  MapPin,
  X,
  Upload,
  Camera,
  ExternalLink,
  MessageCircle,
  Play
} from 'lucide-react';
import { clientePortalService, type EventoClienteDetail } from '../../services/clientePortalService';

import { toast } from 'sonner';

const EventoClienteDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<EventoClienteDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPagoModal, setShowPagoModal] = useState(false);
  const [pagoMonto, setPagoMonto] = useState('');
  const [comprobanteB64, setComprobanteB64] = useState<string | undefined>(undefined);
  const [enviandoPago, setEnviandoPago] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  // Calificación
  const [rating, setRating] = useState(0);
  const [ratingHover, setRatingHover] = useState(0);
  const [comentario, setComentario] = useState('');
  const [enviandoRating, setEnviandoRating] = useState(false);
  const [ratingEnviado, setRatingEnviado] = useState(false);

  const [activeTab, setActiveTab] = useState<'overview' | 'items' | 'payments' | 'gallery'>('overview');

  const loadData = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [detail] = await Promise.all([
        clientePortalService.getEventoDetail(parseInt(id)),
      ]);
      setData(detail);
    } catch (err) {
      console.error('Error al cargar detalle del evento', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      toast.error('Solo se permiten imágenes JPEG o PNG.');
      return;
    }

    if (file.size > 2 * 1024 * 1024) { // 2MB
      toast.error('El tamaño de la imagen no debe superar los 2MB.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => setComprobanteB64(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handlePago = async () => {
    if (!id || !pagoMonto || parseFloat(pagoMonto) <= 0) {
      toast.error('Ingrese un monto válido.');
      return;
    }
    if (!comprobanteB64) {
      toast.error('Es obligatorio subir la foto del comprobante.');
      return;
    }

    setEnviandoPago(true);
    try {
      await clientePortalService.addPagoQR(parseInt(id), parseFloat(pagoMonto), comprobanteB64);
      setShowPagoModal(false);
      setPagoMonto('');
      setComprobanteB64(undefined);
      await loadData();
      toast.success('¡Pago registrado! El equipo verificará tu comprobante.');
    } catch (err: any) {
      toast.error(err.response?.data?.join(', ') || 'Error al registrar el pago.');
    } finally {
      setEnviandoPago(false);
    }
  };

  const handleRating = async () => {
    if (!id || rating === 0) return;
    setEnviandoRating(true);
    try {
      await clientePortalService.addFeedback({ eventoId: parseInt(id), calificacion: rating, comentario: comentario || undefined });
      setRatingEnviado(true);
      await loadData();
    } catch (err: any) {
      alert(err.response?.data?.join(', ') || 'Error al enviar tu calificación.');
    } finally {
      setEnviandoRating(false);
    }
  };

  const openInvitation = () => {
    if (!data?.invitacionToken) return;
    const url = `${window.location.origin}/invitacion/${data.invitacionToken}`;
    window.open(url, '_blank');
  };

  useEffect(() => {
    loadData();
  }, [id]);

  if (loading || !data) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        <p className="text-slate-400 font-black text-[10px] uppercase tracking-widest">Preparando los detalles mágicos...</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-full overflow-x-hidden space-y-8 md:space-y-12 pb-20">
      
      {/* TOP NAVIGATION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <button 
            onClick={() => navigate('/cliente/dashboard')}
            className="group flex items-center gap-3 text-slate-400 hover:text-primary transition-all font-black text-[10px] uppercase tracking-widest w-fit"
          >
            <div className="w-10 h-10 rounded-2xl bg-white border border-slate-100 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all shadow-sm">
              <ChevronLeft size={18} />
            </div>
            Volver al Dashboard
          </button>
          
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-emerald-50 rounded-full border border-emerald-100">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[9px] font-black uppercase tracking-widest text-emerald-600">Portal del Cliente Activo</span>
            </div>
            <span className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest text-white shadow-lg ${
              data.estado.toLowerCase() === 'confirmado' ? 'bg-emerald-500' :
              data.estado.toLowerCase() === 'pendiente' ? 'bg-amber-500' :
              data.estado.toLowerCase() === 'completado' ? 'bg-indigo-500' :
              'bg-slate-400'
            }`}>
              {data.estado}
            </span>
          </div>
        </div>

      {/* HERO SECTION - REFACTORED BENTO GRID LAYOUT */}
      <div className="relative overflow-hidden rounded-[3rem] bg-slate-950 text-white shadow-2xl shadow-slate-950/20 border border-white/10 flex flex-col min-h-fit">
        {/* PREMIUM BACKGROUND LAYER */}
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?auto=format&fit=crop&q=80&w=2000" 
            alt="Event Background" 
            className="w-full h-full object-cover opacity-40 mix-blend-overlay scale-110 blur-[2px]"
          />
          <div className="absolute inset-0 bg-gradient-to-tr from-slate-950 via-slate-950/90 to-transparent" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(var(--primary-rgb),0.15),transparent_50%)]" />
        </div>
        
        {/* GRID CONTAINER */}
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 w-full h-full">
          {/* MAIN INFO (Left Column) */}
          <div className="lg:col-span-8 p-8 md:p-12 lg:p-16 flex flex-col justify-center space-y-10 md:space-y-12">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-3 px-5 py-2 bg-primary/20 backdrop-blur-xl rounded-full border border-primary/30 text-[10px] font-black uppercase tracking-[0.2em] text-primary shadow-lg shadow-primary/10">
                <Sparkles size={14} className="animate-pulse" />
                Celebración {data.paquete}
              </div>
              
              <div className="space-y-3">
                <p className="text-slate-400 font-black text-xs uppercase tracking-[0.3em] ml-1">Tu gran momento</p>
                <h1 className="text-4xl md:text-6xl lg:text-7xl font-display font-black tracking-tight leading-[1.05] drop-shadow-2xl">
                  La Fiesta de <br />
                  <span className="text-primary italic inline-block mt-2">{data.nombreCumpleaneros}</span>
                </h1>
              </div>
            </div>

            {/* EVENT STATS BAR */}
            <div className="flex flex-wrap gap-8 md:gap-12 p-8 bg-white/5 backdrop-blur-md rounded-[2.5rem] border border-white/5 w-fit">
              <div className="flex items-center gap-5 group">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shadow-inner group-hover:scale-110 transition-transform">
                  <CalendarDays size={24} />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Día del Evento</span>
                  <span className="text-lg font-black tracking-tight">
                    {new Date(data.fechaEvento).toLocaleDateString('es-ES', { day: '2-digit', month: 'long' })}
                  </span>
                </div>
              </div>
              
              <div className="w-px h-12 bg-white/10 hidden sm:block" />

              <div className="flex items-center gap-5 group">
                <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 border border-indigo-500/20 shadow-inner group-hover:scale-110 transition-transform">
                  <Clock size={24} />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Horario</span>
                  <span className="text-lg font-black tracking-tight">{data.horaInicio.substring(0,5)} — {data.horaFin.substring(0,5)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* STATUS PANEL (Right Column) */}
          <div className="lg:col-span-4 bg-white/5 backdrop-blur-xl border-l border-white/5 p-8 md:p-12 lg:p-16 flex flex-col justify-between gap-12 lg:min-h-[500px]">
            {/* INVITATION SECTION */}
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary">
                  <Gift size={20} />
                </div>
                <h3 className="text-lg font-black tracking-tight">Tu Invitación</h3>
              </div>
              <p className="text-slate-400 text-sm font-medium leading-relaxed">Comparte el link digital personalizado con todos tus invitados.</p>
              <button 
                onClick={openInvitation}
                className="w-full py-5 bg-primary text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl shadow-primary/40 hover:bg-secondary hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3"
              >
                Ver Mi Invitación Digital <ExternalLink size={16} />
              </button>
            </div>

            {/* FINANCIAL SECTION */}
            <div className="space-y-6 pt-10 border-t border-white/10">
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Estado de Cuenta</span>
                  <span className="text-sm font-bold text-slate-300">Resumen financiero</span>
                </div>
                <div className={`px-4 py-2 rounded-full text-[8px] font-black uppercase tracking-[0.2em] shadow-lg ${
                  data.saldoPendiente > 0 ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                }`}>
                  {data.saldoPendiente > 0 ? 'Saldo Pendiente' : 'Pagado'}
                </div>
              </div>

              <div className="bg-black/30 rounded-3xl p-8 border border-white/5 space-y-2 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-colors" />
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Saldo a Cancelar</p>
                <p className={`text-4xl font-black ${data.saldoPendiente > 0 ? 'text-white' : 'text-emerald-400'} tabular-nums`}>
                  ${data.saldoPendiente.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

        {/* STICKY TABS NAVIGATION - Adjusted top for ClientLayout Topbar (h-20 = 80px) */}
        <div className="sticky top-20 z-50 flex overflow-x-auto py-3 px-1 bg-white/80 backdrop-blur-2xl rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50 scrollbar-hide gap-2">
          {[
            { id: 'overview', label: 'Detalles', icon: Sparkles },
            { id: 'items', label: 'Servicios', icon: ImageIcon },
            { id: 'payments', label: 'Historial Pagos', icon: CreditCard },
            { id: 'gallery', label: 'Fotos', icon: Camera }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2.5 px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest whitespace-nowrap transition-all ${
                activeTab === tab.id 
                  ? 'bg-primary text-white shadow-lg shadow-primary/30 scale-[1.02]' 
                  : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'
              }`}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* TAB CONTENT GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12 items-start">
          
          {/* MAIN COLUMN */}
          <div className="lg:col-span-8 space-y-8">
            {activeTab === 'overview' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* UBICACION - REFACTORED FOR BETTER CONTENT FLOW */}
                <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-premium overflow-hidden group">
                  <div className="h-48 md:h-64 bg-slate-100 relative grayscale group-hover:grayscale-0 transition-all duration-700">
                    <img src="https://images.unsplash.com/photo-1524813686514-a57563d77965?auto=format&fit=crop&q=80&w=1200" className="w-full h-full object-cover" alt="mapa" />
                    <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent" />
                    <div className="absolute bottom-6 left-8">
                      <div className="px-4 py-1.5 bg-primary rounded-full text-white text-[9px] font-black uppercase tracking-widest shadow-xl">
                        Sede del Evento
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-8 md:p-10 space-y-6">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                      <div className="space-y-2">
                        <h3 className="text-2xl font-black text-slate-800 tracking-tight">Lugar de la Fiesta</h3>
                        <p className="text-slate-400 text-sm font-medium">Aquí es donde ocurrirá la magia.</p>
                      </div>
                      <a 
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(data.direccion || data.nombreNegocio)}`} 
                        target="_blank" 
                        rel="noreferrer"
                        className="flex items-center gap-2 text-primary font-black text-[10px] uppercase tracking-widest hover:underline"
                      >
                        <MapPin size={14} /> Abrir en Google Maps
                      </a>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 space-y-3">
                        <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-primary shadow-sm">
                          <MapPin size={20} />
                        </div>
                        <div className="space-y-1">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Dirección Exacta</span>
                          <span className="text-sm font-bold text-slate-700 leading-relaxed block break-words">
                            {data.direccion || 'Dirección por confirmar'}
                          </span>
                        </div>
                      </div>

                      <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 space-y-3">
                        <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-primary shadow-sm">
                          <Sparkles size={20} />
                        </div>
                        <div className="space-y-1">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Local / Salón</span>
                          <span className="text-sm font-bold text-slate-700 leading-relaxed block">
                            {data.nombreNegocio || 'Zapatitos Centro de Eventos'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* BRIEFING DETAILS */}
                    <div className="pt-8 border-t border-slate-50 space-y-6">
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Configuración de tu Fiesta</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        {[
                          { label: 'Temática', value: data.tematica, icon: Star },
                          { label: 'Mantelería', value: data.colorManteleria, icon: Sparkles },
                          { label: 'Sabor Pastel', value: data.saborPastel, icon: Gift },
                          { label: 'Alergias', value: data.alergias, icon: CheckCircle, color: data.alergias ? 'text-rose-500' : 'text-emerald-500' }
                        ].map((item, i) => (
                          <div key={i} className="space-y-2">
                            <div className="flex items-center gap-2 text-slate-400">
                              <item.icon size={14} />
                              <span className="text-[9px] font-black uppercase tracking-widest">{item.label}</span>
                            </div>
                            <p className={`text-xs font-bold ${item.color || 'text-slate-700'}`}>{item.value || 'Por definir'}</p>
                          </div>
                        ))}
                      </div>
                      
                      {data.notasDecoracion && (
                        <div className="p-5 bg-amber-50 rounded-2xl border border-amber-100">
                          <p className="text-[9px] font-black text-amber-600 uppercase tracking-widest mb-1">Notas de Decoración</p>
                          <p className="text-xs text-amber-900/80 font-medium">{data.notasDecoracion}</p>
                        </div>
                      )}

                      <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <div className={`w-3 h-3 rounded-full ${data.consentimientoMarketing ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                          {data.consentimientoMarketing 
                            ? 'Has autorizado el uso de material para marketing' 
                            : 'No has autorizado el uso de material para marketing'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* FEEDBACK - Solo si completado */}
                {data.estado.toLowerCase() === 'completado' && !data.yaCalificado && !ratingEnviado && (
                  <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-premium p-10 space-y-8">
                    <div className="text-center space-y-2">
                      <h3 className="text-2xl font-black text-slate-800 tracking-tight">¿Qué te pareció la fiesta?</h3>
                      <p className="text-slate-400 text-sm font-medium">Tu opinión nos ayuda a crear más magia.</p>
                    </div>
                    <div className="flex justify-center gap-3">
                      {[1,2,3,4,5].map((star) => (
                        <button 
                          key={star} 
                          onClick={() => setRating(star)}
                          onMouseEnter={() => setRatingHover(star)}
                          onMouseLeave={() => setRatingHover(0)}
                          className="transition-transform hover:scale-110 active:scale-90"
                        >
                          <Star size={40} className={`transition-colors ${star <= (ratingHover || rating) ? 'text-amber-400 fill-amber-400' : 'text-slate-200'}`} />
                        </button>
                      ))}
                    </div>
                    {rating > 0 && (
                      <div className="space-y-4 animate-in zoom-in-95 duration-300 max-w-md mx-auto">
                        <textarea 
                          value={comentario} 
                          onChange={(e) => setComentario(e.target.value)}
                          placeholder="Escribe un comentario opcional..."
                          className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-5 text-sm outline-none focus:border-primary transition-colors resize-none"
                          rows={3}
                        />
                        <button onClick={handleRating} disabled={enviandoRating} className="w-full py-4 bg-amber-400 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-amber-400/20">
                          {enviandoRating ? 'Enviando...' : 'Enviar Calificación'}
                        </button>
                      </div>
                    )}
                  </div>
                )}
                
                {/* CALIFICACIÓN ENVIADA */}
                {(data.yaCalificado || ratingEnviado) && (
                  <div className="bg-emerald-50 rounded-[2.5rem] border border-emerald-100 p-10 text-center space-y-4">
                    <div className="w-16 h-16 bg-emerald-500 rounded-2xl flex items-center justify-center text-white mx-auto shadow-lg shadow-emerald-500/20">
                      <CheckCircle size={32} />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-xl font-black text-emerald-900">¡Gracias por tu opinión!</h3>
                      <p className="text-sm font-medium text-emerald-600/80">Tu feedback es el motor de nuestra magia diaria.</p>
                    </div>
                  </div>
                )}

                {/* UPSELL / PROXIMO EVENTO */}
                <div className="bg-gradient-to-br from-primary to-blue-600 rounded-[2.5rem] p-10 md:p-12 text-white relative overflow-hidden shadow-2xl shadow-primary/20">
                  <div className="absolute top-0 right-0 p-8 opacity-10">
                    <Sparkles size={120} />
                  </div>
                  <div className="relative z-10 space-y-6 max-w-lg">
                    <h3 className="text-3xl font-black leading-tight">¿Planeando la próxima aventura?</h3>
                    <p className="text-blue-50 font-medium leading-relaxed">
                      Como cliente frecuente de Zapatitos, tienes acceso a preventas exclusivas y beneficios especiales en tu siguiente reserva.
                    </p>
                    <button 
                      onClick={() => navigate('/booking')}
                      className="inline-flex items-center gap-3 px-8 py-4 bg-white text-primary rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 transition-transform shadow-xl"
                    >
                      Reservar Nueva Fecha <ChevronLeft size={16} className="rotate-180" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'items' && (
              <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-premium p-8 md:p-10 space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="space-y-2 border-b border-slate-50 pb-8">
                  <p className="text-[10px] font-black text-primary uppercase tracking-widest">Contratación</p>
                  <h3 className="text-3xl font-black text-slate-800 tracking-tight">Detalle de Servicios</h3>
                  <p className="text-slate-400 text-sm font-medium">Revisa todo lo incluido para que no falte nada en tu gran día.</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {data.items.map((item, idx) => (
                    <div key={idx} className="group flex items-center justify-between p-6 bg-slate-50 rounded-3xl border border-slate-100 hover:border-primary/20 hover:bg-white hover:shadow-xl transition-all duration-300">
                      <div className="flex items-center gap-5">
                        <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-primary shadow-sm group-hover:scale-110 transition-transform">
                          {item.esExtra ? <Sparkles size={24} /> : <Gift size={24} />}
                        </div>
                        <div>
                          <p className="font-black text-slate-800 tracking-tight">{item.nombre}</p>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Cant: {item.cantidad}</span>
                            {item.esExtra && (
                              <span className="px-2 py-0.5 bg-amber-100 text-amber-600 rounded-full text-[8px] font-black uppercase tracking-widest">Extra</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <span className="text-sm font-black text-slate-500 group-hover:text-primary transition-colors">
                        {item.precio > 0 ? `$${item.precio.toLocaleString()}` : 'Incluido'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'payments' && (
              <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-premium p-8 md:p-10 space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-50 pb-8">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-primary uppercase tracking-widest">Finanzas</p>
                    <h3 className="text-3xl font-black text-slate-800 tracking-tight">Historial de Pagos</h3>
                  </div>
                  <div className="bg-slate-900 rounded-2xl p-6 text-white flex gap-10">
                    <div className="space-y-1">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Total</span>
                      <span className="text-lg font-black">${data.precioTotal.toLocaleString()}</span>
                    </div>
                    <div className="w-px bg-white/10" />
                    <div className="space-y-1">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Pendiente</span>
                      <span className="text-lg font-black text-rose-400">${data.saldoPendiente.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  {data.pagos && data.pagos.length > 0 ? (
                    data.pagos.map((pago, idx) => (
                      <div key={idx} className="flex items-center justify-between p-6 bg-white border border-slate-100 rounded-3xl hover:shadow-lg transition-all">
                        <div className="flex items-center gap-5">
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                            pago.estado.toLowerCase() === 'verificado' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-500'
                          }`}>
                            <CreditCard size={20} />
                          </div>
                          <div>
                            <p className="font-black text-slate-800">${pago.monto.toLocaleString()}</p>
                            <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">
                              {new Date(pago.fechaPago).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                            pago.estado.toLowerCase() === 'verificado' 
                              ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                              : 'bg-amber-50 text-amber-600 border-amber-100'
                          }`}>
                            {pago.estado}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-20 text-center space-y-4 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                      <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-slate-200 mx-auto shadow-sm">
                        <CreditCard size={32} />
                      </div>
                      <p className="text-sm font-black text-slate-400 uppercase tracking-widest">No hay pagos registrados aún</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'gallery' && (
              <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-premium p-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  {data.galeriaMultimedia && data.galeriaMultimedia.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                      {data.galeriaMultimedia.map((item) => (
                        <div key={item.id} className="group relative aspect-square bg-slate-50 rounded-3xl overflow-hidden border border-slate-100 hover:shadow-2xl transition-all duration-500">
                          {item.tipoArchivo === 'Video' ? (
                            <div className="w-full h-full flex items-center justify-center bg-slate-900">
                              <Play size={40} className="text-white opacity-40 group-hover:scale-110 transition-transform" />
                            </div>
                          ) : (
                            <img src={item.url} alt={item.nombreArchivo} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                          )}
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <a href={item.url} target="_blank" rel="noreferrer" className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-slate-900 hover:scale-110 transition-transform">
                              <ExternalLink size={20} />
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-20 text-center space-y-4">
                      <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center text-slate-200 mx-auto border border-slate-100 shadow-inner">
                        <Camera size={32} />
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-black text-slate-800 uppercase tracking-widest">Recuerdos en proceso</p>
                        <p className="text-xs text-slate-400 max-w-xs mx-auto font-medium">Estamos procesando los mejores momentos de tu celebración para que puedas descargarlos pronto.</p>
                      </div>
                    </div>
                  )}
              </div>
            )}
          </div>

          {/* SIDEBAR COLUMN */}
          <div className="lg:col-span-4 space-y-8 sticky top-28">
            
            {/* QUICK SUMMARY CARD */}
            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-premium p-8 space-y-8">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-50 pb-4">Resumen de Cuenta</h4>
              <div className="space-y-6">
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400 font-medium">Presupuesto Contratado</span>
                    <span className="font-black text-slate-700">${data.precioTotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400 font-medium">Total Abonado</span>
                    <span className="font-black text-emerald-500">${(data.precioTotal - data.saldoPendiente).toLocaleString()}</span>
                  </div>
                </div>
                <div className="pt-6 border-t border-slate-100">
                  <div className="flex justify-between items-center bg-rose-50 p-5 rounded-2xl border border-rose-100">
                    <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest">Saldo Pendiente</span>
                    <span className="text-2xl font-black text-rose-500">${data.saldoPendiente.toLocaleString()}</span>
                  </div>
                </div>
              </div>
              {data.saldoPendiente > 0 && (
                <button 
                  onClick={() => setShowPagoModal(true)}
                  className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-primary transition-all shadow-xl shadow-slate-900/20 active:scale-95"
                >
                  Informar Pago <CreditCard size={16} className="inline ml-2" />
                </button>
              )}
            </div>

            {/* ASISTENCIA CARD */}
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-[2.5rem] p-8 text-white space-y-6 shadow-2xl relative overflow-hidden group">
              <div className="absolute -right-8 -bottom-8 opacity-10 group-hover:scale-110 transition-transform duration-700">
                <Sparkles size={160} />
              </div>
              <div className="space-y-2 relative z-10">
                <p className="text-[10px] font-black uppercase tracking-widest text-primary">Atención Personalizada</p>
                <h4 className="text-xl font-black leading-tight">¿Necesitas ayuda con los detalles?</h4>
              </div>
              <p className="text-xs text-slate-400 font-medium leading-relaxed relative z-10">Nuestro equipo está listo para asistirte en cualquier cambio o duda sobre tu evento.</p>
              <a 
                href={`https://wa.me/521234567890?text=${encodeURIComponent(`Hola! Tengo una duda sobre mi evento ${data.paquete} para ${data.nombreCumpleaneros}`)}`}
                target="_blank"
                rel="noreferrer"
                className="w-full py-4 bg-white/10 hover:bg-white/20 backdrop-blur-xl text-white border border-white/10 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all relative z-10 flex items-center justify-center gap-2"
              >
                <MessageCircle size={16} /> Contactar por WhatsApp
              </a>
            </div>
          </div>
        </div>

      {/* MODAL PAGO */}
      {showPagoModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4">
          <div className="bg-white rounded-[3rem] shadow-2xl p-10 w-full max-w-md space-y-8 animate-in zoom-in-95 duration-300">
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-black text-slate-800 tracking-tight">Informar Pago</h3>
              <button onClick={() => setShowPagoModal(false)} className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center hover:bg-rose-50 hover:text-rose-500 transition-all"><X size={20} /></button>
            </div>
            
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Monto depositado</label>
                <div className="relative">
                  <span className="absolute left-6 top-1/2 -translate-y-1/2 text-2xl font-black text-slate-300">$</span>
                  <input 
                    type="number" 
                    value={pagoMonto} 
                    onChange={(e) => setPagoMonto(e.target.value)} 
                    className="w-full pl-12 pr-6 py-5 bg-slate-50 border border-slate-100 rounded-2xl text-2xl font-black text-slate-800 outline-none focus:border-primary transition-all"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Foto del Comprobante</label>
                <div onClick={() => fileRef.current?.click()} className="w-full border-2 border-dashed border-slate-200 rounded-3xl p-10 flex flex-col items-center gap-4 cursor-pointer hover:border-primary hover:bg-primary/5 transition-all group">
                  {comprobanteB64 ? (
                    <img src={comprobanteB64} alt="comprobante" className="max-h-32 rounded-xl shadow-lg" />
                  ) : (
                    <>
                      <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300 group-hover:text-primary transition-colors">
                        <Upload size={32} />
                      </div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Seleccionar Archivo</p>
                    </>
                  )}
                </div>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
              </div>

              <button 
                onClick={handlePago}
                disabled={enviandoPago || !pagoMonto}
                className="w-full py-5 bg-primary text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-secondary transition-all shadow-xl shadow-primary/30 disabled:opacity-50"
              >
                {enviandoPago ? 'Procesando...' : 'Confirmar Reporte'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventoClienteDetailPage;

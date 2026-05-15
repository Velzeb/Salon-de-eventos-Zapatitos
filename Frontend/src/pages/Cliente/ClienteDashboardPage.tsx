import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  CalendarDays, 
  CreditCard, 
  PartyPopper, 
  RefreshCw, 
  ChevronRight,
  Plus,
  User
} from 'lucide-react';
import { clientePortalService, type ClienteEvento } from '../../services/clientePortalService';

const ClienteDashboardPage = () => {
  const [eventos, setEventos] = useState<ClienteEvento[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadEventos();
  }, []);

  const loadEventos = async () => {
    setLoading(true);
    try {
      const data = await clientePortalService.getMisEventos();
      setEventos(data);
    } catch (err) {
      console.error('Error al cargar eventos', err);
    } finally {
      setLoading(false);
    }
  };

  const resumen = useMemo(() => {
    const totalEventos = eventos.length;
    const saldoPendiente = eventos.reduce((sum, e) => sum + e.saldoPendiente, 0);
    const proximos = eventos
      .filter(e => e.estado.toLowerCase() !== 'completado' && e.estado.toLowerCase() !== 'cancelado')
      .sort((a, b) => new Date(a.fechaEvento).getTime() - new Date(b.fechaEvento).getTime());
    
    return { totalEventos, saldoPendiente, proximo: proximos[0] };
  }, [eventos]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        <p className="text-slate-400 font-black text-[10px] uppercase tracking-widest">Preparando tu panel mágico...</p>
      </div>
    );
  }

  return (
    <div className="space-y-12 animate-in fade-in duration-700 max-w-6xl mx-auto pb-20">
      {/* HERO BANNER */}
      <div className="relative overflow-hidden rounded-[3rem] bg-slate-900 text-white shadow-2xl shadow-slate-900/30 min-h-[400px] flex items-center">
        <div className="absolute inset-0">
          <img 
            src="https://images.unsplash.com/photo-1530103862676-fa8c91abeaba?auto=format&fit=crop&q=80&w=2000" 
            alt="Festa" 
            className="w-full h-full object-cover opacity-50 scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-900/70 to-transparent" />
        </div>
        
        <div className="relative p-10 lg:p-20 space-y-8 max-w-2xl">
          <div className="inline-flex items-center gap-3 px-4 py-1.5 bg-white/10 backdrop-blur-xl rounded-full border border-white/20 text-[10px] font-black uppercase tracking-[0.25em]">
            <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />
            Portal de Experiencias
          </div>
          <h1 className="text-5xl lg:text-6xl font-display font-black tracking-tighter leading-[1.05]">
            Crea Momentos <br />
            <span className="text-primary italic">Inolvidables</span>
          </h1>
          <p className="text-slate-300 text-lg font-medium leading-relaxed max-w-lg">
            Tu próximo gran evento comienza aquí. Gestiona tus fiestas actuales o descubre nuevas formas de celebrar con la magia de Zapatitos.
          </p>
          <div className="flex flex-wrap gap-5 pt-4">
            <button 
              onClick={() => navigate('/reservar')}
              className="bg-primary text-white px-10 py-5 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-secondary hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-primary/40 flex items-center gap-3"
            >
              Hacer Nueva Reserva <ChevronRight size={18} />
            </button>
            <button 
              onClick={() => navigate('/cliente/perfil')}
              className="bg-white/10 backdrop-blur-md text-white border border-white/20 px-8 py-5 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-white/20 transition-all flex items-center gap-3"
            >
              <User size={16} /> Mi Perfil
            </button>
          </div>
        </div>
      </div>

      {/* STATS SECTION */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {[
          { label: 'Tus Celebraciones', val: resumen.totalEventos, icon: PartyPopper, color: 'text-indigo-600', bg: 'bg-indigo-50' },
          { label: 'Saldo Pendiente', val: `$${resumen.saldoPendiente.toLocaleString()}`, icon: CreditCard, color: resumen.saldoPendiente > 0 ? 'text-rose-600' : 'text-emerald-600', bg: resumen.saldoPendiente > 0 ? 'bg-rose-50' : 'bg-emerald-50' },
          { label: 'Próxima Cita', val: resumen.proximo ? new Date(resumen.proximo.fechaEvento).toLocaleDateString() : 'Por definir', icon: CalendarDays, color: 'text-blue-600', bg: 'bg-blue-50' }
        ].map((stat, i) => (
          <div key={i} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-premium flex items-center gap-6 group hover:translate-y-[-4px] transition-all duration-300">
            <div className={`w-16 h-16 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center shrink-0 shadow-inner`}>
              <stat.icon size={32} />
            </div>
            <div className="space-y-1">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">{stat.label}</span>
              <p className={`text-3xl font-black ${stat.color} tracking-tight`}>{stat.val}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* EVENT LIST */}
        <div className="lg:col-span-2 space-y-8">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-3">
              <div className="w-3 h-10 bg-primary rounded-full shadow-lg shadow-primary/20" />
              Tus Reservas Activas
            </h2>
            <button onClick={loadEventos} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400">
              <RefreshCw size={20} />
            </button>
          </div>
          
          <div className="grid grid-cols-1 gap-8">
            {eventos.length > 0 ? (
              eventos.map((e) => (
                <div 
                  key={e.id} 
                  className="group bg-white rounded-[2.5rem] border border-slate-100 shadow-premium hover:shadow-2xl hover:border-primary/20 transition-all duration-500 cursor-pointer flex flex-col md:flex-row overflow-hidden"
                  onClick={() => navigate(`/cliente/eventos/${e.id}`)}
                >
                  <div className="w-full md:w-64 h-48 md:h-auto relative bg-slate-100 overflow-hidden">
                    <img 
                      src={`https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&q=80&w=600`} 
                      alt="Event" 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"
                    />
                    <div className="absolute top-6 left-6">
                      <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest text-white shadow-2xl backdrop-blur-md ${
                        e.estado.toLowerCase() === 'confirmado' ? 'bg-emerald-500/90' :
                        e.estado.toLowerCase() === 'pendiente' ? 'bg-amber-500/90' :
                        'bg-slate-400/90'
                      }`}>
                        {e.estado}
                      </span>
                    </div>
                  </div>
                  <div className="p-10 flex-1 space-y-6">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.25em]">Código de Evento #{e.id}</span>
                      <div className="flex items-center gap-2 text-slate-400">
                        <CalendarDays size={16} className="text-primary" />
                        <span className="text-xs font-black uppercase tracking-wider">{new Date(e.fechaEvento).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-2xl font-black text-slate-800 group-hover:text-primary transition-colors tracking-tight">
                        {e.nombreCumpleanero ? `Cumpleaños de ${e.nombreCumpleanero}` : `Fiesta de ${e.paquete}`}
                      </h3>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{e.paquete}</p>
                    </div>
                    <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Inversión Total</span>
                        <span className="text-xl font-black text-slate-800">${e.precioTotal.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center gap-3 px-6 py-3 bg-slate-50 rounded-2xl group-hover:bg-primary group-hover:text-white transition-all duration-300 shadow-sm">
                        <span className="text-[10px] font-black uppercase tracking-widest">Ver Mi Evento</span>
                        <ChevronRight size={16} />
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-slate-50 rounded-[3rem] p-20 border-2 border-dashed border-slate-200 flex flex-col items-center text-center space-y-6">
                <div className="w-24 h-24 bg-white rounded-[2rem] shadow-xl shadow-slate-200/50 flex items-center justify-center text-slate-200">
                  <PartyPopper size={48} />
                </div>
                <div className="space-y-2">
                  <p className="text-2xl font-black text-slate-800 tracking-tight">Tu agenda está lista para la magia</p>
                  <p className="text-slate-500 font-medium text-base max-w-md">¡Comencemos a planear algo extraordinario hoy mismo! Revisa nuestras fechas disponibles.</p>
                </div>
                <button 
                  onClick={() => navigate('/reservar')}
                  className="mt-4 px-10 py-4 bg-primary text-white font-black rounded-2xl hover:bg-secondary transition-all shadow-xl shadow-primary/30 text-xs uppercase tracking-widest"
                >
                  Ver Calendario de Disponibilidad
                </button>
              </div>
            )}
          </div>
        </div>

        {/* SIDEBAR EXPLORE */}
        <div className="space-y-10">
          <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-premium p-10 space-y-8">
            <h3 className="text-xl font-black text-slate-800 tracking-tight">Lleva tu fiesta al <span className="text-primary italic">Siguiente Nivel</span></h3>
            <div className="space-y-6">
              {[
                { name: 'Show de Magia Pro', img: 'https://images.unsplash.com/photo-1504194104404-4cd3c27f354b?auto=format&fit=crop&q=80&w=400', tag: 'Top Ventas' },
                { name: 'Candy Bar Temático', img: 'https://images.unsplash.com/photo-1533910534207-90f31029a78e?auto=format&fit=crop&q=80&w=400', tag: 'Nuevo' },
                { name: 'Fotografía & Video', img: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&q=80&w=400', tag: 'Recomendado' }
              ].map((item, i) => (
                <div key={i} className="group flex items-center gap-5 cursor-pointer">
                  <div className="w-20 h-20 rounded-[1.5rem] overflow-hidden shrink-0 border border-slate-50 shadow-sm relative">
                    <img src={item.img} alt={item.name} className="w-full h-full object-cover group-hover:scale-125 transition-transform duration-700" />
                    <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/20 transition-all" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[8px] font-black px-2 py-0.5 bg-primary/10 text-primary rounded-md uppercase tracking-[0.15em]">{item.tag}</span>
                    </div>
                    <p className="text-sm font-black text-slate-700 group-hover:text-primary transition-colors leading-tight">{item.name}</p>
                    <p className="text-[10px] font-bold text-slate-400">Desde $45.00</p>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-primary group-hover:text-white transition-all">
                    <Plus size={16} />
                  </div>
                </div>
              ))}
            </div>
            <button className="w-full py-4 bg-slate-50 rounded-2xl text-slate-500 font-black text-[10px] uppercase tracking-widest hover:bg-slate-100 transition-all border border-slate-50">
              Ver Catálogo de Servicios
            </button>
          </div>

          <div className="bg-gradient-to-br from-indigo-600 to-primary rounded-[2.5rem] p-10 text-white space-y-6 relative overflow-hidden shadow-2xl shadow-indigo-600/30">
            <div className="absolute -top-12 -right-12 w-40 h-40 bg-white/10 rounded-full blur-3xl animate-pulse" />
            <h3 className="text-xl font-black tracking-tight leading-tight">¿Necesitas ayuda con tu plan?</h3>
            <p className="text-indigo-100 text-sm font-medium leading-relaxed">Nuestros Wedding & Party Planners están listos para asesorarte de forma personalizada.</p>
            <button className="w-full py-4 bg-white text-indigo-600 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-50 transition-all shadow-xl">
              Contactar con Asesor
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClienteDashboardPage;

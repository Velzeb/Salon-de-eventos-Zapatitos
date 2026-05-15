import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Calendar, 
  RefreshCw, 
  Activity, 
  Clock, 
  Search, 
  DollarSign, 
  BarChart3,
  LayoutGrid,
  ChevronRight,
  Package,
  AlertCircle
} from 'lucide-react';
import { eventosService, type Evento } from '../../services/eventosService';
import { motion, AnimatePresence } from 'framer-motion';

const OperativoPage = () => {
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'today' | 'pending-payment' | 'operational'>('all');
  const navigate = useNavigate();

  const loadEventos = async () => {
    setLoading(true);
    try {
      const data = await eventosService.getEventos();
      setEventos(data);
    } catch (err) {
      console.error('Error al cargar eventos para operativo', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEventos();
  }, []);

  const todayStr = new Date().toISOString().split('T')[0];

  // COMPUTED STATS
  const stats = useMemo(() => {
    const today = eventos.filter(e => e.fechaEvento.startsWith(todayStr));
    const pendingMoney = eventos.reduce((sum, e) => sum + e.saldoPendiente, 0);
    const avgProgress = eventos.length > 0 
      ? eventos.reduce((sum, e) => sum + (e.tareasTotales > 0 ? (e.tareasCompletadas / e.tareasTotales) * 100 : 0), 0) / eventos.length 
      : 0;

    return {
      todayCount: today.length,
      pendingTotal: pendingMoney,
      avgProgress: Math.round(avgProgress),
      totalEvents: eventos.length
    };
  }, [eventos, todayStr]);

  // FILTERED LIST
  const filteredEventos = useMemo(() => {
    return eventos.filter(e => {
      const matchesSearch = e.cumpleaneros.join(' ').toLowerCase().includes(searchTerm.toLowerCase()) || 
                            e.paqueteNombre.toLowerCase().includes(searchTerm.toLowerCase());
      
      const isToday = e.fechaEvento.startsWith(todayStr);
      
      if (!matchesSearch) return false;

      switch (activeFilter) {
        case 'today': return isToday;
        case 'pending-payment': return e.saldoPendiente > 0;
        case 'operational': return e.tareasTotales > 0 && e.tareasCompletadas < e.tareasTotales;
        default: return true;
      }
    });
  }, [eventos, searchTerm, activeFilter, todayStr]);

  return (
    <div className="space-y-10 font-sans pb-20">
      {/* PROFESSIONAL ENTERPRISE HEADER */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 bg-slate-900 p-10 rounded-[2.5rem] border border-slate-800 shadow-2xl relative overflow-hidden">
        {/* Background Accents */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl -mr-20 -mt-20 animate-pulse" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-primary/10 rounded-full blur-3xl -ml-20 -mb-20 animate-pulse" />

        <div className="flex items-center gap-6 relative z-10">
          <div className="w-16 h-16 bg-blue-600 rounded-[1.5rem] flex items-center justify-center text-white shadow-xl shadow-blue-600/20">
            <Activity size={32} />
          </div>
          <div className="space-y-1">
            <h1 className="text-4xl font-black text-white tracking-tighter uppercase italic leading-none">
              Centro de Mando
            </h1>
            <p className="text-slate-400 font-black text-[10px] uppercase tracking-[0.3em] flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
              Estado Global de Operaciones
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 relative z-10">
          <div className="flex items-center bg-white/5 border border-white/10 rounded-2xl p-1.5">
            {[
              { id: 'all', label: 'Todo', icon: LayoutGrid },
              { id: 'today', label: 'Hoy', icon: Calendar },
              { id: 'pending-payment', label: 'Deudas', icon: DollarSign },
              { id: 'operational', label: 'En Curso', icon: Activity },
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setActiveFilter(f.id as any)}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  activeFilter === f.id ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <f.icon size={14} />
                <span className="hidden sm:inline">{f.label}</span>
              </button>
            ))}
          </div>

          <button 
            onClick={loadEventos}
            className="w-14 h-14 bg-white/10 text-white rounded-2xl flex items-center justify-center hover:bg-white/20 transition-all active:scale-95 border border-white/5 group"
            title="Sincronizar"
          >
            <RefreshCw size={22} className={`${loading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-700'}`} />
          </button>
        </div>
      </div>

      {/* OPERATIONAL STATS BAR */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Misiones Hoy', val: stats.todayCount, icon: Clock, color: 'text-blue-500', bg: 'bg-blue-500/5' },
          { label: 'Deuda Operativa', val: `$${stats.pendingTotal.toLocaleString()}`, icon: DollarSign, color: 'text-rose-500', bg: 'bg-rose-500/5' },
          { label: 'Progreso Promedio', val: `${stats.avgProgress}%`, icon: BarChart3, color: 'text-emerald-500', bg: 'bg-emerald-500/5' },
          { label: 'Total Activos', val: stats.totalEvents, icon: Activity, color: 'text-indigo-500', bg: 'bg-indigo-500/5' },
        ].map((s, i) => (
          <div key={i} className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm flex items-center justify-between group hover:shadow-xl transition-all duration-500">
            <div className="space-y-1">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{s.label}</p>
              <p className={`text-3xl font-black ${s.color} tracking-tight`}>{s.val}</p>
            </div>
            <div className={`w-14 h-14 ${s.bg} ${s.color} rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
              <s.icon size={24} />
            </div>
          </div>
        ))}
      </div>

      {/* SEARCH AND CONTROL */}
      <div className="flex flex-col md:flex-row gap-6">
        <div className="flex-1 relative group">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={20} />
          <input 
            type="text" 
            placeholder="Buscar por festejado o paquete..."
            className="w-full bg-white border border-slate-100 rounded-3xl py-6 pl-16 pr-8 text-sm font-bold text-slate-700 placeholder:text-slate-300 focus:ring-[6px] focus:ring-blue-500/5 focus:border-blue-500/50 outline-none transition-all shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* EVENT GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <AnimatePresence mode="popLayout">
          {loading ? (
            <div className="col-span-full py-40 flex flex-col items-center justify-center space-y-6">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-blue-500/10 rounded-full" />
                <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin absolute top-0 left-0" />
              </div>
              <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.3em] animate-pulse">Sincronizando Agenda...</p>
            </div>
          ) : filteredEventos.length > 0 ? (
            filteredEventos.map((evento) => {
              const isToday = evento.fechaEvento.startsWith(todayStr);
              const progreso = evento.tareasTotales > 0 
                ? (evento.tareasCompletadas / evento.tareasTotales) * 100 
                : 0;
              
              const birthdayTitle = evento.cumpleaneros.length > 0 
                ? evento.cumpleaneros.join(' & ') 
                : 'Evento Especial';

              const dateObj = new Date(evento.fechaEvento);
              const day = dateObj.getDate().toString().padStart(2, '0');
              const month = dateObj.toLocaleDateString('es-ES', { month: 'short' }).toUpperCase().replace('.', '');
              
              return (
                <motion.div 
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  key={evento.id} 
                  className={`
                    relative bg-white rounded-[2.5rem] border transition-all duration-500 flex flex-col group
                    ${isToday 
                      ? 'border-blue-500 shadow-2xl shadow-blue-500/10 ring-2 ring-blue-500/20' 
                      : 'border-slate-100 hover:border-slate-300 hover:shadow-2xl hover:shadow-slate-200/50'}
                  `}
                >
                  {/* CARD HEADER: DATE & BADGES */}
                  <div className="p-10 pb-4 flex justify-between items-start">
                    <div className="flex gap-5 items-center">
                      <div className={`
                        flex flex-col items-center justify-center w-16 h-20 rounded-[1.25rem] border-2
                        ${isToday 
                          ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-600/30' 
                          : 'bg-slate-50 border-slate-100 text-slate-400'}
                      `}>
                        <span className="text-2xl font-black leading-none">{day}</span>
                        <span className="text-[10px] font-black tracking-[0.2em] mt-1.5">{month}</span>
                      </div>
                      
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                           {isToday && (
                             <span className="flex h-2 w-2 rounded-full bg-blue-500 animate-ping" />
                           )}
                           <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${isToday ? 'text-blue-600' : 'text-slate-400'}`}>
                             {isToday ? 'Misión Activa' : 'Programado'}
                           </span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <span className={`
                            text-[9px] font-black uppercase px-3 py-1.5 rounded-lg border tracking-widest
                            ${evento.estado.toLowerCase().includes('confirm') 
                              ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                              : 'bg-amber-50 text-amber-600 border-amber-100'}
                          `}>
                            {evento.estado}
                          </span>
                          {evento.saldoPendiente > 0 && (
                            <span className="bg-rose-50 text-rose-600 border border-rose-100 text-[9px] font-black uppercase px-3 py-1.5 rounded-lg tracking-widest">
                              ${evento.saldoPendiente} Pendiente
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* MAIN CONTENT */}
                  <div className="px-10 py-6 space-y-8 flex-1">
                    <div>
                      <h3 className="text-3xl font-black text-slate-900 leading-[1] tracking-tighter group-hover:text-blue-600 transition-colors">
                        {birthdayTitle}
                      </h3>
                      <div className="flex items-center gap-3 mt-4">
                        <div className="p-2 bg-blue-50 rounded-xl text-blue-600">
                          <Package size={16} strokeWidth={2.5} />
                        </div>
                        <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">
                          {evento.paqueteNombre}
                        </span>
                      </div>
                    </div>

                    {/* OPERATIONAL PROGRESS */}
                    <div className="space-y-5 bg-slate-50/50 p-6 rounded-3xl border border-slate-100">
                      <div className="flex justify-between items-end">
                        <div className="flex flex-col">
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Estado Operativo</span>
                          <span className="text-2xl font-black text-slate-900 tracking-tighter">{Math.round(progreso)}%</span>
                        </div>
                        <div className="text-right">
                          <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">Objetivos</span>
                          <span className="text-xs font-black text-blue-600">{evento.tareasCompletadas} <span className="text-slate-300 font-medium">/</span> {evento.tareasTotales}</span>
                        </div>
                      </div>
                      <div className="h-2.5 w-full bg-slate-200/50 rounded-full overflow-hidden shadow-inner relative">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${progreso}%` }}
                          transition={{ duration: 1.5, ease: "easeOut" }}
                          className={`h-full rounded-full transition-all duration-1000 ${progreso === 100 ? 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]' : 'bg-blue-600 shadow-[0_0_15px_rgba(37,99,235,0.5)]'}`}
                        />
                      </div>
                    </div>

                    {/* FOOTER INFO */}
                    <div className="grid grid-cols-2 gap-4 pt-6 border-t border-slate-50">
                      <div className="space-y-1">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Despliegue</span>
                        <div className="flex items-center gap-2 text-slate-800 font-black text-xs">
                           <Clock size={14} className="text-blue-500" />
                           {evento.horaInicio.substring(0,5)} — {evento.horaFin.substring(0,5)}
                        </div>
                      </div>
                      <div className="space-y-1 text-right">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Responsable</span>
                        <div className="text-slate-800 font-black text-xs truncate">
                           {evento.clientesNombres[0]}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ACTION BUTTON */}
                  <div className="p-10 pt-0">
                    <button 
                      onClick={() => navigate(`/admin/operativo/${evento.id}`)}
                      className={`
                        w-full py-6 rounded-[1.75rem] font-black text-[10px] uppercase tracking-[0.25em] transition-all duration-500 flex items-center justify-center gap-4
                        ${isToday 
                          ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-2xl shadow-blue-600/40 active:scale-[0.97]' 
                          : 'bg-slate-900 text-white hover:bg-blue-600 active:scale-[0.97] shadow-xl shadow-slate-900/10'}
                      `}
                    >
                      <Activity size={20} />
                      Panel de Misión
                      <ChevronRight size={18} />
                    </button>
                  </div>
                </motion.div>
              );
            })
          ) : (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="col-span-full py-32 flex flex-col items-center justify-center space-y-8 bg-white border-2 border-dashed border-slate-200 rounded-[3rem] shadow-sm"
            >
              <div className="w-24 h-24 bg-slate-50 rounded-[2rem] flex items-center justify-center text-slate-200 border border-slate-100">
                <AlertCircle size={48} />
              </div>
              <div className="text-center space-y-2">
                <p className="text-2xl font-black text-slate-900 uppercase tracking-tighter italic">Búsqueda sin resultados</p>
                <p className="text-slate-400 font-black uppercase text-[10px] tracking-widest">No hay misiones operativas que coincidan con los filtros actuales.</p>
              </div>
              <button 
                onClick={() => { setActiveFilter('all'); setSearchTerm(''); }}
                className="px-10 py-5 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 transition-all shadow-2xl shadow-slate-900/20 active:scale-95 flex items-center gap-3"
              >
                <RefreshCw size={16} /> Restablecer Filtros
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default OperativoPage;

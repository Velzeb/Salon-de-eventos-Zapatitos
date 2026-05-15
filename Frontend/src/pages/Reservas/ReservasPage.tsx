import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, 
  Search, 
  Filter, 
  ChevronRight, 
  RefreshCw,
  List, 
  CreditCard,
  Calendar as CalendarIcon,
  Settings,
  Globe,
  Shield
} from 'lucide-react';
import { eventosService } from '../../services/eventosService';
import type { Evento } from '../../services/eventosService';
import ReservaPayments from './components/ReservaPayments';
import CalendarView from './components/CalendarView';
import ConfiguracionHorarios from './components/ConfiguracionHorarios';

const ReservasPage = () => {
  const navigate = useNavigate();
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [view, setView] = useState<'list' | 'calendar' | 'horarios'>('calendar');
  const [statusFilter, setStatusFilter] = useState('todos');

  // PAGOS
  const [isPaymentsOpen, setIsPaymentsOpen] = useState(false);
  const [selectedEvento, setSelectedEvento] = useState<Evento | null>(null);
  const [updatingEstado, setUpdatingEstado] = useState<number | null>(null);

  useEffect(() => {
    loadEventos();
  }, []);

  const loadEventos = async () => {
    setLoading(true);
    try {
      const data = await eventosService.getEventos();
      setEventos(data);
    } catch (err) {
      console.error('Error al cargar eventos', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEstadoChange = async (eventoId: number, nuevoEstado: string) => {
    setUpdatingEstado(eventoId);
    try {
      await eventosService.updateEstado(eventoId, nuevoEstado);
      await loadEventos();
    } catch (err) {
      console.error('Error al cambiar estado', err);
    } finally {
      setUpdatingEstado(null);
    }
  };

  const getStatusClasses = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmado': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'provisional': return 'bg-amber-50 text-amber-600 border-amber-100';
      case 'completado': return 'bg-blue-50 text-blue-600 border-blue-100';
      case 'cancelado': return 'bg-rose-50 text-rose-600 border-rose-100';
      default: return 'bg-slate-50 text-slate-600 border-slate-100';
    }
  };

  const filteredEventos = eventos.filter(e => {
    const matchesText = e.cumpleaneros.some(c => c.toLowerCase().includes(searchTerm.toLowerCase())) ||
      e.clientesNombres.some(c => c.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === 'todos' || e.estado.toLowerCase() === statusFilter;
    return matchesText && matchesStatus;
  });

  return (
    <div className="space-y-10 pb-20 font-sans">
      {/* PROFESSIONAL ENTERPRISE HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 bg-slate-900 p-10 rounded-2xl border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="space-y-1 relative z-10">
          <h1 className="text-3xl font-bold text-white tracking-tight uppercase">
            {view === 'horarios' ? 'Disponibilidad' : 'Gestión de Reservas'}
          </h1>
          <p className="text-slate-400 font-semibold text-[10px] uppercase tracking-widest mt-1">
            {view === 'horarios' 
              ? 'Configuración de Turnos y Bloques Operativos' 
              : 'Administración Integral de Agenda y Finanzas'}
          </p>
        </div>
        
        <div className="flex items-center gap-6 relative z-10">
          <div className="hidden lg:flex flex-col items-end pr-6 border-r border-slate-700/50">
            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Pendientes Online</span>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-black text-blue-400">
                {eventos.filter(e => e.origen.toLowerCase() === 'online' && e.estado.toLowerCase() === 'provisional').length}
              </span>
              <div className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
              </div>
            </div>
          </div>

          {view !== 'horarios' ? (
            <button 
              className="bg-blue-600 text-white flex items-center gap-3 px-8 py-4 rounded-xl shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all font-bold text-[10px] uppercase tracking-widest active:scale-95" 
              onClick={() => navigate('nueva')}
            >
              <Plus size={20} strokeWidth={3} />
              <span>Nueva Reserva</span>
            </button>
          ) : (
            <div className="flex items-center gap-3 bg-white/10 text-white px-6 py-3 rounded-xl border border-white/5">
              <Settings size={18} className="animate-spin-slow" />
              <span className="font-bold text-[10px] uppercase tracking-widest">Modo Configuración</span>
            </div>
          )}
        </div>
      </div>

      {/* TOOLBAR */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex bg-slate-100 p-1 rounded-xl w-fit border border-slate-200">
          {[
            { id: 'calendar', icon: CalendarIcon, label: 'Calendario' },
            { id: 'list', icon: List, label: 'Lista' },
            { id: 'horarios', icon: Settings, label: 'Horarios' }
          ].map((v) => (
            <button 
              key={v.id}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${view === v.id ? 'bg-white text-blue-600 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-900'}`}
              onClick={() => setView(v.id as any)}
            >
              <v.icon size={16} /> {v.label}
            </button>
          ))}
        </div>

        {view !== 'horarios' && (
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-[320px] relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Buscar por cliente o cumpleañero..." 
                className="w-full bg-white border border-slate-200 rounded-xl pl-12 pr-4 py-3 outline-none focus:border-blue-500 transition-colors text-xs font-bold uppercase tracking-tight text-slate-800 placeholder:text-slate-400 placeholder:font-semibold"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="relative">
              <select 
                className="bg-white border border-slate-200 rounded-xl pl-4 pr-10 py-3 outline-none text-[10px] font-bold uppercase tracking-widest text-slate-700 cursor-pointer appearance-none min-w-[180px] focus:border-blue-500 transition-colors"
                value={statusFilter} 
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="todos">Todos los Estados</option>
                <option value="provisional">Provisional</option>
                <option value="confirmado">Confirmado</option>
                <option value="en_curso">En Curso</option>
                <option value="completado">Completado</option>
                <option value="cancelado">Cancelado</option>
              </select>
              <Filter size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>

            <button 
              onClick={loadEventos} 
              className="w-12 h-12 bg-white border border-slate-200 text-slate-500 rounded-xl flex items-center justify-center hover:bg-slate-50 transition-all active:scale-95 shadow-sm"
              title="Recargar"
            >
              <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        )}
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden min-h-[400px]">
        {loading && view !== 'horarios' ? (
          <div className="py-40 flex flex-col items-center justify-center space-y-6">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-blue-500/10 rounded-full" />
              <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin absolute top-0 left-0" />
            </div>
            <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.3em]">Sincronizando Reservas...</p>
          </div>
        ) : view === 'calendar' ? (
          <CalendarView 
            eventos={eventos} 
            onDateSelect={(date) => {
              navigate('nueva', { state: { selectedDate: date } });
            }} 
          />
        ) : view === 'horarios' ? (
          <ConfiguracionHorarios />
                ) : filteredEventos.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-separate border-spacing-0">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100">Evento & Fecha</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100">Cliente / Cumpleañero</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100">Paquete</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100 text-right">Inversión</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100 text-center">Estado Operativo</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredEventos.map((evento) => (
                  <tr key={evento.id} className="hover:bg-blue-50/30 transition-all group">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-white border border-slate-100 flex flex-col items-center justify-center shadow-sm group-hover:border-blue-200 transition-colors">
                          <span className="text-[10px] font-black text-blue-600 leading-none">
                            {new Date(evento.fechaEvento).toLocaleDateString(undefined, { month: 'short' }).toUpperCase()}
                          </span>
                          <span className="text-lg font-black text-slate-900 leading-none">
                            {new Date(evento.fechaEvento).getDate()}
                          </span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Folio #{evento.id}</span>
                          <div className="flex items-center gap-2 mt-1">
                            {evento.origen.toLowerCase() === 'online' ? (
                              <div className="flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-600 rounded-md border border-blue-100">
                                <Globe size={10} />
                                <span className="text-[8px] font-black uppercase">Online</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1 px-2 py-0.5 bg-slate-100 text-slate-500 rounded-md border border-slate-200">
                                <Shield size={10} />
                                <span className="text-[8px] font-black uppercase">Interno</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="space-y-1">
                        <p className="text-xs font-black text-slate-900 uppercase tracking-tight">{evento.cumpleaneros.join(' & ')}</p>
                        <p className="text-[10px] font-bold text-slate-400 italic">Resp: {evento.clientesNombres.join(', ')}</p>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className="inline-flex items-center px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest bg-white text-slate-600 border border-slate-200 shadow-sm group-hover:border-blue-200 transition-all">
                        {evento.paqueteNombre}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex flex-col items-end">
                        <span className="font-black text-slate-900 text-sm tracking-tighter">${evento.precioTotal.toLocaleString()}</span>
                        {evento.saldoPendiente > 0 ? (
                          <div className="flex items-center gap-1.5 mt-1">
                            <span className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-pulse" />
                            <span className="text-[9px] font-black text-rose-600 uppercase tracking-widest">
                              Debe: ${evento.saldoPendiente.toLocaleString()}
                            </span>
                          </div>
                        ) : (
                          <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest mt-1">Pagado 100%</span>
                        )}
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex justify-center">
                        <select
                          value={evento.estado}
                          disabled={updatingEstado === evento.id}
                          onChange={(e) => handleEstadoChange(evento.id, e.target.value)}
                          className={`text-[9px] font-black uppercase tracking-[0.15em] px-4 py-2 rounded-xl border-2 cursor-pointer outline-none disabled:opacity-50 transition-all hover:scale-105 active:scale-95 ${getStatusClasses(evento.estado)}`}
                        >
                          <option value="Provisional">Provisional</option>
                          <option value="Confirmado">Confirmado</option>
                          <option value="Completado">Completado</option>
                          <option value="Cancelado">Cancelado</option>
                        </select>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex justify-end gap-2">
                        <button 
                          className={`w-11 h-11 rounded-2xl border flex items-center justify-center transition-all active:scale-90 shadow-sm ${
                            evento.saldoPendiente > 0 
                              ? 'bg-rose-50 text-rose-600 border-rose-100 hover:bg-rose-600 hover:text-white' 
                              : 'bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-600 hover:text-white'
                          }`}
                          onClick={() => {
                            setSelectedEvento(evento);
                            setIsPaymentsOpen(true);
                          }}
                          title="Gestión Financiera"
                        >
                          <CreditCard size={18} strokeWidth={2.5} />
                        </button>
                        <button 
                          className="w-11 h-11 rounded-2xl border bg-slate-900 text-white border-slate-900 hover:bg-blue-600 hover:border-blue-600 flex items-center justify-center transition-all active:scale-90 shadow-lg shadow-slate-900/10" 
                          title="Abrir Centro Operativo"
                          onClick={() => navigate(`/admin/operativo/${evento.id}`)}
                        >
                          <ChevronRight size={20} strokeWidth={3} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-40 flex flex-col items-center justify-center space-y-6">
            <div className="w-20 h-20 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-200 border border-slate-100">
              <CalendarIcon size={40} />
            </div>
            <div className="text-center">
              <p className="text-xl font-bold text-slate-900 uppercase tracking-tight">Sin Resultados</p>
              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mt-2">No se han encontrado registros con los filtros seleccionados.</p>
            </div>
            <button 
              onClick={() => { setSearchTerm(''); setStatusFilter('todos'); }}
              className="px-8 py-3 bg-slate-900 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-blue-600 transition-all shadow-md active:scale-95"
            >
              Restablecer Filtros
            </button>
          </div>
        )}
      </div>

      {selectedEvento && (
        <ReservaPayments 
          isOpen={isPaymentsOpen}
          onClose={() => {
            setIsPaymentsOpen(false);
            setSelectedEvento(null);
          }}
          eventoId={selectedEvento.id}
          totalPrice={selectedEvento.precioTotal}
          saldoPendiente={selectedEvento.saldoPendiente}
          onSuccess={loadEventos}
        />
      )}
    </div>
  );
};
export default ReservasPage;

import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { RefreshCw, Search, Clock, AlertCircle, Calendar, ClipboardList, PlayCircle, CreditCard, Folder, CheckCircle2 } from 'lucide-react';
import { eventosService, type Evento } from '../../services/eventosService';
import { getEstadoEventoBadgeClasses, getEstadoEventoLabel, normalizeEstadoEvento } from '../../utils/estadoEvento';

type OperativoFilter = 'today' | 'ready' | 'live' | 'debt' | 'all';

const filters: Array<{ id: OperativoFilter; label: string; icon: React.FC<{ size?: number; className?: string }> }> = [
  { id: 'today', label: 'Hoy', icon: Calendar },
  { id: 'ready', label: 'Pendientes', icon: ClipboardList },
  { id: 'live',  label: 'En curso',   icon: PlayCircle },
  { id: 'debt',  label: 'Por cobrar', icon: CreditCard },
  { id: 'all',   label: 'Todo',       icon: Folder },
];

const getProgress = (evento: Evento) => {
  if (evento.tareasTotales <= 0) return 0;
  return Math.round((evento.tareasCompletadas / evento.tareasTotales) * 100);
};

const getModalidad = (evento: Evento) => {
  const paquete = evento.paqueteNombre?.trim();
  if (!paquete || paquete.toLowerCase() === 'sin paquete') return 'Solo salón';
  return paquete;
};

const getTitle = (evento: Evento) =>
  evento.cumpleaneros.length > 0 ? evento.cumpleaneros.join(' & ') : 'Evento especial';

const OperativoPage = () => {
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<OperativoFilter>('ready');
  const navigate = useNavigate();

  const loadEventos = async () => {
    setLoading(true);
    try { const data = await eventosService.getEventos(); setEventos(data); }
    catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadEventos(); }, []);

  const todayStr = new Date().toISOString().split('T')[0];

  const summary = useMemo(() => {
    const hoy     = eventos.filter(e => e.fechaEvento.startsWith(todayStr)).length;
    const enCurso = eventos.filter(e => e.estado.toLowerCase() === 'encurso').length;
    const deuda   = eventos.reduce((s, e) => s + e.saldoPendiente, 0);
    const total   = eventos.filter(e => !['terminado', 'cancelado'].includes(e.estado.toLowerCase())).length;
    return { hoy, enCurso, deuda, total };
  }, [eventos, todayStr]);

  const filteredEventos = useMemo(() => {
    return eventos
      .filter(e => {
        const q = searchTerm.trim().toLowerCase();
        const text = [...e.cumpleaneros, e.paqueteNombre ?? '', ...e.clientesNombres].join(' ').toLowerCase();
        const matchesSearch = !q || text.includes(q);
        if (!matchesSearch) return false;
        const estado = e.estado.toLowerCase();
        switch (activeFilter) {
          case 'today': return e.fechaEvento.startsWith(todayStr);
          case 'ready': return getProgress(e) < 100 && estado !== 'encurso' && estado !== 'terminado' && estado !== 'cancelado';
          case 'live':  return estado === 'encurso';
          case 'debt':  return e.saldoPendiente > 0;
          default:      return true;
        }
      })
      .sort((a, b) => new Date(a.fechaEvento).getTime() - new Date(b.fechaEvento).getTime());
  }, [eventos, searchTerm, activeFilter, todayStr]);

  const getDateParts = (value: string) => {
    const d = new Date(value);
    return {
      day:     d.getDate().toString().padStart(2, '0'),
      month:   d.toLocaleDateString('es-ES', { month: 'short' }).replace('.', ''),
      weekday: d.toLocaleDateString('es-ES', { weekday: 'short' }).replace('.', ''),
      isToday: value.startsWith(todayStr),
    };
  };

  return (
    <div className="pb-16 space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Centro de Mando</h1>
          <p className="text-sm text-slate-500 mt-1">Gestión operativa de eventos</p>
        </div>
        <div className="flex gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Buscar por cliente o cumpleañero..."
              className="w-full sm:w-72 bg-white border border-slate-200 rounded-lg py-2 pl-9 pr-3 text-sm text-slate-700 outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400 transition-all shadow-sm"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <button onClick={loadEventos} className="h-9 w-9 bg-white border border-slate-200 text-slate-600 rounded-lg flex items-center justify-center hover:bg-slate-50 transition-colors shadow-sm" title="Actualizar">
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Hoy',       value: summary.hoy,    color: 'text-slate-900', icon: Calendar, iconColor: 'text-indigo-500' },
          { label: 'En curso',  value: summary.enCurso, color: 'text-slate-900', icon: PlayCircle, iconColor: 'text-emerald-500' },
          { label: 'Por cobrar', value: `$${summary.deuda.toLocaleString()}`, color: 'text-slate-900', icon: CreditCard, iconColor: 'text-rose-500' },
          { label: 'Activos',   value: summary.total,  color: 'text-slate-900', icon: Folder, iconColor: 'text-slate-400' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{s.label}</p>
              <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
            </div>
            <div className={`p-3 bg-slate-50 rounded-lg ${s.iconColor}`}>
              <s.icon size={20} strokeWidth={2} />
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {filters.map(f => {
          const Icon = f.icon;
          const isActive = activeFilter === f.id;
          return (
            <button
              key={f.id}
              onClick={() => setActiveFilter(f.id)}
              className={`h-9 px-4 rounded-lg text-sm font-medium whitespace-nowrap transition-all flex items-center gap-2 ${
                isActive
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Icon size={16} className={isActive ? 'text-white' : 'text-slate-400'} /> {f.label}
            </button>
          );
        })}
      </div>

      {/* Events list */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="py-20 text-center">
            <RefreshCw className="animate-spin mx-auto mb-3 text-slate-300" size={24} />
            <p className="text-sm font-medium text-slate-500">Cargando eventos...</p>
          </div>
        ) : filteredEventos.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {filteredEventos.map(evento => {
              const date   = getDateParts(evento.fechaEvento);
              const title  = getTitle(evento);
              const progress = getProgress(evento);
              const estadoKey = normalizeEstadoEvento(evento.estado);
              const isLive = estadoKey === 'encurso';

              return (
                <button
                  key={evento.id}
                  onClick={() => navigate(`/admin/operativo/${evento.id}`)}
                  className="w-full text-left hover:bg-slate-50 transition-colors group p-5"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center gap-5">
                    {/* Date Block */}
                    <div className={`w-14 h-14 rounded-lg flex flex-col items-center justify-center shrink-0 border ${
                      isLive ? 'bg-emerald-50 border-emerald-200 text-emerald-700' :
                      date.isToday ? 'bg-indigo-50 border-indigo-200 text-indigo-700' :
                      'bg-white border-slate-200 text-slate-700'
                    }`}>
                      <span className="text-lg font-bold leading-none">{date.day}</span>
                      <span className="text-[10px] font-semibold uppercase tracking-wider">{date.month}</span>
                    </div>

                    {/* Main Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border ${getEstadoEventoBadgeClasses(estadoKey)}`}>
                          {getEstadoEventoLabel(estadoKey)}
                        </span>
                        {isLive && (
                          <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded uppercase tracking-wide">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> En Vivo
                          </span>
                        )}
                        {date.isToday && !isLive && (
                          <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded uppercase tracking-wide">
                            Hoy
                          </span>
                        )}
                      </div>
                      <h3 className="font-semibold text-slate-900 text-base truncate">{title}</h3>
                      <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                        <span className="flex items-center gap-1.5">
                          <Clock size={12} className="text-slate-400" />
                          {date.weekday} · {evento.horaInicio.substring(0, 5)} – {evento.horaFin.substring(0, 5)}
                        </span>
                        <span className="hidden sm:inline text-slate-300">•</span>
                        <span className="truncate hidden sm:inline">{evento.clientesNombres.join(', ')}</span>
                        <span className="hidden sm:inline text-slate-300">•</span>
                        <span className="truncate">{getModalidad(evento)}</span>
                      </div>
                    </div>

                    {/* Status Columns */}
                    <div className="flex items-center justify-between lg:justify-end gap-6 shrink-0 mt-3 lg:mt-0">
                      {/* Preparación Progress */}
                      <div className="w-32 hidden sm:block">
                        <div className="flex justify-between text-[10px] font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">
                          <span>Preparación</span>
                          <span className={progress === 100 ? 'text-emerald-600' : 'text-slate-700'}>{progress}%</span>
                        </div>
                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all ${progress === 100 ? 'bg-emerald-500' : 'bg-slate-400'}`}
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>

                      {/* Debt Status */}
                      <div className="min-w-[100px] text-right">
                        {evento.saldoPendiente > 0 ? (
                          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-100 px-2.5 py-1.5 rounded-lg">
                            <CreditCard size={14} /> ${evento.saldoPendiente.toLocaleString()}
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2.5 py-1.5 rounded-lg">
                            <CheckCircle2 size={14} /> Liquidado
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="py-24 text-center">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
              <AlertCircle className="text-slate-300" size={28} />
            </div>
            <h3 className="font-semibold text-slate-900 text-base">No hay eventos para mostrar</h3>
            <p className="text-sm text-slate-500 mt-1">Prueba seleccionando otro filtro o modificando la búsqueda.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default OperativoPage;

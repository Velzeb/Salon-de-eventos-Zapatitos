import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  Clock,
  DollarSign,
  RefreshCw,
  Search
} from 'lucide-react';
import { eventosService, type Evento } from '../../services/eventosService';
import { getEstadoEventoBadgeClasses, getEstadoEventoLabel, normalizeEstadoEvento } from '../../utils/estadoEvento';

type OperativoFilter = 'today' | 'ready' | 'live' | 'debt' | 'all';

const filters: Array<{ id: OperativoFilter; label: string }> = [
  { id: 'today', label: 'Hoy' },
  { id: 'ready', label: 'Pendientes' },
  { id: 'live', label: 'En curso' },
  { id: 'debt', label: 'Por cobrar' },
  { id: 'all', label: 'Todo' }
];

const formatEventDate = (value: string) => {
  const date = new Date(value);
  return {
    day: date.getDate().toString().padStart(2, '0'),
    month: date.toLocaleDateString('es-ES', { month: 'short' }).replace('.', ''),
    weekday: date.toLocaleDateString('es-ES', { weekday: 'short' }).replace('.', '')
  };
};

const getProgress = (evento: Evento) => {
  if (evento.tareasTotales <= 0) return 0;
  return Math.round((evento.tareasCompletadas / evento.tareasTotales) * 100);
};

const getModalidad = (evento: Evento) => {
  const paquete = evento.paqueteNombre?.trim();
  if (!paquete || paquete.toLowerCase() === 'sin paquete') return 'Solo salón';
  return paquete;
};

const OperativoPage = () => {
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<OperativoFilter>('ready');
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

  const summary = useMemo(() => {
    const today = eventos.filter(e => e.fechaEvento.startsWith(todayStr)).length;
    const ready = eventos.filter(e => getProgress(e) < 100 && e.estado.toLowerCase() !== 'encurso').length;
    const debt = eventos.reduce((sum, e) => sum + e.saldoPendiente, 0);
    return { today, ready, debt };
  }, [eventos, todayStr]);

  const filteredEventos = useMemo(() => {
    return eventos
      .filter(e => {
        const text = [e.cumpleaneros.join(' '), e.paqueteNombre, e.clientesNombres.join(' ')]
          .join(' ')
          .toLowerCase();
        const isToday = e.fechaEvento.startsWith(todayStr);
        const matchesSearch = text.includes(searchTerm.trim().toLowerCase());

        if (!matchesSearch) return false;

        switch (activeFilter) {
          case 'today':
            return isToday;
          case 'ready':
            return getProgress(e) < 100 && e.estado.toLowerCase() !== 'encurso';
          case 'live':
            return e.estado.toLowerCase() === 'encurso';
          case 'debt':
            return e.saldoPendiente > 0;
          default:
            return true;
        }
      })
      .sort((a, b) => new Date(a.fechaEvento).getTime() - new Date(b.fechaEvento).getTime());
  }, [eventos, searchTerm, activeFilter, todayStr]);

  return (
    <div className="space-y-5 pb-14 font-sans">
      <section className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Operativo</h1>
          <p className="text-sm text-slate-500 mt-1">
            Hoy: <span className="font-bold text-slate-800">{summary.today}</span>
            <span className="mx-2 text-slate-300">/</span>
            Pendientes: <span className="font-bold text-slate-800">{summary.ready}</span>
            <span className="mx-2 text-slate-300">/</span>
            Por cobrar: <span className="font-bold text-rose-600">${summary.debt.toLocaleString()}</span>
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
            <input
              type="text"
              placeholder="Buscar evento"
              className="w-full sm:w-72 bg-white border border-slate-200 rounded-lg py-2.5 pl-10 pr-3 text-sm outline-none focus:border-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button
            onClick={loadEventos}
            className="h-10 px-3 bg-white border border-slate-200 text-slate-600 rounded-lg flex items-center justify-center hover:bg-slate-50"
            title="Actualizar"
          >
            <RefreshCw size={17} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </section>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {filters.map(filter => (
          <button
            key={filter.id}
            onClick={() => setActiveFilter(filter.id)}
            className={`h-9 px-4 rounded-lg text-sm font-semibold whitespace-nowrap transition-colors ${
              activeFilter === filter.id ? 'bg-slate-900 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="divide-y divide-slate-100">
          {loading ? (
            <div className="py-16 text-center text-slate-400">
              <RefreshCw className="animate-spin mx-auto mb-3" size={24} />
              <p className="text-sm font-medium">Cargando eventos...</p>
            </div>
          ) : filteredEventos.length > 0 ? (
            filteredEventos.map(evento => {
              const date = formatEventDate(evento.fechaEvento);
              const title = evento.cumpleaneros.length > 0 ? evento.cumpleaneros.join(' & ') : 'Evento especial';
              const progress = getProgress(evento);
              const estadoKey = normalizeEstadoEvento(evento.estado);
              const isLive = evento.estado.toLowerCase() === 'encurso';

              return (
                <button
                  key={evento.id}
                  onClick={() => navigate(`/admin/operativo/${evento.id}`)}
                  className="w-full px-5 py-4 text-left hover:bg-slate-50 transition-colors"
                >
                  <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_180px_190px_120px] gap-4 lg:items-center">
                    <div className="flex items-start gap-4 min-w-0">
                      <div className="w-12 h-12 rounded-lg bg-slate-50 border border-slate-200 flex flex-col items-center justify-center shrink-0">
                        <span className="text-base font-bold text-slate-900 leading-none">{date.day}</span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">{date.month}</span>
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          {isLive && <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-blue-600 text-white">En curso</span>}
                          <span className={`px-2 py-0.5 rounded-full border text-xs font-bold ${getEstadoEventoBadgeClasses(estadoKey)}`}>
                            {getEstadoEventoLabel(estadoKey)}
                          </span>
                        </div>
                        <p className="mt-1 font-bold text-slate-900 truncate">{title}</p>
                        <p className="text-sm text-slate-500 truncate">{getModalidad(evento)}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Clock size={15} className="text-slate-400" />
                      <span className="font-semibold">{date.weekday}</span>
                      <span>{evento.horaInicio.substring(0, 5)} - {evento.horaFin.substring(0, 5)}</span>
                    </div>

                    <div>
                      <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                        <span>{evento.tareasCompletadas}/{evento.tareasTotales} tareas</span>
                        <span className="font-bold text-slate-700">{progress}%</span>
                      </div>
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className={progress === 100 ? 'h-full bg-emerald-500' : 'h-full bg-blue-600'} style={{ width: `${progress}%` }} />
                      </div>
                    </div>

                    <div className="flex items-center justify-between lg:justify-end gap-4">
                      {evento.saldoPendiente > 0 ? (
                        <span className="inline-flex items-center gap-1 text-sm font-bold text-rose-600">
                          <DollarSign size={15} /> {evento.saldoPendiente.toLocaleString()}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-sm font-bold text-emerald-600">
                          <CheckCircle2 size={15} /> OK
                        </span>
                      )}
                      <ChevronRight size={17} className="text-slate-300" />
                    </div>
                  </div>
                </button>
              );
            })
          ) : (
            <div className="py-16 text-center">
              <AlertCircle className="mx-auto text-slate-300 mb-3" size={30} />
              <p className="font-bold text-slate-800">No hay eventos en esta vista</p>
              <p className="text-sm text-slate-400 mt-1">Prueba con otro filtro o búsqueda.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default OperativoPage;

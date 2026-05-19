import { useEffect, useMemo, useState } from 'react';
import { Loader2, RefreshCw, Search } from 'lucide-react';
import { empleadoPortalService, type EmpleadoEvento } from '../../services/empleadoPortalService';
import { EventCard } from './EmpleadoJornadaPage';
import { normalizeEstadoEvento } from '../../utils/estadoEvento';

type FilterId = 'hoy' | 'asignados' | 'pendientes' | 'curso' | 'todos';

const filters: Array<{ id: FilterId; label: string }> = [
  { id: 'hoy', label: 'Hoy' },
  { id: 'asignados', label: 'Asignados a mí' },
  { id: 'pendientes', label: 'Con tareas' },
  { id: 'curso', label: 'En curso' },
  { id: 'todos', label: 'Todos' }
];

const EmpleadoEventosPage = () => {
  const [eventos, setEventos] = useState<EmpleadoEvento[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterId>('hoy');

  const loadEventos = async () => {
    setLoading(true);
    try {
      setEventos(await empleadoPortalService.getEventos());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEventos();
  }, []);

  const today = new Date().toISOString().split('T')[0];
  const filtered = useMemo(() => {
    const text = search.trim().toLowerCase();
    return eventos.filter(evento => {
      const haystack = [...evento.cumpleaneros, ...evento.clientesNombres, evento.paqueteNombre].join(' ').toLowerCase();
      if (text && !haystack.includes(text)) return false;
      if (filter === 'hoy') return evento.fechaEvento.startsWith(today);
      if (filter === 'asignados') return evento.asignadoAMi;
      if (filter === 'pendientes') return evento.tareasCompletadas < evento.tareasTotales;
      if (filter === 'curso') return normalizeEstadoEvento(evento.estado) === 'encurso';
      return true;
    });
  }, [eventos, search, filter, today]);

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-black text-slate-950">Eventos operativos</h1>
          <p className="mt-1 text-sm text-slate-500">Consulta eventos visibles para operación y abre el detalle de trabajo.</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar evento"
              className="h-10 w-full rounded-md border border-slate-200 bg-white pl-10 pr-3 text-sm outline-none focus:border-indigo-500 sm:w-72"
            />
          </div>
          <button onClick={loadEventos} className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 hover:bg-slate-50">
            <RefreshCw size={17} className={loading ? 'animate-spin' : ''} />
            Actualizar
          </button>
        </div>
      </section>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {filters.map(item => (
          <button
            key={item.id}
            onClick={() => setFilter(item.id)}
            className={`h-9 whitespace-nowrap rounded-md px-4 text-sm font-bold transition ${
              filter === item.id ? 'bg-slate-900 text-white' : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-slate-500">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
          <p className="text-sm font-semibold">Cargando eventos...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-300 bg-white p-10 text-center">
          <p className="font-black text-slate-800">No hay eventos para esta vista</p>
          <p className="mt-1 text-sm text-slate-500">Prueba con otro filtro o búsqueda.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(evento => <EventCard key={evento.id} evento={evento} />)}
        </div>
      )}
    </div>
  );
};

export default EmpleadoEventosPage;

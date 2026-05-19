import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, CalendarDays, ChevronRight, Clock, Loader2, ListChecks, Users, type LucideIcon } from 'lucide-react';
import { empleadoPortalService, type EmpleadoEvento, type EmpleadoJornada } from '../../services/empleadoPortalService';
import { dateLong, getEventBadge, getEventTitle, getModalidad, getProgress } from './utils';

const EmpleadoJornadaPage = () => {
  const [data, setData] = useState<EmpleadoJornada | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    empleadoPortalService.getJornada().then(setData).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <Loading text="Cargando jornada..." />;
  }

  if (!data) {
    return (
      <div className="rounded-lg border border-rose-200 bg-rose-50 p-6 text-rose-700">
        No se pudo cargar el perfil del empleado.
      </div>
    );
  }

  const nextEvent = data.hoy[0] || data.proximos[0];

  return (
    <div className="space-y-8">
      <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-bold text-indigo-700">Hola, {data.perfil.nombreCompleto}</p>
            <h1 className="mt-1 text-3xl font-black text-slate-950">Mi jornada operativa</h1>
            <p className="mt-2 text-sm text-slate-500">Eventos de hoy, tareas pendientes y control de ingreso.</p>
          </div>
          {nextEvent && (
            <Link to={`/empleado/eventos/${nextEvent.id}`} className="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-bold text-white hover:bg-indigo-700">
              Abrir próximo evento
              <ChevronRight size={17} />
            </Link>
          )}
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        <Metric icon={CalendarDays} label="Eventos hoy" value={data.hoy.length.toString()} />
        <Metric icon={ListChecks} label="Mis tareas pendientes" value={data.tareasPendientes.toString()} tone={data.tareasPendientes > 0 ? 'amber' : 'emerald'} />
        <Metric icon={Clock} label="En curso" value={data.eventosEnCurso.toString()} tone={data.eventosEnCurso > 0 ? 'indigo' : 'slate'} />
        <Metric icon={Users} label="Próximos" value={data.proximos.length.toString()} />
      </section>

      <section className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-4">
          <h2 className="text-xl font-black text-slate-900">Eventos de hoy</h2>
          {data.hoy.length === 0 ? (
            <EmptyState title="No hay eventos hoy" text="Cuando tengas eventos programados para la jornada aparecerán aquí." />
          ) : (
            <div className="space-y-3">
              {data.hoy.map(evento => <EventCard key={evento.id} evento={evento} />)}
            </div>
          )}
        </div>
        <aside className="space-y-4">
          <h2 className="text-xl font-black text-slate-900">Próximos eventos</h2>
          {data.proximos.length === 0 ? (
            <EmptyState title="Sin próximos eventos" text="No hay eventos futuros asignados o visibles." compact />
          ) : (
            data.proximos.slice(0, 5).map(evento => <EventCard key={evento.id} evento={evento} compact />)
          )}
        </aside>
      </section>
    </div>
  );
};

export const EventCard = ({ evento, compact = false }: { evento: EmpleadoEvento; compact?: boolean }) => {
  const badge = getEventBadge(evento.estado);
  const progress = getProgress(evento.tareasCompletadas, evento.tareasTotales);

  return (
    <Link to={`/empleado/eventos/${evento.id}`} className="block rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition hover:border-indigo-200 hover:shadow-md">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-full border px-2.5 py-1 text-xs font-bold ${badge.className}`}>{badge.label}</span>
            {evento.asignadoAMi && <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-bold text-indigo-700">Asignado a mí</span>}
          </div>
          <h3 className="mt-2 truncate text-base font-black text-slate-900">{getEventTitle(evento.cumpleaneros, evento.id)}</h3>
          <p className="mt-1 text-sm text-slate-500">{getModalidad(evento.paqueteNombre)}</p>
          {!compact && <p className="mt-1 text-xs font-semibold text-slate-400">{dateLong.format(new Date(evento.fechaEvento))}</p>}
        </div>
        <div className="min-w-[190px] space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="font-bold text-slate-700">{evento.horaInicio.slice(0, 5)} - {evento.horaFin.slice(0, 5)}</span>
            <span className="text-xs font-bold text-slate-400">{evento.invitadosIngresados}/{evento.invitadosTotales} ingresos</span>
          </div>
          <div>
            <div className="mb-1 flex justify-between text-xs text-slate-500">
              <span>Tareas</span>
              <span className="font-bold">{progress}%</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
              <div className={progress === 100 ? 'h-full bg-emerald-500' : 'h-full bg-indigo-600'} style={{ width: `${progress}%` }} />
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};

const Metric = ({ icon: Icon, label, value, tone = 'indigo' }: { icon: LucideIcon; label: string; value: string; tone?: 'indigo' | 'amber' | 'emerald' | 'slate' }) => {
  const classes = {
    indigo: 'bg-indigo-50 text-indigo-700',
    amber: 'bg-amber-50 text-amber-700',
    emerald: 'bg-emerald-50 text-emerald-700',
    slate: 'bg-slate-100 text-slate-700'
  };
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className={`mb-4 flex h-10 w-10 items-center justify-center rounded-md ${classes[tone]}`}><Icon size={20} /></div>
      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-black text-slate-950">{value}</p>
    </div>
  );
};

const EmptyState = ({ title, text, compact = false }: { title: string; text: string; compact?: boolean }) => (
  <div className={`rounded-lg border border-dashed border-slate-300 bg-white text-center ${compact ? 'p-5' : 'p-10'}`}>
    <AlertCircle className="mx-auto mb-3 h-8 w-8 text-slate-300" />
    <p className="font-black text-slate-800">{title}</p>
    <p className="mt-1 text-sm text-slate-500">{text}</p>
  </div>
);

const Loading = ({ text }: { text: string }) => (
  <div className="flex min-h-[55vh] flex-col items-center justify-center gap-3 text-slate-500">
    <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
    <p className="text-sm font-semibold">{text}</p>
  </div>
);

export default EmpleadoJornadaPage;

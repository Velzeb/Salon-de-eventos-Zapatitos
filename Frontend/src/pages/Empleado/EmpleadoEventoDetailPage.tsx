import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock,
  CreditCard,
  Loader2,
  Play,
  Plus,
  QrCode,
  Square,
  Users,
  type LucideIcon
} from 'lucide-react';
import { empleadoPortalService, type EmpleadoPerfil } from '../../services/empleadoPortalService';
import { type EventoOperativo } from '../../services/operativoService';
import { paquetesService, type Servicio } from '../../services/paquetesService';
import { dateLong, getEventBadge, getEventTitle, getModalidad, getProgress, currency } from './utils';

type TabId = 'resumen' | 'preparacion' | 'durante' | 'consumos';

const EmpleadoEventoDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<EventoOperativo | null>(null);
  const [perfil, setPerfil] = useState<EmpleadoPerfil | null>(null);
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabId>('resumen');
  const [qrInput, setQrInput] = useState('');
  const [busyId, setBusyId] = useState<number | null>(null);
  const [runningTimers, setRunningTimers] = useState<Record<number, number>>({});
  const [timerTick, setTimerTick] = useState(0);
  const [consumo, setConsumo] = useState({ servicioId: 0, cantidad: 1 });
  const [savingConsumo, setSavingConsumo] = useState(false);

  const loadData = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [evento, me, serviciosExtra] = await Promise.all([
        empleadoPortalService.getEvento(Number(id)),
        empleadoPortalService.getMe(),
        paquetesService.getServiciosAdicionales().catch(() => [])
      ]);
      setData(evento);
      setPerfil(me);
      setServicios(serviciosExtra.filter(servicio => servicio.esExtra));
    } catch (err) {
      console.error(err);
      toast.error('No se pudo cargar el evento.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  useEffect(() => {
    if (Object.keys(runningTimers).length === 0) return;
    const interval = window.setInterval(() => setTimerTick(value => value + 1), 1000);
    return () => window.clearInterval(interval);
  }, [runningTimers]);

  const progress = data ? getProgress(data.tareas.filter(t => t.estado.toLowerCase() === 'completada').length, data.tareas.length) : 0;
  const badge = data ? getEventBadge(data.estado) : null;
  const actividadesOrdenadas = useMemo(() => data ? [...data.cronograma].sort((a, b) => a.orden - b.orden) : [], [data]);
  const serviciosConTiempo = useMemo(() => data ? data.items.filter(item => item.requiereTemporizador) : [], [data]);

  const handleCompleteTarea = async (tareaId: number) => {
    setBusyId(tareaId);
    try {
      await empleadoPortalService.completarTarea(tareaId);
      toast.success('Tarea completada');
      await loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.join?.(', ') || 'No se pudo completar la tarea.');
    } finally {
      setBusyId(null);
    }
  };

  const handleToggleActividad = async (actividadId: number, completada: boolean) => {
    setBusyId(actividadId);
    try {
      await empleadoPortalService.completarActividad(actividadId, completada);
      toast.success(completada ? 'Actividad marcada como completada' : 'Actividad marcada como pendiente');
      await loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.join?.(', ') || 'No se pudo actualizar la actividad.');
    } finally {
      setBusyId(null);
    }
  };

  const handleRegistrarIngreso = async (codigoQr: string) => {
    if (!codigoQr.trim()) return;
    try {
      const msg = await empleadoPortalService.registrarIngreso(codigoQr.trim());
      toast.success(msg);
      setQrInput('');
      await loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.join?.(', ') || err.response?.data?.errors?.[0] || 'No se pudo registrar el ingreso.');
    }
  };

  const handleAddConsumo = async (event: FormEvent) => {
    event.preventDefault();
    if (!data || !perfil || !consumo.servicioId || consumo.cantidad <= 0) return;
    const servicio = servicios.find(item => item.id === consumo.servicioId);
    if (!servicio) return;
    setSavingConsumo(true);
    try {
      await empleadoPortalService.addConsumo({
        eventoId: data.eventoId,
        servicioId: servicio.id,
        cantidad: consumo.cantidad
      });
      toast.success('Consumo registrado');
      setConsumo({ servicioId: 0, cantidad: 1 });
      await loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.join?.(', ') || 'No se pudo registrar el consumo.');
    } finally {
      setSavingConsumo(false);
    }
  };

  const toggleTimer = (itemId: number) => {
    setRunningTimers(current => {
      if (current[itemId]) {
        const copy = { ...current };
        delete copy[itemId];
        return copy;
      }
      return { ...current, [itemId]: Date.now() };
    });
  };

  if (loading || !data) {
    return (
      <div className="flex min-h-[55vh] flex-col items-center justify-center gap-3 text-slate-500">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        <p className="text-sm font-semibold">Cargando evento...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <button onClick={() => navigate('/empleado/eventos')} className="inline-flex w-fit items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50">
          <ArrowLeft size={17} />
          Volver
        </button>
        {badge && <span className={`w-fit rounded-full border px-3 py-1.5 text-xs font-bold ${badge.className}`}>{badge.label}</span>}
      </div>

      <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
          <div>
            <p className="text-sm font-bold text-indigo-700">Evento #{data.eventoId}</p>
            <h1 className="mt-1 text-3xl font-black text-slate-950">{getEventTitle(data.protagonistas.map(p => p.nombre), data.eventoId)}</h1>
            <p className="mt-2 text-sm text-slate-500">{getModalidad(data.paqueteNombre)}</p>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <InfoTile icon={CalendarDays} label="Fecha" value={dateLong.format(new Date(data.fechaEvento))} />
              <InfoTile icon={Clock} label="Horario" value={`${data.horaInicio.slice(0, 5)} - ${data.horaFin.slice(0, 5)}`} />
              <InfoTile icon={Users} label="Invitados" value={`${data.invitados.filter(i => i.ingreso).length}/${data.invitados.length}`} />
            </div>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-5">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Preparación</p>
            <p className="mt-2 text-3xl font-black text-slate-950">{progress}%</p>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-white">
              <div className={progress === 100 ? 'h-full bg-emerald-500' : 'h-full bg-indigo-600'} style={{ width: `${progress}%` }} />
            </div>
            <p className="mt-3 text-sm font-semibold text-slate-500">
              {data.tareas.filter(t => t.estado.toLowerCase() === 'completada').length}/{data.tareas.length} tareas completadas
            </p>
          </div>
        </div>
      </section>

      <div className="flex gap-2 overflow-x-auto rounded-lg border border-slate-200 bg-white p-2 shadow-sm">
        {[
          { id: 'resumen', label: 'Resumen' },
          { id: 'preparacion', label: 'Preparación' },
          { id: 'durante', label: 'Durante la fiesta' },
          { id: 'consumos', label: 'Consumos' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as TabId)}
            className={`whitespace-nowrap rounded-md px-4 py-2 text-sm font-bold transition ${activeTab === tab.id ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'resumen' && (
        <section className="grid gap-4 md:grid-cols-2">
          <SummaryBlock title="Clientes responsables" items={data.clientes.length ? data.clientes : ['Sin clientes registrados']} />
          <SummaryBlock title="Cumpleañeros" items={data.protagonistas.map(p => `${p.nombre}${p.edadCumplir ? `, ${p.edadCumplir} años` : ''}`)} />
          <SummaryBlock title="Datos de preparación" items={[data.tematica ? `Temática: ${data.tematica}` : 'Temática sin registrar', data.notasDecoracion ? `Decoración: ${data.notasDecoracion}` : 'Decoración sin registrar']} />
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2 text-slate-700">
              <CreditCard size={18} className="text-indigo-600" />
              <h2 className="font-black">Estado de cuenta</h2>
            </div>
            <p className="mt-3 text-sm text-slate-500">Visible solo como referencia operativa.</p>
            <p className={`mt-4 text-2xl font-black ${data.saldoPendiente > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
              {data.saldoPendiente > 0 ? `${currency.format(data.saldoPendiente)} pendiente` : 'Sin saldo pendiente'}
            </p>
          </div>
        </section>
      )}

      {activeTab === 'preparacion' && (
        <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-black text-slate-900">Tareas de preparación</h2>
          <div className="mt-5 grid gap-3">
            {data.tareas.length === 0 ? (
              <p className="rounded-md bg-slate-50 p-4 text-sm text-slate-500">No hay tareas para este evento.</p>
            ) : (
              data.tareas.map(tarea => {
                const done = tarea.estado.toLowerCase() === 'completada';
                return (
                  <div key={tarea.id} className="flex flex-col gap-4 rounded-md border border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${done ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>{done ? 'Completada' : 'Pendiente'}</span>
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">{tarea.tipoTarea}</span>
                      </div>
                      <p className="mt-2 font-black text-slate-900">{tarea.nombre}</p>
                      <p className="mt-1 text-sm text-slate-500">{tarea.descripcion || 'Sin descripción'} {tarea.asignadoA ? `· Responsable: ${tarea.asignadoA}` : ''}</p>
                    </div>
                    {!done && (
                      <button onClick={() => handleCompleteTarea(tarea.id)} disabled={busyId === tarea.id} className="inline-flex items-center justify-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-bold text-white hover:bg-indigo-700 disabled:opacity-60">
                        {busyId === tarea.id ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                        Completar
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </section>
      )}

      {activeTab === 'durante' && (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-black text-slate-900">Agenda de la fiesta</h2>
            <div className="mt-5 space-y-3">
              {actividadesOrdenadas.length === 0 ? (
                <p className="rounded-md bg-slate-50 p-4 text-sm text-slate-500">No hay agenda registrada.</p>
              ) : (
                actividadesOrdenadas.map(act => (
                  <div key={act.id} className="flex flex-col gap-4 rounded-md border border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-xs font-bold text-slate-400">{act.horaInicio.slice(0, 5)} - {act.horaFin.slice(0, 5)}</p>
                      <p className="mt-1 font-black text-slate-900">{act.nombre}</p>
                      {act.descripcion && <p className="mt-1 text-sm text-slate-500">{act.descripcion}</p>}
                    </div>
                    <button
                      onClick={() => handleToggleActividad(act.id, !act.completada)}
                      disabled={busyId === act.id}
                      className={`inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-bold ${act.completada ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-900 text-white hover:bg-slate-800'}`}
                    >
                      {busyId === act.id ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                      {act.completada ? 'Completada' : 'Marcar lista'}
                    </button>
                  </div>
                ))
              )}
            </div>

            <h2 className="mt-8 text-xl font-black text-slate-900">Servicios con tiempo</h2>
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {serviciosConTiempo.length === 0 ? (
                <p className="rounded-md bg-slate-50 p-4 text-sm text-slate-500 md:col-span-2">No hay servicios temporizados.</p>
              ) : serviciosConTiempo.map(item => {
                const startedAt = runningTimers[item.id];
                const elapsed = startedAt ? Math.floor((Date.now() - startedAt + timerTick * 0) / 1000) : 0;
                const minutes = Math.floor(elapsed / 60).toString().padStart(2, '0');
                const seconds = (elapsed % 60).toString().padStart(2, '0');
                return (
                  <div key={item.id} className="rounded-md border border-slate-200 p-4">
                    <p className="font-black text-slate-900">{item.nombre}</p>
                    <p className="mt-1 text-sm text-slate-500">Duración sugerida: {item.duracionMinutos} min</p>
                    <div className="mt-4 flex items-center justify-between">
                      <span className="text-2xl font-black tabular-nums text-slate-900">{minutes}:{seconds}</span>
                      <button onClick={() => toggleTimer(item.id)} className={`inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-bold ${startedAt ? 'bg-rose-50 text-rose-700' : 'bg-indigo-600 text-white'}`}>
                        {startedAt ? <Square size={15} /> : <Play size={15} />}
                        {startedAt ? 'Detener' : 'Iniciar'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <aside className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2">
              <QrCode size={20} className="text-indigo-600" />
              <h2 className="text-xl font-black text-slate-900">Ingreso invitados</h2>
            </div>
            <div className="mt-5 flex gap-2">
              <input value={qrInput} onChange={event => setQrInput(event.target.value)} placeholder="Código QR" className="min-w-0 flex-1 rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-500" />
              <button onClick={() => handleRegistrarIngreso(qrInput)} className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-bold text-white hover:bg-indigo-700">Registrar</button>
            </div>
            <div className="mt-5 space-y-2">
              {data.invitados.length === 0 ? (
                <p className="rounded-md bg-slate-50 p-4 text-sm text-slate-500">No hay invitados cargados.</p>
              ) : data.invitados.map(inv => (
                <div key={inv.id} className="flex items-center justify-between gap-3 rounded-md border border-slate-200 p-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-slate-900">{inv.nombre}</p>
                    <p className={`text-xs font-bold ${inv.ingreso ? 'text-emerald-600' : 'text-slate-400'}`}>{inv.ingreso ? 'En salón' : 'Pendiente'}</p>
                  </div>
                  {!inv.ingreso && <button onClick={() => handleRegistrarIngreso(inv.codigoQr)} className="rounded-md bg-slate-900 px-3 py-1.5 text-xs font-bold text-white">Ingresar</button>}
                </div>
              ))}
            </div>
          </aside>
        </div>
      )}

      {activeTab === 'consumos' && (
        <section className="grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
          <form onSubmit={handleAddConsumo} className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-black text-slate-900">Registrar consumo extra</h2>
            <label className="mt-5 block">
              <span className="text-sm font-bold text-slate-700">Servicio</span>
              <select value={consumo.servicioId} onChange={event => setConsumo({ ...consumo, servicioId: Number(event.target.value) })} className="mt-2 w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-500">
                <option value={0}>Seleccionar servicio</option>
                {servicios.map(servicio => <option key={servicio.id} value={servicio.id}>{servicio.nombre} - {currency.format(servicio.costoBase)}</option>)}
              </select>
            </label>
            <label className="mt-4 block">
              <span className="text-sm font-bold text-slate-700">Cantidad</span>
              <input type="number" min={1} value={consumo.cantidad} onChange={event => setConsumo({ ...consumo, cantidad: Number(event.target.value) })} className="mt-2 w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-500" />
            </label>
            <button disabled={savingConsumo || !consumo.servicioId} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-bold text-white hover:bg-indigo-700 disabled:opacity-60">
              {savingConsumo ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
              Registrar consumo
            </button>
          </form>
          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-black text-slate-900">Consumos registrados</h2>
            <div className="mt-5 space-y-3">
              {data.consumos.length === 0 ? (
                <p className="rounded-md bg-slate-50 p-4 text-sm text-slate-500">No hay consumos extra registrados.</p>
              ) : data.consumos.map(item => (
                <div key={item.id} className="flex items-center justify-between rounded-md border border-slate-200 p-4">
                  <div>
                    <p className="font-black text-slate-900">{item.servicio}</p>
                    <p className="text-sm text-slate-500">Cantidad: {item.cantidad}</p>
                  </div>
                  <p className="font-black text-slate-900">{currency.format(item.total)}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

const InfoTile = ({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) => (
  <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
    <Icon className="mb-3 h-5 w-5 text-indigo-600" />
    <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</p>
    <p className="mt-1 text-sm font-black text-slate-900">{value}</p>
  </div>
);

const SummaryBlock = ({ title, items }: { title: string; items: string[] }) => (
  <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
    <h2 className="font-black text-slate-900">{title}</h2>
    <div className="mt-4 space-y-2">
      {items.length === 0 ? <p className="text-sm text-slate-500">Sin registrar</p> : items.map((item, index) => (
        <p key={`${item}-${index}`} className="rounded-md bg-slate-50 p-3 text-sm font-semibold text-slate-700">{item}</p>
      ))}
    </div>
  </div>
);

export default EmpleadoEventoDetailPage;

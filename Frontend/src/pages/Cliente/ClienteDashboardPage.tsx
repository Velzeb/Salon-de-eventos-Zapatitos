import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  CalendarDays,
  CalendarPlus,
  ChevronRight,
  CreditCard,
  Gift,
  Loader2,
  RefreshCw,
  Sparkles,
  WalletCards,
  type LucideIcon
} from 'lucide-react';
import { clientePortalService, type ClienteEvento } from '../../services/clientePortalService';
import { paquetesService, type Servicio } from '../../services/paquetesService';
import { getEstadoEventoBadgeClasses, getEstadoEventoLabel, normalizeEstadoEvento } from '../../utils/estadoEvento';
import MediaViewerR2 from '../../components/common/MediaViewerR2';

const currency = new Intl.NumberFormat('es-BO', { style: 'currency', currency: 'BOB' });
const dateFormat = new Intl.DateTimeFormat('es-BO', { day: '2-digit', month: 'long', year: 'numeric' });

const ClienteDashboardPage = () => {
  const [eventos, setEventos] = useState<ClienteEvento[]>([]);
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const navigate = useNavigate();

  const loadData = async (soft = false) => {
    soft ? setRefreshing(true) : setLoading(true);
    try {
      const [misEventos, serviciosAdicionales] = await Promise.all([
        clientePortalService.getMisEventos(),
        paquetesService.getServiciosAdicionales().catch(() => [])
      ]);
      setEventos(misEventos);
      setServicios(serviciosAdicionales.filter((servicio) => servicio.esExtra).slice(0, 4));
    } finally {
      soft ? setRefreshing(false) : setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const resumen = useMemo(() => {
    const eventosOrdenados = [...eventos].sort((a, b) => new Date(a.fechaEvento).getTime() - new Date(b.fechaEvento).getTime());
    const proximos = eventosOrdenados.filter((evento) => {
      const estado = normalizeEstadoEvento(evento.estado);
      return estado !== 'terminado' && estado !== 'finalizado' && estado !== 'cancelado';
    });
    return {
      totalEventos: eventos.length,
      saldoPendiente: eventos.reduce((sum, evento) => sum + evento.saldoPendiente, 0),
      proximo: proximos[0],
      confirmados: eventos.filter((evento) => normalizeEstadoEvento(evento.estado) === 'confirmado').length
    };
  }, [eventos]);

  if (loading) {
    return (
      <div className="flex min-h-[55vh] flex-col items-center justify-center gap-3 text-slate-500">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        <p className="text-sm font-semibold">Cargando tu panel...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl space-y-2">
            <p className="text-sm font-bold text-indigo-700">Panel del cliente</p>
            <h1 className="text-3xl font-black tracking-tight text-slate-950">Tus reservas y pagos en un solo lugar</h1>
            <p className="text-sm leading-6 text-slate-600">
              Revisa el estado de cada evento, abre tu invitación digital, consulta servicios contratados y reporta pagos para verificación.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => loadData(true)}
              disabled={refreshing}
              className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
            >
              <RefreshCw size={17} className={refreshing ? 'animate-spin' : ''} />
              Actualizar
            </button>
            <Link
              to="/reservar"
              className="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-bold text-white hover:bg-indigo-700"
            >
              <CalendarPlus size={17} />
              Nueva reserva
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        <SummaryCard icon={Gift} label="Eventos" value={resumen.totalEventos.toString()} />
        <SummaryCard icon={CalendarDays} label="Confirmados" value={resumen.confirmados.toString()} />
        <SummaryCard icon={WalletCards} label="Saldo pendiente" value={currency.format(resumen.saldoPendiente)} tone={resumen.saldoPendiente > 0 ? 'rose' : 'emerald'} />
        <SummaryCard
          icon={Sparkles}
          label="Próximo evento"
          value={resumen.proximo ? dateFormat.format(new Date(resumen.proximo.fechaEvento)) : 'Sin fecha activa'}
        />
      </section>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black text-slate-900">Mis eventos</h2>
          </div>

          {eventos.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-300 bg-white p-10 text-center">
              <Gift className="mx-auto mb-4 h-10 w-10 text-slate-300" />
              <h3 className="text-lg font-black text-slate-900">Aún no tienes eventos registrados</h3>
              <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
                Cuando hagas una reserva, aparecerá aquí con pagos, servicios e invitación digital.
              </p>
              <Link
                to="/reservar"
                className="mt-6 inline-flex items-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-bold text-white hover:bg-indigo-700"
              >
                Ver disponibilidad
                <ChevronRight size={16} />
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {eventos.map((evento) => {
                const estado = normalizeEstadoEvento(evento.estado);
                return (
                  <button
                    key={evento.id}
                    onClick={() => navigate(`/cliente/eventos/${evento.id}`)}
                    className="w-full rounded-lg border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:border-indigo-200 hover:shadow-md"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0 space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`rounded-full border px-2.5 py-1 text-xs font-bold ${getEstadoEventoBadgeClasses(estado)}`}>
                            {getEstadoEventoLabel(estado)}
                          </span>
                          <span className="text-xs font-semibold text-slate-500">Evento #{evento.id}</span>
                        </div>
                        <h3 className="truncate text-lg font-black text-slate-900">
                          {evento.nombreCumpleanero ? `Cumpleaños de ${evento.nombreCumpleanero}` : 'Evento reservado'}
                        </h3>
                        <p className="text-sm text-slate-500">{evento.paquete}</p>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-3 sm:text-right">
                        <SmallMetric label="Fecha" value={dateFormat.format(new Date(evento.fechaEvento))} />
                        <SmallMetric label="Total" value={currency.format(evento.precioTotal)} />
                        <SmallMetric label="Pendiente" value={currency.format(evento.saldoPendiente)} accent={evento.saldoPendiente > 0} />
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        <aside className="space-y-4">
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-base font-black text-slate-900">Servicios adicionales</h2>
            <p className="mt-1 text-sm text-slate-500">Catálogo activo disponible para complementar una reserva.</p>
            <div className="mt-5 space-y-3">
              {servicios.length === 0 ? (
                <p className="rounded-md bg-slate-50 p-4 text-sm text-slate-500">No hay servicios extra publicados por ahora.</p>
              ) : (
                servicios.map((servicio) => (
                  <div key={servicio.id} className="flex gap-3 rounded-md border border-slate-100 p-3">
                    <div className="h-16 w-16 shrink-0 overflow-hidden rounded-md bg-slate-100">
                      {servicio.imagenUrl ? (
                        <MediaViewerR2 url={servicio.imagenUrl} alt={servicio.nombre} className="h-full w-full" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-slate-300">
                          <Sparkles size={22} />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-black text-slate-800">{servicio.nombre}</p>
                      <p className="mt-1 line-clamp-2 text-xs text-slate-500">{servicio.descripcion || 'Servicio disponible para eventos.'}</p>
                      <p className="mt-2 text-xs font-black text-indigo-700">{currency.format(servicio.costoBase)}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
            <Link
              to="/reservar"
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-md bg-slate-900 px-4 py-2 text-sm font-bold text-white hover:bg-slate-800"
            >
              Cotizar reserva
              <ChevronRight size={16} />
            </Link>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start gap-3">
              <CreditCard className="mt-0.5 h-5 w-5 text-indigo-600" />
              <div>
                <h2 className="text-base font-black text-slate-900">Pagos pendientes</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Para reportar un pago, abre el evento correspondiente y adjunta el comprobante.
                </p>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

const SummaryCard = ({
  icon: Icon,
  label,
  value,
  tone = 'indigo'
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  tone?: 'indigo' | 'rose' | 'emerald';
}) => {
  const toneClasses = {
    indigo: 'bg-indigo-50 text-indigo-700',
    rose: 'bg-rose-50 text-rose-700',
    emerald: 'bg-emerald-50 text-emerald-700'
  };
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className={`mb-4 flex h-10 w-10 items-center justify-center rounded-md ${toneClasses[tone]}`}>
        <Icon size={20} />
      </div>
      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-xl font-black text-slate-950">{value}</p>
    </div>
  );
};

const SmallMetric = ({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) => (
  <div>
    <p className="text-xs font-bold uppercase tracking-wide text-slate-400">{label}</p>
    <p className={`text-sm font-black ${accent ? 'text-rose-600' : 'text-slate-800'}`}>{value}</p>
  </div>
);

export default ClienteDashboardPage;

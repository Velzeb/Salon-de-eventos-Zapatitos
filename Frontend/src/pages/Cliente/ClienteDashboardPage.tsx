import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  CalendarDays,
  CalendarPlus,
  ChevronRight,
  CreditCard,
  FileText,
  Gift,
  Heart,
  Loader2,
  PartyPopper,
  RefreshCw,
  Sparkles,
  UserRound,
  WalletCards,
  type LucideIcon
} from 'lucide-react';
import { authService } from '../../services/authService';
import { clientePortalService, type ClienteEvento, type PerfilCliente } from '../../services/clientePortalService';
import { paquetesService, type Paquete, type Servicio } from '../../services/paquetesService';
import { getEstadoEventoBadgeClasses, getEstadoEventoLabel, normalizeEstadoEvento } from '../../utils/estadoEvento';
import { getPackageImageFallback } from '../../utils/imageFallbacks';
import MediaViewerR2 from '../../components/common/MediaViewerR2';
import heroImage from '../../assets/hero.png';

const currency = new Intl.NumberFormat('es-BO', { style: 'currency', currency: 'BOB' });
const dateFormat = new Intl.DateTimeFormat('es-BO', { day: '2-digit', month: 'long', year: 'numeric' });
const normalizeName = (value: string) => value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();

const ClienteDashboardPage = () => {
  const [eventos, setEventos] = useState<ClienteEvento[]>([]);
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [paquetes, setPaquetes] = useState<Paquete[]>([]);
  const [perfil, setPerfil] = useState<PerfilCliente | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const navigate = useNavigate();
  const userName = perfil?.nombreCompleto || authService.getUserName() || 'familia';

  const loadData = async (soft = false) => {
    soft ? setRefreshing(true) : setLoading(true);
    try {
      const [misEventos, serviciosAdicionales, paquetesCatalogo, perfilCliente] = await Promise.all([
        clientePortalService.getMisEventos(),
        paquetesService.getServiciosAdicionales().catch(() => []),
        paquetesService.getPaquetes().catch(() => []),
        clientePortalService.getPerfil().catch(() => null)
      ]);
      setEventos(misEventos);
      setServicios(serviciosAdicionales.filter((servicio) => servicio.esExtra).slice(0, 4));
      setPaquetes(paquetesCatalogo);
      setPerfil(perfilCliente);
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

  const paquetesPorNombre = useMemo(() => {
    return new Map(paquetes.map((paquete) => [normalizeName(paquete.nombre), paquete]));
  }, [paquetes]);

  const getPaqueteInfo = (nombre: string) => {
    const paquete = paquetesPorNombre.get(normalizeName(nombre));
    return {
      paquete,
      imagen: paquete?.imagenUrl || getPackageImageFallback(nombre),
      descripcion: paquete?.descripcion || 'Paquete seleccionado para esta celebración.',
      duracion: paquete?.duracionHoras,
      capacidad: paquete?.capacidadNinos
    };
  };

  const proximoPaquete = resumen.proximo ? getPaqueteInfo(resumen.proximo.paquete) : null;

  if (loading) {
    return (
      <div className="flex min-h-[55vh] flex-col items-center justify-center gap-4 text-slate-500">
        <div className="flex h-16 w-16 items-center justify-center rounded-[1.5rem] bg-white shadow-premium">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
        <p className="text-sm font-bold">Preparando tu panel...</p>
      </div>
    );
  }

  return (
    <div className="space-y-7">
      <section className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm">
        <div className="relative grid gap-0 lg:grid-cols-[minmax(0,1fr)_420px]">
          <div className="space-y-6">
            <div className="space-y-6 p-6 lg:p-8">
              <div className="inline-flex items-center gap-2 rounded-full border border-purple-100 bg-purple-50 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-primary">
                <Sparkles size={15} />
                Portal familiar
              </div>
              <div className="max-w-2xl space-y-3">
                <h1 className="font-display text-4xl font-black leading-tight text-slate-950 lg:text-5xl">
                  Hola, {userName}. Tus eventos están aquí.
                </h1>
                <p className="text-sm font-medium leading-6 text-slate-600 lg:text-base">
                  Consulta reservas, pagos, invitaciones y detalles importantes desde un panel pensado para familias.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Link
                  to="/reservar"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-primary-gradient px-5 py-3 text-sm font-black text-white shadow-lg shadow-pink-200/60 transition hover:scale-[1.02] active:scale-95"
                >
                  <CalendarPlus size={18} />
                  Nueva reserva
                </Link>
                <button
                  onClick={() => loadData(true)}
                  disabled={refreshing}
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700 shadow-sm transition hover:border-purple-200 hover:bg-purple-50 disabled:opacity-60"
                >
                  <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
                  Actualizar
                </button>
              </div>
            </div>
          </div>

          <div className="relative min-h-[360px] overflow-hidden bg-slate-950">
            <MediaViewerR2
              url={proximoPaquete?.imagen || heroImage}
              alt="Celebración en Zapatitos"
              className="absolute inset-0"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/45 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-5 text-white">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.14em] backdrop-blur">
                <PartyPopper size={14} />
                Próximo evento
              </div>
              {resumen.proximo ? (
                <button
                  onClick={() => navigate(`/cliente/eventos/${resumen.proximo.id}`)}
                  className="w-full rounded-2xl border border-white/20 bg-white/95 p-4 text-left text-slate-950 shadow-lg backdrop-blur transition hover:scale-[1.01]"
                >
                  <p className="font-display text-2xl font-black">
                    {resumen.proximo.nombreCumpleanero ? `Cumpleaños de ${resumen.proximo.nombreCumpleanero}` : 'Evento reservado'}
                  </p>
                  <p className="mt-1 text-sm font-bold text-primary">{resumen.proximo.paquete}</p>
                  <div className="mt-4 grid gap-3 text-xs font-black text-slate-600 sm:grid-cols-2">
                    <span className="inline-flex items-center gap-2">
                      <CalendarDays size={15} className="text-primary" />
                      {dateFormat.format(new Date(resumen.proximo.fechaEvento))}
                    </span>
                    <span className="inline-flex items-center gap-2">
                      <WalletCards size={15} className="text-emerald-600" />
                      {currency.format(resumen.proximo.saldoPendiente)} pendiente
                    </span>
                  </div>
                </button>
              ) : (
                <div className="rounded-2xl border border-white/15 bg-white/15 p-4 backdrop-blur">
                  <p className="text-sm font-bold text-white">Cuando hagas una reserva, verás aquí la fecha y el acceso rápido a sus detalles.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        <SummaryCard icon={Gift} label="Eventos" value={resumen.totalEventos.toString()} tone="pink" />
        <SummaryCard icon={CalendarDays} label="Confirmados" value={resumen.confirmados.toString()} tone="emerald" />
        <SummaryCard icon={WalletCards} label="Saldo pendiente" value={currency.format(resumen.saldoPendiente)} tone={resumen.saldoPendiente > 0 ? 'rose' : 'emerald'} />
        <SummaryCard
          icon={Sparkles}
          label="Próximo evento"
          value={resumen.proximo ? dateFormat.format(new Date(resumen.proximo.fechaEvento)) : 'Sin fecha activa'}
          tone="amber"
        />
      </section>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
        <section className="space-y-4">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-primary">Reservas</p>
              <h2 className="font-display text-2xl font-black text-slate-950">Mis eventos</h2>
            </div>
            <p className="text-sm font-medium text-slate-500">
              {eventos.length} evento{eventos.length === 1 ? '' : 's'} registrado{eventos.length === 1 ? '' : 's'}
            </p>
          </div>

          {eventos.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-pink-50 text-pink-500">
                <Gift size={28} />
              </div>
              <h3 className="font-display text-xl font-black text-slate-900">Aún no tienes eventos registrados</h3>
              <p className="mx-auto mt-2 max-w-md text-sm font-medium text-slate-500">
                Cuando hagas una reserva, aparecerá aquí con pagos, servicios e invitación digital.
              </p>
              <Link
                to="/reservar"
                className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary-gradient px-5 py-3 text-sm font-black text-white shadow-lg shadow-pink-200/60"
              >
                Ver disponibilidad
                <ChevronRight size={16} />
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {eventos.map((evento) => {
                const estado = normalizeEstadoEvento(evento.estado);
                const paqueteInfo = getPaqueteInfo(evento.paquete);
                const pagado = Math.max(evento.precioTotal - evento.saldoPendiente, 0);
                const porcentajePago = evento.precioTotal > 0 ? Math.min(100, Math.round((pagado / evento.precioTotal) * 100)) : 0;
                return (
                  <button
                    key={evento.id}
                    onClick={() => navigate(`/cliente/eventos/${evento.id}`)}
                    className="group w-full overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white text-left shadow-sm transition hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lg"
                  >
                    <div className="grid md:grid-cols-[220px_minmax(0,1fr)]">
                      <div className="relative min-h-[190px] overflow-hidden bg-slate-100 md:min-h-full">
                        <MediaViewerR2 url={paqueteInfo.imagen} alt={evento.paquete} className="absolute inset-0 transition duration-500 group-hover:scale-105" />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-950/10 to-transparent" />
                        <div className="absolute left-4 top-4 rounded-full bg-white/95 px-3 py-1 text-[11px] font-black uppercase tracking-[0.12em] text-primary shadow-sm">
                          {evento.paquete}
                        </div>
                        <div className="absolute bottom-4 left-4 right-4">
                          <p className="line-clamp-2 text-sm font-bold leading-5 text-white">
                            {paqueteInfo.descripcion}
                          </p>
                        </div>
                      </div>

                      <div className="p-5">
                      <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                        <div className="min-w-0 space-y-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className={`rounded-full border px-3 py-1 text-xs font-black ${getEstadoEventoBadgeClasses(estado)}`}>
                              {getEstadoEventoLabel(estado)}
                            </span>
                            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-500">Evento #{evento.id}</span>
                          </div>
                          <div>
                            <h3 className="truncate font-display text-2xl font-black text-slate-950">
                              {evento.nombreCumpleanero ? `Cumpleaños de ${evento.nombreCumpleanero}` : 'Evento reservado'}
                            </h3>
                            <div className="mt-2 flex flex-wrap gap-2 text-xs font-black text-slate-500">
                              {paqueteInfo.duracion ? (
                                <span className="rounded-full bg-slate-100 px-3 py-1">{paqueteInfo.duracion} h de celebración</span>
                              ) : null}
                              {paqueteInfo.capacidad ? (
                                <span className="rounded-full bg-slate-100 px-3 py-1">Hasta {paqueteInfo.capacidad} niños</span>
                              ) : null}
                            </div>
                          </div>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-3 xl:min-w-[430px]">
                          <SmallMetric icon={CalendarDays} label="Fecha" value={dateFormat.format(new Date(evento.fechaEvento))} tone="lavender" />
                          <SmallMetric icon={CreditCard} label="Total" value={currency.format(evento.precioTotal)} tone="blue" />
                          <SmallMetric icon={WalletCards} label="Pendiente" value={currency.format(evento.saldoPendiente)} accent={evento.saldoPendiente > 0} tone={evento.saldoPendiente > 0 ? 'rose' : 'green'} />
                        </div>
                      </div>
                      <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
                        <div className="mb-2 flex items-center justify-between text-xs font-black uppercase tracking-[0.12em] text-slate-500">
                          <span>Pago registrado</span>
                          <span>{porcentajePago}%</span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-white ring-1 ring-slate-200">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-400 transition-all"
                            style={{ width: `${porcentajePago}%` }}
                          />
                        </div>
                        <p className="mt-3 inline-flex items-center gap-2 text-xs font-bold text-slate-500">
                          <ChevronRight size={15} className="transition group-hover:translate-x-1" />
                          Abrir detalles, pagos e invitación
                        </p>
                      </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        <aside className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-50 text-primary">
                <Sparkles size={21} />
              </div>
              <div>
                <h2 className="font-display text-xl font-black text-slate-950">Servicios adicionales</h2>
                <p className="mt-1 text-sm font-medium text-slate-500">Complementos disponibles para tu celebración.</p>
              </div>
            </div>
            <div className="mt-5 space-y-3">
              {servicios.length === 0 ? (
                <p className="rounded-2xl bg-slate-50 p-4 text-sm font-medium text-slate-500">No hay servicios extra publicados por ahora.</p>
              ) : (
                servicios.map((servicio) => (
                  <div key={servicio.id} className="flex gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-white">
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
                      <p className="mt-2 text-xs font-black text-primary">{currency.format(servicio.costoBase)}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
            <Link
              to="/reservar"
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-slate-950 px-4 py-3 text-sm font-black text-white transition hover:bg-slate-800"
            >
              Cotizar reserva
              <ChevronRight size={16} />
            </Link>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
                <CreditCard size={21} />
              </div>
              <div>
                <h2 className="font-display text-xl font-black text-slate-950">Pagos pendientes</h2>
                <p className="mt-1 text-sm font-medium leading-6 text-slate-500">
                  Para reportar un pago, abre el evento correspondiente y adjunta el comprobante.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="font-display text-xl font-black text-slate-950">Accesos rápidos</h2>
            <div className="mt-4 grid gap-3">
              <QuickLink icon={UserRound} label="Actualizar perfil" to="/cliente/perfil" />
              <QuickLink icon={FileText} label="Ver disponibilidad" to="/reservar" />
              <QuickLink icon={Heart} label="Planear otro evento" to="/servicios-y-paquetes" />
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
  tone?: 'indigo' | 'rose' | 'emerald' | 'pink' | 'amber';
}) => {
  const toneClasses = {
    indigo: {
      card: 'border-slate-200 bg-white',
      icon: 'bg-indigo-50 text-indigo-700',
      accent: 'bg-indigo-500'
    },
    rose: {
      card: 'border-slate-200 bg-white',
      icon: 'bg-rose-50 text-rose-700',
      accent: 'bg-rose-500'
    },
    emerald: {
      card: 'border-slate-200 bg-white',
      icon: 'bg-emerald-50 text-emerald-700',
      accent: 'bg-emerald-500'
    },
    pink: {
      card: 'border-slate-200 bg-white',
      icon: 'bg-pink-50 text-pink-700',
      accent: 'bg-pink-500'
    },
    amber: {
      card: 'border-slate-200 bg-white',
      icon: 'bg-amber-50 text-amber-700',
      accent: 'bg-amber-500'
    }
  };
  return (
    <div className={`relative overflow-hidden rounded-2xl border p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${toneClasses[tone].card}`}>
      <div className={`absolute inset-y-0 left-0 w-1 ${toneClasses[tone].accent}`} />
      <div className={`mb-4 flex h-11 w-11 items-center justify-center rounded-xl ${toneClasses[tone].icon}`}>
        <Icon size={20} />
      </div>
      <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">{label}</p>
      <p className="mt-1 break-words font-display text-2xl font-black text-slate-950">{value}</p>
    </div>
  );
};

const SmallMetric = ({
  icon: Icon,
  label,
  value,
  accent = false,
  tone = 'lavender'
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  accent?: boolean;
  tone?: 'lavender' | 'blue' | 'rose' | 'green';
}) => {
  const toneClasses = {
    lavender: 'border-slate-200 bg-white text-purple-700',
    blue: 'border-slate-200 bg-white text-sky-700',
    rose: 'border-slate-200 bg-white text-rose-700',
    green: 'border-slate-200 bg-white text-emerald-700'
  };

  return (
    <div className={`rounded-xl border p-3 ${toneClasses[tone]}`}>
      <p className="flex items-center gap-1.5 text-xs font-black uppercase tracking-[0.12em] opacity-70">
      <Icon size={14} />
      {label}
    </p>
      <p className={`mt-1 text-sm font-black ${accent ? 'text-rose-700' : 'text-slate-800'}`}>{value}</p>
    </div>
  );
};

const QuickLink = ({ icon: Icon, label, to }: { icon: LucideIcon; label: string; to: string }) => (
  <Link
    to={to}
    className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-black text-slate-700 transition hover:border-primary/30 hover:bg-purple-50 hover:text-primary"
  >
    <span className="inline-flex items-center gap-3">
      <Icon size={18} />
      {label}
    </span>
    <ChevronRight size={16} />
  </Link>
);

export default ClienteDashboardPage;

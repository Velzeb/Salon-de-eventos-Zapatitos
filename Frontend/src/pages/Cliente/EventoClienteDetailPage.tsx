import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  CalendarDays,
  Camera,
  CheckCircle2,
  ChevronRight,
  Clock,
  Copy,
  CreditCard,
  ExternalLink,
  Gift,
  Loader2,
  MapPin,
  ReceiptText,
  Sparkles,
  Star,
  Upload,
  X,
  type LucideIcon
} from 'lucide-react';
import type { ReactNode } from 'react';
import { toast } from 'sonner';
import { clientePortalService, type EventoClienteDetail } from '../../services/clientePortalService';
import { paquetesService, type Paquete, type Servicio } from '../../services/paquetesService';
import { configService } from '../../services/configService';
import { getEstadoEventoBadgeClasses, getEstadoEventoLabel, normalizeEstadoEvento } from '../../utils/estadoEvento';
import { getPackageImageFallback, getServiceImageFallback } from '../../utils/imageFallbacks';
import MediaViewerR2 from '../../components/common/MediaViewerR2';
import heroImage from '../../assets/hero.png';

const currency = new Intl.NumberFormat('es-BO', { style: 'currency', currency: 'BOB' });
const dateFormat = new Intl.DateTimeFormat('es-BO', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
const normalizeName = (value: string) => value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();

type TabId = 'resumen' | 'servicios' | 'pagos' | 'fotos';

const EventoClienteDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const [data, setData] = useState<EventoClienteDetail | null>(null);
  const [paquetes, setPaquetes] = useState<Paquete[]>([]);
  const [serviciosCatalogo, setServiciosCatalogo] = useState<Servicio[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabId>('resumen');
  const [qrPago, setQrPago] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [showPagoModal, setShowPagoModal] = useState(false);
  const [pagoMonto, setPagoMonto] = useState('');
  const [comprobanteB64, setComprobanteB64] = useState('');
  const [enviandoPago, setEnviandoPago] = useState(false);
  const [rating, setRating] = useState(0);
  const [comentario, setComentario] = useState('');
  const [enviandoRating, setEnviandoRating] = useState(false);

  const loadData = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [detail, config] = await Promise.all([
        clientePortalService.getEventoDetail(Number(id)),
        configService.getLandingConfig().catch(() => [])
      ]);
      const [paquetesCatalogo, servicios] = await Promise.all([
        paquetesService.getPaquetes().catch(() => []),
        paquetesService.getServicios().catch(() => [])
      ]);
      setData(detail);
      setPaquetes(paquetesCatalogo);
      setServiciosCatalogo(servicios);
      setQrPago(config.find((item) => item.clave === 'qr_pago_base64')?.valor || '');
      setContactPhone(config.find((item) => item.clave === 'contact_phone')?.valor || '');
    } catch (err) {
      console.error('Error al cargar detalle del evento', err);
      toast.error('No se pudo cargar el evento.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const estadoKey = normalizeEstadoEvento(data?.estado);
  const paqueteActual = useMemo(() => {
    if (!data) return null;
    return paquetes.find((paquete) => normalizeName(paquete.nombre) === normalizeName(data.paquete)) || null;
  }, [data, paquetes]);
  const paqueteImage = data ? paqueteActual?.imagenUrl || getPackageImageFallback(data.paquete) : heroImage;
  const paqueteDescripcion = paqueteActual?.descripcion || 'Paquete seleccionado para esta celebración.';
  const totalAbonado = useMemo(() => {
    if (!data) return 0;
    return Math.max(data.precioTotal - data.saldoPendiente, 0);
  }, [data]);
  const porcentajePago = data?.precioTotal ? Math.min(100, Math.round((totalAbonado / data.precioTotal) * 100)) : 0;
  const serviciosPorNombre = useMemo(() => {
    return new Map(serviciosCatalogo.map((servicio) => [normalizeName(servicio.nombre), servicio]));
  }, [serviciosCatalogo]);
  const serviciosEnriquecidos = useMemo(() => {
    if (!data) return [];
    return data.items.map((item) => {
      const servicio = serviciosPorNombre.get(normalizeName(item.nombre));
      return {
        ...item,
        descripcion: servicio?.descripcion,
        duracionMinutos: servicio?.duracionMinutos,
        requiereTemporizador: servicio?.requiereTemporizador,
        tipo: servicio?.tipo,
        imagenUrl: servicio?.imagenUrl || getServiceImageFallback(item.nombre)
      };
    });
  }, [data, serviciosPorNombre]);

  const invitationUrl = data?.invitacionToken ? `${window.location.origin}/invitacion/${data.invitacionToken}` : '';
  const whatsappUrl = contactPhone
    ? `https://wa.me/${contactPhone.replace(/\D/g, '')}?text=${encodeURIComponent(`Hola, necesito ayuda con mi evento #${data?.id ?? ''}.`)}`
    : '';

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast.error('Sube una imagen JPG, PNG o WEBP.');
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      toast.error('El comprobante no debe superar los 3MB.');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => setComprobanteB64(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handlePago = async () => {
    if (!id || !pagoMonto || Number(pagoMonto) <= 0) {
      toast.error('Ingresa un monto válido.');
      return;
    }
    if (!comprobanteB64) {
      toast.error('Adjunta el comprobante del pago.');
      return;
    }
    setEnviandoPago(true);
    try {
      await clientePortalService.addPagoQR(Number(id), Number(pagoMonto), comprobanteB64);
      setShowPagoModal(false);
      setPagoMonto('');
      setComprobanteB64('');
      if (fileRef.current) fileRef.current.value = '';
      await loadData();
      toast.success('Pago reportado. El equipo lo revisará pronto.');
    } catch (err: any) {
      toast.error(err.response?.data?.join?.(', ') || 'No se pudo registrar el pago.');
    } finally {
      setEnviandoPago(false);
    }
  };

  const handleRating = async () => {
    if (!id || rating === 0) return;
    setEnviandoRating(true);
    try {
      await clientePortalService.addFeedback({ eventoId: Number(id), calificacion: rating, comentario: comentario || undefined });
      await loadData();
      toast.success('Gracias por tu calificación.');
    } catch (err: any) {
      toast.error(err.response?.data?.join?.(', ') || 'No se pudo enviar la calificación.');
    } finally {
      setEnviandoRating(false);
    }
  };

  if (loading || !data) {
    return (
      <div className="flex min-h-[55vh] flex-col items-center justify-center gap-4 text-slate-500">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-sm">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
        <p className="text-sm font-bold">Preparando detalle del evento...</p>
      </div>
    );
  }

  return (
    <div className="space-y-7">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <button
          onClick={() => navigate('/cliente/dashboard')}
          className="inline-flex w-fit items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-black text-slate-700 shadow-sm transition hover:border-primary/30 hover:bg-purple-50 hover:text-primary"
        >
          <ArrowLeft size={17} />
          Volver
        </button>
        <span className={`w-fit rounded-full border px-3 py-1.5 text-xs font-bold ${getEstadoEventoBadgeClasses(estadoKey)}`}>
          {getEstadoEventoLabel(estadoKey)}
        </span>
      </div>

      <section className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm">
        <div className="grid lg:grid-cols-[minmax(0,1fr)_420px]">
          <div className="space-y-6 p-6 lg:p-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-purple-100 bg-purple-50 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-primary">
              <Sparkles size={15} />
              Evento #{data.id}
            </div>
            <div>
              <h1 className="font-display text-4xl font-black leading-tight text-slate-950 lg:text-5xl">
                {data.nombreCumpleaneros ? `Cumpleaños de ${data.nombreCumpleaneros}` : 'Evento reservado'}
              </h1>
              <p className="mt-3 text-base font-bold text-primary">{data.paquete}</p>
              <p className="mt-2 max-w-2xl text-sm font-medium leading-6 text-slate-600">{paqueteDescripcion}</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <InfoTile icon={CalendarDays} label="Fecha" value={dateFormat.format(new Date(data.fechaEvento))} />
              <InfoTile icon={Clock} label="Horario" value={`${data.horaInicio.slice(0, 5)} - ${data.horaFin.slice(0, 5)}`} />
              <InfoTile icon={MapPin} label="Lugar" value={data.nombreNegocio || 'Salón Zapatitos'} />
            </div>
          </div>

          <div className="relative min-h-[420px] overflow-hidden bg-slate-950">
            <MediaViewerR2 url={paqueteImage} alt={data.paquete} className="absolute inset-0" />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/55 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-5">
              <div className="rounded-2xl border border-white/15 bg-white/95 p-5 text-slate-950 shadow-lg backdrop-blur">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">Estado de cuenta</p>
                <div className="mt-4 space-y-3">
                  <MoneyRow label="Total" value={data.precioTotal} />
                  <MoneyRow label="Abonado" value={totalAbonado} tone="emerald" />
                  <MoneyRow label="Pendiente" value={data.saldoPendiente} tone={data.saldoPendiente > 0 ? 'rose' : 'emerald'} strong />
                </div>
                <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-400"
                    style={{ width: `${data.precioTotal > 0 ? Math.min(100, Math.round((totalAbonado / data.precioTotal) * 100)) : 0}%` }}
                  />
                </div>
                {data.saldoPendiente > 0 && (
                  <button
                    onClick={() => setShowPagoModal(true)}
                    className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary-gradient px-4 py-3 text-sm font-black text-white shadow-lg shadow-pink-200/60 transition hover:scale-[1.01]"
                  >
                    <CreditCard size={17} />
                    Reportar pago
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="flex gap-2 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
        {[
          { id: 'resumen', label: 'Resumen', icon: Gift },
          { id: 'servicios', label: 'Servicios', icon: ReceiptText },
          { id: 'pagos', label: 'Pagos', icon: CreditCard },
          { id: 'fotos', label: 'Fotos', icon: Camera }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as TabId)}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-black transition-colors ${
              activeTab === tab.id ? 'bg-primary-gradient text-white shadow-lg shadow-pink-200/50' : 'text-slate-600 hover:bg-purple-50 hover:text-primary'
            }`}
          >
            <tab.icon size={17} />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'resumen' && (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
          <section className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-primary">Preparación</p>
              <h2 className="font-display text-2xl font-black text-slate-950">Información registrada</h2>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              <SummaryMiniCard label="Servicios" value={data.items.length.toString()} helper="Incluidos y extras" />
              <SummaryMiniCard label="Pago" value={`${porcentajePago}%`} helper={`${currency.format(totalAbonado)} abonado`} />
              <SummaryMiniCard label="Invitación" value={invitationUrl ? 'Lista' : 'Pendiente'} helper="Enlace digital" />
            </div>
            {data.tematica ? (
              <DetailGrid items={[['Temática', data.tematica]]} />
            ) : (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-sm font-bold text-slate-900">Aún no hay preferencias visibles para el cliente.</p>
                <p className="mt-1 text-sm font-medium text-slate-500">
                  Si necesitas cambiar temática, horarios, responsables o detalles especiales, contacta al equipo desde esta pantalla.
                </p>
              </div>
            )}
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-sm font-black text-slate-900">Estado de la reserva</p>
              <div className="mt-4 grid gap-3 md:grid-cols-4">
                <TimelineStep done label="Reserva creada" />
                <TimelineStep done={totalAbonado > 0} label="Pago reportado" />
                <TimelineStep done={estadoKey === 'confirmado' || estadoKey === 'finalizado' || estadoKey === 'terminado'} label="Confirmación" />
                <TimelineStep done={estadoKey === 'finalizado' || estadoKey === 'terminado'} label="Evento realizado" />
              </div>
            </div>
          </section>

          <aside className="space-y-4">
            <ActionCard icon={Gift} title="Invitación digital" text={invitationUrl ? 'Comparte este enlace con tus invitados.' : 'La invitación aún no está disponible.'}>
              {invitationUrl ? (
                <div className="space-y-3">
                  <button
                    onClick={() => navigator.clipboard.writeText(invitationUrl).then(() => toast.success('Enlace copiado.'))}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-black text-slate-700 hover:bg-slate-50"
                  >
                    <Copy size={16} />
                    Copiar enlace
                  </button>
                  <a href={invitationUrl} target="_blank" rel="noreferrer" className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-black text-white hover:bg-slate-800">
                    Abrir invitación
                    <ExternalLink size={16} />
                  </a>
                </div>
              ) : null}
            </ActionCard>
            <ActionCard icon={MapPin} title="Atención" text="Contacta al equipo si necesitas cambiar detalles de tu reserva.">
              {whatsappUrl ? (
                <a href={whatsappUrl} target="_blank" rel="noreferrer" className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-black text-white hover:bg-emerald-700">
                  Contactar por WhatsApp
                  <ChevronRight size={16} />
                </a>
              ) : (
                <Link to="/#contacto" className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-black text-white hover:bg-slate-800">
                  Ir a contacto
                </Link>
              )}
            </ActionCard>
          </aside>
        </div>
      )}

      {activeTab === 'servicios' && (
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-primary">Paquete y extras</p>
              <h2 className="font-display text-2xl font-black text-slate-950">Servicios contratados</h2>
              <p className="mt-2 max-w-2xl text-sm font-medium leading-6 text-slate-500">
                Aquí ves lo que incluye tu reserva y los extras agregados. Los detalles vienen del catálogo configurado por administración.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">Total items</p>
              <p className="font-display text-2xl font-black text-slate-950">{serviciosEnriquecidos.length}</p>
            </div>
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {serviciosEnriquecidos.length === 0 ? (
              <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500 md:col-span-2">No hay servicios registrados para este evento.</p>
            ) : (
              serviciosEnriquecidos.map((item, index) => (
                <article key={`${item.nombre}-${index}`} className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                  <div className="grid sm:grid-cols-[170px_minmax(0,1fr)]">
                    <div className="relative min-h-[180px] overflow-hidden bg-slate-100">
                      <MediaViewerR2 url={item.imagenUrl} alt={item.nombre} className="absolute inset-0 transition duration-500 group-hover:scale-105" />
                      <div className="absolute left-3 top-3 rounded-full bg-white/95 px-3 py-1 text-[11px] font-black uppercase tracking-[0.12em] text-primary shadow-sm">
                        {item.esExtra ? 'Extra' : 'Incluido'}
                      </div>
                    </div>
                    <div className="flex min-h-[180px] flex-col p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="font-display text-xl font-black leading-tight text-slate-950">{item.nombre}</h3>
                          <p className="mt-2 line-clamp-3 text-sm font-medium leading-6 text-slate-500">
                            {item.descripcion || 'Servicio configurado para esta celebración.'}
                          </p>
                        </div>
                        <span className="shrink-0 rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-700">
                          x{item.cantidad}
                        </span>
                      </div>
                      <div className="mt-auto flex flex-wrap items-center gap-2 pt-4">
                        {item.duracionMinutos ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-50 px-3 py-1.5 text-xs font-black text-sky-700">
                            <Clock size={14} />
                            {item.duracionMinutos} min
                          </span>
                        ) : null}
                        {item.requiereTemporizador ? (
                          <span className="rounded-full bg-violet-50 px-3 py-1.5 text-xs font-black text-violet-700">Con temporizador</span>
                        ) : null}
                        <span className={`ml-auto rounded-full px-3 py-1.5 text-xs font-black ${item.precio > 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-indigo-50 text-indigo-700'}`}>
                          {item.precio > 0 ? currency.format(item.precio) : 'Incluido'}
                        </span>
                      </div>
                    </div>
                  </div>
                </article>
              ))
            )}
          </div>
        </section>
      )}

      {activeTab === 'pagos' && (
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-primary">Finanzas</p>
              <h2 className="font-display text-2xl font-black text-slate-950">Historial de pagos</h2>
            </div>
            {data.saldoPendiente > 0 && (
              <button onClick={() => setShowPagoModal(true)} className="inline-flex items-center gap-2 rounded-full bg-primary-gradient px-4 py-2.5 text-sm font-black text-white shadow-lg shadow-pink-200/50">
                <CreditCard size={17} />
                Reportar pago
              </button>
            )}
          </div>
          <div className="mt-5 space-y-3">
            {data.pagos.length === 0 ? (
              <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">Aún no hay pagos registrados.</p>
            ) : (
              data.pagos.map((pago) => (
                <div key={pago.id} className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white text-emerald-600 shadow-sm">
                      <CreditCard size={21} />
                    </div>
                    <div>
                    <p className="font-black text-slate-900">{currency.format(pago.monto)}</p>
                    <p className="text-sm text-slate-500">{new Date(pago.fechaPago).toLocaleDateString('es-BO')}</p>
                    {pago.referencia && <p className="mt-1 text-xs text-slate-500">{pago.referencia}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {pago.comprobanteUrl && (
                      <a href={pago.comprobanteUrl} target="_blank" rel="noreferrer" className="text-sm font-bold text-indigo-700 hover:underline">
                        Ver comprobante
                      </a>
                    )}
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">{pago.estado}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      )}

      {activeTab === 'fotos' && (
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-primary">Galería</p>
            <h2 className="font-display text-2xl font-black text-slate-950">Fotos y recuerdos</h2>
          </div>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[...data.galeriaMultimedia, ...data.fotosUrls.map((url, index) => ({ id: -index - 1, url, nombreArchivo: 'Foto del evento', tipoArchivo: 'Imagen', fechaSubida: data.fechaEvento }))].length === 0 ? (
              <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500 sm:col-span-2 lg:col-span-3">Aún no hay fotos visibles para cliente.</p>
            ) : (
              [...data.galeriaMultimedia, ...data.fotosUrls.map((url, index) => ({ id: -index - 1, url, nombreArchivo: 'Foto del evento', tipoArchivo: 'Imagen', fechaSubida: data.fechaEvento }))].map((media) => (
                <a key={media.id} href={media.url} target="_blank" rel="noreferrer" className="group overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                  <div className="aspect-[4/3]">
                    <MediaViewerR2 url={media.url} alt={media.nombreArchivo} className="h-full w-full transition duration-500 group-hover:scale-105" />
                  </div>
                  <div className="p-3">
                    <p className="truncate text-sm font-bold text-slate-800">{media.nombreArchivo}</p>
                  </div>
                </a>
              ))
            )}
          </div>
        </section>
      )}

      {(['finalizado', 'terminado'].includes(estadoKey)) && !data.yaCalificado && (
        <section className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
          <h2 className="font-display text-2xl font-black text-amber-950">Califica tu experiencia</h2>
          <div className="mt-4 flex gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button key={star} onClick={() => setRating(star)} className="text-amber-400">
                <Star size={30} className={star <= rating ? 'fill-amber-400' : ''} />
              </button>
            ))}
          </div>
          <textarea
            value={comentario}
            onChange={(event) => setComentario(event.target.value)}
            placeholder="Comentario opcional"
            className="mt-4 w-full rounded-xl border border-amber-200 bg-white p-3 text-sm outline-none focus:border-amber-400"
            rows={3}
          />
          <button
            onClick={handleRating}
            disabled={rating === 0 || enviandoRating}
            className="mt-3 inline-flex items-center gap-2 rounded-full bg-amber-500 px-4 py-2.5 text-sm font-black text-white hover:bg-amber-600 disabled:opacity-60"
          >
            {enviandoRating ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
            Enviar calificación
          </button>
        </section>
      )}

      {showPagoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-2xl font-black text-slate-950">Reportar pago</h3>
              <button onClick={() => setShowPagoModal(false)} className="rounded-xl p-2 text-slate-500 hover:bg-slate-100">
                <X size={20} />
              </button>
            </div>
            {qrPago && (
              <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="mb-3 text-sm font-bold text-slate-700">QR de pago configurado</p>
                <img src={qrPago} alt="QR de pago" className="mx-auto max-h-56 rounded-xl bg-white object-contain p-3" />
              </div>
            )}
            <div className="mt-5 space-y-4">
              <label className="block">
                <span className="text-sm font-bold text-slate-700">Monto abonado</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={pagoMonto}
                  onChange={(event) => setPagoMonto(event.target.value)}
                  className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-primary"
                />
              </label>
              <div>
                <span className="text-sm font-bold text-slate-700">Comprobante</span>
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="mt-2 flex w-full flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-slate-500 hover:border-primary/40 hover:bg-purple-50"
                >
                  {comprobanteB64 ? (
                    <img src={comprobanteB64} alt="Comprobante" className="max-h-40 rounded-xl object-contain" />
                  ) : (
                    <>
                      <Upload size={26} />
                      <span className="text-sm font-bold">Subir imagen del comprobante</span>
                    </>
                  )}
                </button>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
              </div>
              <button
                onClick={handlePago}
                disabled={enviandoPago}
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary-gradient px-4 py-3 text-sm font-black text-white shadow-lg shadow-pink-200/50 disabled:opacity-60"
              >
                {enviandoPago ? <Loader2 size={17} className="animate-spin" /> : <CreditCard size={17} />}
                Enviar pago para verificación
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const InfoTile = ({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) => (
  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
    <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-white text-primary shadow-sm">
      <Icon className="h-5 w-5" />
    </div>
    <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</p>
    <p className="mt-1 text-sm font-black text-slate-900">{value}</p>
  </div>
);

const MoneyRow = ({ label, value, tone = 'slate', strong = false }: { label: string; value: number; tone?: 'slate' | 'emerald' | 'rose'; strong?: boolean }) => {
  const color = tone === 'emerald' ? 'text-emerald-700' : tone === 'rose' ? 'text-rose-700' : 'text-slate-900';
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-sm font-semibold text-slate-500">{label}</span>
      <span className={`${strong ? 'text-xl' : 'text-sm'} font-black ${color}`}>{currency.format(value)}</span>
    </div>
  );
};

const SummaryMiniCard = ({ label, value, helper }: { label: string; value: string; helper: string }) => (
  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
    <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">{label}</p>
    <p className="mt-1 font-display text-2xl font-black text-slate-950">{value}</p>
    <p className="mt-1 text-xs font-bold text-slate-500">{helper}</p>
  </div>
);

const TimelineStep = ({ done, label }: { done: boolean; label: string }) => (
  <div className={`rounded-2xl border p-4 ${done ? 'border-emerald-200 bg-emerald-50' : 'border-slate-200 bg-white'}`}>
    <div className={`mb-3 flex h-9 w-9 items-center justify-center rounded-full ${done ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
      <CheckCircle2 size={18} />
    </div>
    <p className={`text-sm font-black ${done ? 'text-emerald-900' : 'text-slate-500'}`}>{label}</p>
  </div>
);

const DetailGrid = ({ items }: { items: Array<[string, string | undefined | null]> }) => (
  <div className="grid gap-3 md:grid-cols-3">
    {items.map(([label, value]) => (
      <div key={label} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</p>
        <p className="mt-1 text-sm font-semibold text-slate-800">{value || 'Sin registrar'}</p>
      </div>
    ))}
  </div>
);

const ActionCard = ({ icon: Icon, title, text, children }: { icon: LucideIcon; title: string; text: string; children?: ReactNode }) => (
  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
    <div className="flex items-start gap-3">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-primary">
        <Icon size={21} />
      </div>
      <div>
        <h3 className="font-display text-xl font-black text-slate-950">{title}</h3>
        <p className="mt-1 text-sm font-medium text-slate-500">{text}</p>
      </div>
    </div>
    {children && <div className="mt-4">{children}</div>}
  </div>
);

export default EventoClienteDetailPage;

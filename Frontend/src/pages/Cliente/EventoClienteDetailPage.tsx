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
  Star,
  Upload,
  X,
  type LucideIcon
} from 'lucide-react';
import type { ReactNode } from 'react';
import { toast } from 'sonner';
import { clientePortalService, type EventoClienteDetail } from '../../services/clientePortalService';
import { configService } from '../../services/configService';
import { getEstadoEventoBadgeClasses, getEstadoEventoLabel, normalizeEstadoEvento } from '../../utils/estadoEvento';
import MediaViewerR2 from '../../components/common/MediaViewerR2';

const currency = new Intl.NumberFormat('es-BO', { style: 'currency', currency: 'BOB' });
const dateFormat = new Intl.DateTimeFormat('es-BO', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });

type TabId = 'resumen' | 'servicios' | 'pagos' | 'fotos';

const EventoClienteDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const [data, setData] = useState<EventoClienteDetail | null>(null);
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
      setData(detail);
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
  const totalAbonado = useMemo(() => {
    if (!data) return 0;
    return Math.max(data.precioTotal - data.saldoPendiente, 0);
  }, [data]);

  const invitationUrl = data?.invitacionToken ? `${window.location.origin}/invitacion/${data.invitacionToken}` : '';
  const mapsUrl = data?.direccion ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(data.direccion)}` : '';
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
      <div className="flex min-h-[55vh] flex-col items-center justify-center gap-3 text-slate-500">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        <p className="text-sm font-semibold">Cargando evento...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <button
          onClick={() => navigate('/cliente/dashboard')}
          className="inline-flex w-fit items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"
        >
          <ArrowLeft size={17} />
          Volver
        </button>
        <span className={`w-fit rounded-full border px-3 py-1.5 text-xs font-bold ${getEstadoEventoBadgeClasses(estadoKey)}`}>
          {getEstadoEventoLabel(estadoKey)}
        </span>
      </div>

      <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="space-y-5">
            <div>
              <p className="text-sm font-bold text-indigo-700">Evento #{data.id}</p>
              <h1 className="mt-1 text-3xl font-black text-slate-950">
                {data.nombreCumpleaneros ? `Cumpleaños de ${data.nombreCumpleaneros}` : 'Evento reservado'}
              </h1>
              <p className="mt-2 text-sm text-slate-500">{data.paquete}</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <InfoTile icon={CalendarDays} label="Fecha" value={dateFormat.format(new Date(data.fechaEvento))} />
              <InfoTile icon={Clock} label="Horario" value={`${data.horaInicio.slice(0, 5)} - ${data.horaFin.slice(0, 5)}`} />
              <InfoTile icon={MapPin} label="Salón" value={data.nombreNegocio || 'Por confirmar'} />
            </div>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-5">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Estado de cuenta</p>
            <div className="mt-4 space-y-3">
              <MoneyRow label="Total" value={data.precioTotal} />
              <MoneyRow label="Abonado" value={totalAbonado} tone="emerald" />
              <MoneyRow label="Pendiente" value={data.saldoPendiente} tone={data.saldoPendiente > 0 ? 'rose' : 'emerald'} strong />
            </div>
            {data.saldoPendiente > 0 && (
              <button
                onClick={() => setShowPagoModal(true)}
                className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-bold text-white hover:bg-indigo-700"
              >
                <CreditCard size={17} />
                Reportar pago
              </button>
            )}
          </div>
        </div>
      </section>

      <div className="flex gap-2 overflow-x-auto rounded-lg border border-slate-200 bg-white p-2 shadow-sm">
        {[
          { id: 'resumen', label: 'Resumen', icon: Gift },
          { id: 'servicios', label: 'Servicios', icon: ReceiptText },
          { id: 'pagos', label: 'Pagos', icon: CreditCard },
          { id: 'fotos', label: 'Fotos', icon: Camera }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as TabId)}
            className={`inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-bold transition-colors ${
              activeTab === tab.id ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <tab.icon size={17} />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'resumen' && (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
          <section className="space-y-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-black text-slate-900">Detalles de preparación</h2>
            <DetailGrid
              items={[
                ['Temática', data.tematica],
                ['Decoración', data.notasDecoracion],
                ['Alergias', data.alergiasCumpleaneros?.join(', ')]
              ]}
            />
            <div className="rounded-md bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Ubicación</p>
              <p className="mt-1 text-sm font-semibold text-slate-800">{data.direccion || 'Dirección pendiente de confirmación'}</p>
              {mapsUrl && (
                <a href={mapsUrl} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-2 text-sm font-bold text-indigo-700 hover:underline">
                  Abrir en Google Maps
                  <ExternalLink size={15} />
                </a>
              )}
            </div>
          </section>

          <aside className="space-y-4">
            <ActionCard title="Invitación digital" text={invitationUrl ? 'Comparte este enlace con tus invitados.' : 'La invitación aún no está disponible.'}>
              {invitationUrl ? (
                <div className="space-y-3">
                  <button
                    onClick={() => navigator.clipboard.writeText(invitationUrl).then(() => toast.success('Enlace copiado.'))}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"
                  >
                    <Copy size={16} />
                    Copiar enlace
                  </button>
                  <a href={invitationUrl} target="_blank" rel="noreferrer" className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-slate-900 px-4 py-2 text-sm font-bold text-white hover:bg-slate-800">
                    Abrir invitación
                    <ExternalLink size={16} />
                  </a>
                </div>
              ) : null}
            </ActionCard>
            <ActionCard title="Atención" text="Contacta al equipo si necesitas cambiar detalles de tu reserva.">
              {whatsappUrl ? (
                <a href={whatsappUrl} target="_blank" rel="noreferrer" className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700">
                  Contactar por WhatsApp
                  <ChevronRight size={16} />
                </a>
              ) : (
                <Link to="/#contacto" className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-slate-900 px-4 py-2 text-sm font-bold text-white hover:bg-slate-800">
                  Ir a contacto
                </Link>
              )}
            </ActionCard>
          </aside>
        </div>
      )}

      {activeTab === 'servicios' && (
        <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-black text-slate-900">Servicios contratados</h2>
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {data.items.length === 0 ? (
              <p className="rounded-md bg-slate-50 p-4 text-sm text-slate-500 md:col-span-2">No hay servicios registrados para este evento.</p>
            ) : (
              data.items.map((item, index) => (
                <div key={`${item.nombre}-${index}`} className="rounded-md border border-slate-200 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-black text-slate-900">{item.nombre}</p>
                      <p className="mt-1 text-sm text-slate-500">Cantidad: {item.cantidad}</p>
                    </div>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${item.esExtra ? 'bg-amber-50 text-amber-700' : 'bg-indigo-50 text-indigo-700'}`}>
                      {item.esExtra ? 'Extra' : 'Incluido'}
                    </span>
                  </div>
                  <p className="mt-4 text-sm font-black text-slate-800">{item.precio > 0 ? currency.format(item.precio) : 'Incluido'}</p>
                </div>
              ))
            )}
          </div>
        </section>
      )}

      {activeTab === 'pagos' && (
        <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-xl font-black text-slate-900">Historial de pagos</h2>
            {data.saldoPendiente > 0 && (
              <button onClick={() => setShowPagoModal(true)} className="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-bold text-white hover:bg-indigo-700">
                <CreditCard size={17} />
                Reportar pago
              </button>
            )}
          </div>
          <div className="mt-5 space-y-3">
            {data.pagos.length === 0 ? (
              <p className="rounded-md bg-slate-50 p-4 text-sm text-slate-500">Aún no hay pagos registrados.</p>
            ) : (
              data.pagos.map((pago) => (
                <div key={pago.id} className="flex flex-col gap-3 rounded-md border border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-black text-slate-900">{currency.format(pago.monto)}</p>
                    <p className="text-sm text-slate-500">{new Date(pago.fechaPago).toLocaleDateString('es-BO')}</p>
                    {pago.referencia && <p className="mt-1 text-xs text-slate-500">{pago.referencia}</p>}
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
        <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-black text-slate-900">Fotos y recuerdos</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[...data.galeriaMultimedia, ...data.fotosUrls.map((url, index) => ({ id: -index - 1, url, nombreArchivo: 'Foto del evento', tipoArchivo: 'Imagen', fechaSubida: data.fechaEvento }))].length === 0 ? (
              <p className="rounded-md bg-slate-50 p-4 text-sm text-slate-500 sm:col-span-2 lg:col-span-3">Aún no hay fotos visibles para cliente.</p>
            ) : (
              [...data.galeriaMultimedia, ...data.fotosUrls.map((url, index) => ({ id: -index - 1, url, nombreArchivo: 'Foto del evento', tipoArchivo: 'Imagen', fechaSubida: data.fechaEvento }))].map((media) => (
                <a key={media.id} href={media.url} target="_blank" rel="noreferrer" className="overflow-hidden rounded-md border border-slate-200 bg-slate-50">
                  <div className="aspect-[4/3]">
                    <MediaViewerR2 url={media.url} alt={media.nombreArchivo} className="h-full w-full" />
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
        <section className="rounded-lg border border-amber-200 bg-amber-50 p-6">
          <h2 className="text-xl font-black text-amber-950">Califica tu experiencia</h2>
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
            className="mt-4 w-full rounded-md border border-amber-200 bg-white p-3 text-sm outline-none focus:border-amber-400"
            rows={3}
          />
          <button
            onClick={handleRating}
            disabled={rating === 0 || enviandoRating}
            className="mt-3 inline-flex items-center gap-2 rounded-md bg-amber-500 px-4 py-2 text-sm font-bold text-white hover:bg-amber-600 disabled:opacity-60"
          >
            {enviandoRating ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
            Enviar calificación
          </button>
        </section>
      )}

      {showPagoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
          <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-black text-slate-900">Reportar pago</h3>
              <button onClick={() => setShowPagoModal(false)} className="rounded-md p-2 text-slate-500 hover:bg-slate-100">
                <X size={20} />
              </button>
            </div>
            {qrPago && (
              <div className="mt-5 rounded-md border border-slate-200 bg-slate-50 p-4">
                <p className="mb-3 text-sm font-bold text-slate-700">QR de pago configurado</p>
                <img src={qrPago} alt="QR de pago" className="mx-auto max-h-56 rounded-md bg-white object-contain p-3" />
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
                  className="mt-2 w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-500"
                />
              </label>
              <div>
                <span className="text-sm font-bold text-slate-700">Comprobante</span>
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="mt-2 flex w-full flex-col items-center justify-center gap-3 rounded-md border border-dashed border-slate-300 bg-slate-50 p-6 text-slate-500 hover:border-indigo-300 hover:bg-indigo-50"
                >
                  {comprobanteB64 ? (
                    <img src={comprobanteB64} alt="Comprobante" className="max-h-40 rounded-md object-contain" />
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
                className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-indigo-600 px-4 py-3 text-sm font-bold text-white hover:bg-indigo-700 disabled:opacity-60"
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
  <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
    <Icon className="mb-3 h-5 w-5 text-indigo-600" />
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

const DetailGrid = ({ items }: { items: Array<[string, string | undefined | null]> }) => (
  <div className="grid gap-3 md:grid-cols-3">
    {items.map(([label, value]) => (
      <div key={label} className="rounded-md border border-slate-200 p-4">
        <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</p>
        <p className="mt-1 text-sm font-semibold text-slate-800">{value || 'Sin registrar'}</p>
      </div>
    ))}
  </div>
);

const ActionCard = ({ title, text, children }: { title: string; text: string; children?: ReactNode }) => (
  <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
    <h3 className="font-black text-slate-900">{title}</h3>
    <p className="mt-1 text-sm text-slate-500">{text}</p>
    {children && <div className="mt-4">{children}</div>}
  </div>
);

export default EventoClienteDetailPage;

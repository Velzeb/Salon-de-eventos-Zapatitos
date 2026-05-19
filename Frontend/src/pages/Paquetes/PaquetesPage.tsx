import { useEffect, useMemo, useState } from 'react';
import {
  Clock,
  Info,
  Layers,
  LayoutGrid,
  List,
  Package,
  Plus,
  RefreshCw,
  Search,
  ShoppingBag,
  Tag,
  Users,
  X
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { toast } from 'sonner';
import { paquetesService, type Paquete } from '../../services/paquetesService';
import PaqueteModal from './components/PaqueteModal';
import MediaViewerR2 from '../../components/common/MediaViewerR2';

const inputClass =
  'w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10';

const money = (value: number) => `$${(value || 0).toLocaleString()}`;
type ViewMode = 'grid' | 'list';

const PaquetesPage = () => {
  const [paquetes, setPaquetes] = useState<Paquete[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPaquete, setSelectedPaquete] = useState<Paquete | null>(null);

  const loadPaquetes = async () => {
    setLoading(true);
    try {
      const data = await paquetesService.getPaquetes();
      setPaquetes(data);
    } catch {
      toast.error('Error al cargar los planes y paquetes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void Promise.resolve().then(loadPaquetes);
  }, []);

  const filteredPaquetes = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return paquetes;

    return paquetes.filter(paquete => {
      const servicios = paquete.servicios.map(servicio => servicio.nombre).join(' ');
      const articulos = paquete.articulos.map(articulo => articulo.nombreArticulo).join(' ');
      return [paquete.nombre, paquete.descripcion, servicios, articulos]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(query);
    });
  }, [paquetes, searchTerm]);

  const stats = useMemo(() => {
    const averagePrice = paquetes.length
      ? paquetes.reduce((sum, paquete) => sum + paquete.precioBase - paquete.descuento, 0) / paquetes.length
      : 0;

    return {
      total: paquetes.length,
      withDiscount: paquetes.filter(paquete => paquete.descuento > 0).length,
      averagePrice,
      serviceCount: paquetes.reduce((sum, paquete) => sum + paquete.servicios.length, 0)
    };
  }, [paquetes]);

  return (
    <div className="space-y-8 pb-16">
      <CatalogHeader
        icon={ShoppingBag}
        title="Paquetes"
        subtitle="Planes comerciales listos para vender dentro de una reserva."
        actionLabel="Nuevo plan"
        onAction={() => setIsModalOpen(true)}
      />

      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard label="Planes activos" value={stats.total.toString()} icon={Package} />
        <MetricCard label="Con descuento" value={stats.withDiscount.toString()} icon={Tag} />
        <MetricCard label="Precio promedio" value={money(Math.round(stats.averagePrice))} icon={ShoppingBag} />
        <MetricCard label="Servicios usados" value={stats.serviceCount.toString()} icon={Layers} />
      </div>

      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div className="relative lg:w-[460px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            className={`${inputClass} pl-11`}
            placeholder="Buscar paquete, servicio o articulo incluido"
            value={searchTerm}
            onChange={event => setSearchTerm(event.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <ViewToggle viewMode={viewMode} onChange={setViewMode} />
          <button
            type="button"
            onClick={loadPaquetes}
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50"
            title="Actualizar"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {loading ? (
        <LoadingState label="Cargando paquetes..." />
      ) : filteredPaquetes.length > 0 ? (
        <div className={viewMode === 'grid' ? 'grid gap-4 md:grid-cols-2 xl:grid-cols-3' : 'space-y-3'}>
          {filteredPaquetes.map(paquete => (
            viewMode === 'grid' ? (
              <PackageCard key={paquete.id} paquete={paquete} onOpen={() => setSelectedPaquete(paquete)} />
            ) : (
              <PackageListItem key={paquete.id} paquete={paquete} onOpen={() => setSelectedPaquete(paquete)} />
            )
          ))}
        </div>
      ) : (
        <EmptyState
          title="No hay paquetes"
          subtitle="No encontramos planes con la busqueda actual."
          actionLabel="Limpiar busqueda"
          onAction={() => setSearchTerm('')}
        />
      )}

      <PaqueteModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSuccess={loadPaquetes} />

      {selectedPaquete && <PackageDrawer paquete={selectedPaquete} onClose={() => setSelectedPaquete(null)} />}
    </div>
  );
};

const CatalogHeader = ({
  icon: Icon,
  title,
  subtitle,
  actionLabel,
  onAction
}: {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  actionLabel: string;
  onAction: () => void;
}) => (
  <div className="flex flex-col gap-5 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm lg:flex-row lg:items-center lg:justify-between">
    <div className="flex items-center gap-5">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
        <Icon size={26} />
      </div>
      <div>
        <h1 className="text-2xl font-black text-slate-900">{title}</h1>
        <p className="mt-1 text-sm font-semibold text-slate-500">{subtitle}</p>
      </div>
    </div>
    <button
      type="button"
      onClick={onAction}
      className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-xs font-black text-white shadow-lg shadow-blue-600/20 transition hover:bg-slate-900"
    >
      <Plus size={17} />
      {actionLabel}
    </button>
  </div>
);

const MetricCard = ({ label, value, icon: Icon }: { label: string; value: string; icon: LucideIcon }) => (
  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-xs font-black uppercase tracking-wide text-slate-400">{label}</p>
        <p className="mt-2 text-2xl font-black text-slate-900">{value}</p>
      </div>
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-50 text-blue-600">
        <Icon size={22} />
      </div>
    </div>
  </div>
);

const ViewToggle = ({ viewMode, onChange }: { viewMode: ViewMode; onChange: (value: ViewMode) => void }) => (
  <div className="flex gap-1 rounded-xl bg-slate-100 p-1">
    <button type="button" onClick={() => onChange('grid')} className={`flex h-9 w-9 items-center justify-center rounded-lg transition ${viewMode === 'grid' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}>
      <LayoutGrid size={16} />
    </button>
    <button type="button" onClick={() => onChange('list')} className={`flex h-9 w-9 items-center justify-center rounded-lg transition ${viewMode === 'list' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}>
      <List size={16} />
    </button>
  </div>
);

const PackageCard = ({ paquete, onOpen }: { paquete: Paquete; onOpen: () => void }) => {
  const finalPrice = paquete.precioBase - paquete.descuento;
  const totalItems = paquete.servicios.length + paquete.articulos.length;

  return (
    <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-lg">
      <div className="relative aspect-[16/10] max-h-56 bg-slate-100">
        <MediaViewerR2 url={paquete.imagenUrl || ''} alt={paquete.nombre} className="h-full w-full" />
        <span className="absolute left-3 top-3 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-black text-blue-700">
          <Package size={13} />
          Plan
        </span>
        {paquete.descuento > 0 && (
          <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-black text-emerald-700 shadow-sm">
            <Tag size={13} />
            -{money(paquete.descuento)}
          </span>
        )}
      </div>

      <div className="space-y-4 p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 className="truncate text-base font-black text-slate-900">{paquete.nombre}</h2>
            <p className="mt-1 min-h-10 overflow-hidden text-sm font-semibold leading-5 text-slate-500">
              {paquete.descripcion || 'Sin descripcion comercial.'}
            </p>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">Venta</p>
            <p className="text-lg font-black text-slate-900">{money(finalPrice)}</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <MiniStat label="Duracion" value={`${paquete.duracionHoras || 0}h`} icon={Clock} />
          <MiniStat label="Ninos" value={`${paquete.capacidadNinos || 0}`} icon={Users} />
          <MiniStat label="Items" value={`${totalItems}`} icon={Layers} />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-black uppercase tracking-wide text-slate-400">Incluye</p>
            <span className="rounded-full bg-slate-50 px-2.5 py-1 text-[11px] font-black text-slate-500">
              {paquete.servicios.length} servicios
            </span>
          </div>
          <div className="flex min-h-16 flex-wrap content-start gap-2">
            {paquete.servicios.slice(0, 4).map(servicio => (
              <span key={`${paquete.id}-${servicio.id}`} className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-bold text-slate-600">
                {servicio.cantidad}x {servicio.nombre}
              </span>
            ))}
            {paquete.servicios.length === 0 && <span className="text-sm font-semibold text-slate-400">Sin servicios vinculados</span>}
            {paquete.servicios.length > 4 && (
              <span className="rounded-lg bg-slate-900 px-2.5 py-1.5 text-xs font-black text-white">+{paquete.servicios.length - 4}</span>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={onOpen}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-xs font-black text-white transition hover:bg-blue-600"
        >
          <Info size={16} />
          Ver detalle
        </button>
      </div>
    </article>
  );
};

const PackageListItem = ({ paquete, onOpen }: { paquete: Paquete; onOpen: () => void }) => {
  const finalPrice = paquete.precioBase - paquete.descuento;
  const totalItems = paquete.servicios.length + paquete.articulos.length;

  return (
    <article className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-blue-200 hover:shadow-md md:grid-cols-[120px_1fr_auto] md:items-center">
      <div className="relative h-28 overflow-hidden rounded-xl bg-slate-100 md:h-24">
        <MediaViewerR2 url={paquete.imagenUrl || ''} alt={paquete.nombre} className="h-full w-full" />
      </div>
      <div className="min-w-0">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-black text-blue-700">
            <Package size={13} />
            Plan
          </span>
          {paquete.descuento > 0 && <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">-{money(paquete.descuento)}</span>}
        </div>
        <h2 className="truncate text-base font-black text-slate-900">{paquete.nombre}</h2>
        <p className="mt-1 truncate text-sm font-semibold text-slate-500">{paquete.descripcion || 'Sin descripcion comercial.'}</p>
        <p className="mt-2 text-xs font-black uppercase tracking-wide text-slate-400">
          {paquete.servicios.length} servicios | {totalItems} items | {paquete.duracionHoras || 0}h
        </p>
      </div>
      <div className="flex items-center justify-between gap-4 md:justify-end">
        <div className="text-right">
          <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">Venta</p>
          <p className="text-lg font-black text-slate-900">{money(finalPrice)}</p>
        </div>
        <button type="button" onClick={onOpen} className="rounded-xl bg-slate-900 px-4 py-3 text-xs font-black text-white transition hover:bg-blue-600">
          Ver detalle
        </button>
      </div>
    </article>
  );
};

const MiniStat = ({ label, value, icon: Icon }: { label: string; value: string; icon: LucideIcon }) => (
  <div className="rounded-xl bg-slate-50 px-3 py-2 text-center">
    <Icon className="mx-auto text-blue-500" size={16} />
    <p className="mt-1 text-[10px] font-black uppercase tracking-wide text-slate-400">{label}</p>
    <p className="text-sm font-black text-slate-900">{value}</p>
  </div>
);

const PackageDrawer = ({ paquete, onClose }: { paquete: Paquete; onClose: () => void }) => {
  const finalPrice = paquete.precioBase - paquete.descuento;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button type="button" className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} aria-label="Cerrar detalle" />
      <aside className="relative flex h-full w-full max-w-xl flex-col bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-slate-200 p-6">
          <div>
            <p className="text-xs font-black uppercase tracking-wide text-blue-600">Detalle del paquete</p>
            <h2 className="mt-1 text-2xl font-black text-slate-900">{paquete.nombre}</h2>
            <p className="mt-1 text-sm font-semibold text-slate-500">{paquete.descripcion || 'Sin descripcion comercial.'}</p>
          </div>
          <button type="button" onClick={onClose} className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 text-slate-500 transition hover:bg-slate-100">
            <X size={20} />
          </button>
        </div>

        <div className="h-56 max-h-56 shrink-0 overflow-hidden bg-slate-100">
          <MediaViewerR2 url={paquete.imagenUrl || ''} alt={paquete.nombre} className="h-full w-full" />
        </div>

        <div className="flex-1 space-y-8 overflow-y-auto p-6">
          <div className="grid grid-cols-2 gap-3">
            <PriceBlock label="Precio base" value={money(paquete.precioBase)} />
            <PriceBlock label="Descuento" value={money(paquete.descuento)} positive />
            <PriceBlock label="Precio final" value={money(finalPrice)} strong />
            <PriceBlock label="Capacidad" value={`${paquete.capacidadNinos || 0} ninos`} />
          </div>

          <DetailSection icon={List} title="Servicios incluidos" subtitle="Lo que se agenda como parte del plan.">
            {paquete.servicios.length > 0 ? (
              paquete.servicios.map(servicio => (
                <div key={`${paquete.id}-drawer-${servicio.id}`} className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-sm font-black text-blue-700">
                      {servicio.cantidad}x
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-black text-slate-800">{servicio.nombre}</p>
                      <p className="text-xs font-semibold text-slate-400">{servicio.esExtra ? 'Extra vendible' : 'Incluido base'}</p>
                    </div>
                  </div>
                  <p className="text-sm font-black text-slate-900">{money(servicio.costoBase * servicio.cantidad)}</p>
                </div>
              ))
            ) : (
              <MutedBox label="No hay servicios vinculados." />
            )}
          </DetailSection>

          <DetailSection icon={Layers} title="Articulos incluidos" subtitle="Insumos o inventario que consume este paquete.">
            {paquete.articulos.length > 0 ? (
              paquete.articulos.map(articulo => (
                <div key={`${paquete.id}-articulo-${articulo.articuloId}`} className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4">
                  <p className="text-sm font-black text-slate-800">{articulo.nombreArticulo}</p>
                  <span className="rounded-lg bg-slate-50 px-3 py-1.5 text-xs font-black text-slate-600">
                    {articulo.cantidad} {articulo.unidadMedida || 'u'}
                  </span>
                </div>
              ))
            ) : (
              <MutedBox label="No hay articulos vinculados." />
            )}
          </DetailSection>
        </div>

        <div className="border-t border-slate-200 bg-slate-50 p-5">
          <button type="button" onClick={onClose} className="w-full rounded-xl border border-slate-200 bg-white px-5 py-3 text-xs font-black text-slate-600 transition hover:bg-slate-100">
            Cerrar detalle
          </button>
        </div>
      </aside>
    </div>
  );
};

const PriceBlock = ({ label, value, positive = false, strong = false }: { label: string; value: string; positive?: boolean; strong?: boolean }) => (
  <div className={`rounded-xl border p-4 ${strong ? 'border-blue-100 bg-blue-50' : positive ? 'border-emerald-100 bg-emerald-50' : 'border-slate-200 bg-slate-50'}`}>
    <p className={`text-xs font-black uppercase tracking-wide ${strong ? 'text-blue-600' : positive ? 'text-emerald-600' : 'text-slate-400'}`}>{label}</p>
    <p className={`mt-1 text-xl font-black ${strong ? 'text-blue-700' : positive ? 'text-emerald-700' : 'text-slate-900'}`}>{value}</p>
  </div>
);

const DetailSection = ({ icon: Icon, title, subtitle, children }: { icon: LucideIcon; title: string; subtitle: string; children: ReactNode }) => (
  <section className="space-y-4">
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
        <Icon size={20} />
      </div>
      <div>
        <h3 className="text-base font-black text-slate-900">{title}</h3>
        <p className="text-sm font-semibold text-slate-500">{subtitle}</p>
      </div>
    </div>
    <div className="space-y-2">{children}</div>
  </section>
);

const MutedBox = ({ label }: { label: string }) => (
  <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 py-8 text-center text-sm font-semibold text-slate-400">
    {label}
  </div>
);

const LoadingState = ({ label }: { label: string }) => (
  <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-slate-200 bg-white py-24">
    <RefreshCw className="animate-spin text-blue-500" size={32} />
    <p className="text-sm font-semibold text-slate-400">{label}</p>
  </div>
);

const EmptyState = ({ title, subtitle, actionLabel, onAction }: { title: string; subtitle: string; actionLabel: string; onAction: () => void }) => (
  <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-16 text-center">
    <Package className="mx-auto text-slate-200" size={40} />
    <h3 className="mt-4 text-lg font-black text-slate-900">{title}</h3>
    <p className="mt-1 text-sm font-semibold text-slate-400">{subtitle}</p>
    <button type="button" onClick={onAction} className="mt-6 rounded-xl bg-slate-900 px-5 py-3 text-xs font-black text-white transition hover:bg-blue-600">
      {actionLabel}
    </button>
  </div>
);

export default PaquetesPage;

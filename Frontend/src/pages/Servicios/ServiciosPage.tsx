import { useEffect, useMemo, useState } from 'react';
import {
  Boxes,
  Edit,
  LayoutGrid,
  List,
  Package,
  Plus,
  RefreshCw,
  Search,
  Timer,
  Trash2,
  Truck,
  Users,
  Wrench,
  Zap
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { toast } from 'sonner';
import type { ReactNode } from 'react';
import { paquetesService, type Servicio } from '../../services/paquetesService';
import ServicioModal from './components/ServicioModal';
import MediaViewerR2 from '../../components/common/MediaViewerR2';

type ServiceFilter = 'all' | 'inventory' | 'production' | 'third';
type ViewMode = 'grid' | 'list';

const inputClass =
  'w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10';

const serviceTypes: Record<number, { key: ServiceFilter; label: string; icon: LucideIcon; classes: string; sourceLabel: string }> = {
  0: { key: 'inventory', label: 'Inventario', icon: Package, classes: 'bg-blue-50 text-blue-700 border-blue-100', sourceLabel: 'Artículo' },
  1: { key: 'production', label: 'Producción', icon: Wrench, classes: 'bg-amber-50 text-amber-700 border-amber-100', sourceLabel: 'Receta' },
  2: { key: 'third', label: 'Tercero', icon: Users, classes: 'bg-emerald-50 text-emerald-700 border-emerald-100', sourceLabel: 'Aliado' }
};

const getTypeInfo = (tipo: number) => serviceTypes[tipo] || serviceTypes[2];

const ServiciosPage = () => {
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<ServiceFilter>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedServicio, setSelectedServicio] = useState<Servicio | null>(null);

  const loadServicios = async () => {
    setLoading(true);
    try {
      const data = await paquetesService.getServicios();
      setServicios(data);
    } catch {
      toast.error('Error al cargar el catálogo de servicios');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void Promise.resolve().then(loadServicios);
  }, []);

  const filteredServicios = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return servicios.filter(servicio => {
      const typeInfo = getTypeInfo(servicio.tipo);
      const source = servicio.articuloNombre || servicio.productoNombre || servicio.proveedorNombre || '';
      const matchesSearch =
        !query ||
        servicio.nombre.toLowerCase().includes(query) ||
        servicio.descripcion?.toLowerCase().includes(query) ||
        source.toLowerCase().includes(query);
      const matchesType = filterType === 'all' || typeInfo.key === filterType;
      return matchesSearch && matchesType;
    });
  }, [servicios, searchTerm, filterType]);

  const stats = useMemo(() => ({
    total: servicios.length,
    inventory: servicios.filter(servicio => servicio.tipo === 0).length,
    production: servicios.filter(servicio => servicio.tipo === 1).length,
    third: servicios.filter(servicio => servicio.tipo === 2).length
  }), [servicios]);

  const handleEdit = (servicio: Servicio) => {
    setSelectedServicio(servicio);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('¿Eliminar este servicio del catálogo?')) return;
    try {
      await paquetesService.deleteServicio(id);
      toast.success('Servicio eliminado');
      await loadServicios();
    } catch (error: unknown) {
      const message =
        error &&
        typeof error === 'object' &&
        'response' in error &&
        typeof error.response === 'object' &&
        error.response &&
        'data' in error.response &&
        typeof error.response.data === 'object' &&
        error.response.data &&
        'errors' in error.response.data &&
        Array.isArray(error.response.data.errors)
          ? error.response.data.errors[0]
          : 'Error al eliminar el servicio';
      toast.error(message);
    }
  };

  return (
    <div className="space-y-8 pb-16">
      <CatalogHeader
        icon={LayoutGrid}
        title="Servicios"
        subtitle="Catálogo vendible: inventario, producción interna y aliados externos."
        actionLabel="Nuevo servicio"
        onAction={() => {
          setSelectedServicio(null);
          setIsModalOpen(true);
        }}
      />

      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard label="Total servicios" value={stats.total.toString()} icon={Zap} />
        <MetricCard label="Inventario" value={stats.inventory.toString()} icon={Boxes} />
        <MetricCard label="Producción" value={stats.production.toString()} icon={Wrench} />
        <MetricCard label="Terceros" value={stats.third.toString()} icon={Truck} />
      </div>

      <CatalogToolbar
        search={searchTerm}
        onSearch={setSearchTerm}
        placeholder="Buscar servicio, origen o proveedor"
        onRefresh={loadServicios}
        loading={loading}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      >
        {[
          { id: 'all', label: 'Todos' },
          { id: 'inventory', label: 'Inventario' },
          { id: 'production', label: 'Producción' },
          { id: 'third', label: 'Terceros' }
        ].map(filter => (
          <button
            key={filter.id}
            type="button"
            onClick={() => setFilterType(filter.id as ServiceFilter)}
            className={`rounded-lg px-4 py-2 text-xs font-black transition ${
              filterType === filter.id ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            {filter.label}
          </button>
        ))}
      </CatalogToolbar>

      {loading ? (
        <LoadingState label="Cargando servicios..." />
      ) : filteredServicios.length > 0 ? (
        <div className={viewMode === 'grid' ? 'grid gap-4 md:grid-cols-2 xl:grid-cols-3' : 'space-y-3'}>
          {filteredServicios.map(servicio => (
            viewMode === 'grid' ? (
              <ServiceCard
                key={servicio.id}
                servicio={servicio}
                onEdit={() => handleEdit(servicio)}
                onDelete={() => handleDelete(servicio.id)}
              />
            ) : (
              <ServiceListItem
                key={servicio.id}
                servicio={servicio}
                onEdit={() => handleEdit(servicio)}
                onDelete={() => handleDelete(servicio.id)}
              />
            )
          ))}
        </div>
      ) : (
        <EmptyState
          title="No hay servicios"
          subtitle="No encontramos servicios con los filtros actuales."
          actionLabel="Limpiar filtros"
          onAction={() => {
            setSearchTerm('');
            setFilterType('all');
          }}
        />
      )}

      <ServicioModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedServicio(null);
        }}
        onSuccess={loadServicios}
        servicio={selectedServicio}
      />
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

const CatalogToolbar = ({
  search,
  onSearch,
  placeholder,
  onRefresh,
  loading,
  viewMode,
  onViewModeChange,
  children
}: {
  search: string;
  onSearch: (value: string) => void;
  placeholder: string;
  onRefresh: () => void;
  loading: boolean;
  viewMode: ViewMode;
  onViewModeChange: (value: ViewMode) => void;
  children: ReactNode;
}) => (
  <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm xl:flex-row xl:items-center xl:justify-between">
    <div className="relative xl:w-[420px]">
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
      <input className={`${inputClass} pl-11`} placeholder={placeholder} value={search} onChange={event => onSearch(event.target.value)} />
    </div>
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex flex-wrap gap-1 rounded-xl bg-slate-100 p-1">{children}</div>
      <div className="flex gap-1 rounded-xl bg-slate-100 p-1">
        <button type="button" onClick={() => onViewModeChange('grid')} className={`flex h-9 w-9 items-center justify-center rounded-lg transition ${viewMode === 'grid' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}>
          <LayoutGrid size={16} />
        </button>
        <button type="button" onClick={() => onViewModeChange('list')} className={`flex h-9 w-9 items-center justify-center rounded-lg transition ${viewMode === 'list' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}>
          <List size={16} />
        </button>
      </div>
      <button
        type="button"
        onClick={onRefresh}
        className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50"
      >
        <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
      </button>
    </div>
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

const ServiceCard = ({ servicio, onEdit, onDelete }: { servicio: Servicio; onEdit: () => void; onDelete: () => void }) => {
  const typeInfo = getTypeInfo(servicio.tipo);
  const TypeIcon = typeInfo.icon;
  const source = servicio.articuloNombre || servicio.productoNombre || servicio.proveedorNombre || 'Sin origen vinculado';
  const margin = servicio.precioProveedor > 0 ? servicio.costoBase - servicio.precioProveedor : null;

  return (
    <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-lg">
      <div className="relative aspect-[16/10] max-h-56 bg-slate-100">
        <MediaViewerR2 url={servicio.imagenUrl || ''} alt={servicio.nombre} className="h-full w-full" />
        <span className={`absolute left-3 top-3 inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-black ${typeInfo.classes}`}>
          <TypeIcon size={13} />
          {typeInfo.label}
        </span>
        {servicio.requiereTemporizador && (
          <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-white px-3 py-1.5 text-xs font-black text-blue-600 shadow-sm">
            <Timer size={13} />
            {servicio.duracionMinutos} min
          </span>
        )}
      </div>
      <div className="space-y-4 p-5">
        <div>
          <h2 className="text-base font-black text-slate-900">{servicio.nombre}</h2>
          <p className="mt-1 min-h-10 overflow-hidden text-sm font-semibold leading-5 text-slate-500">
            {servicio.descripcion || 'Sin descripción comercial.'}
          </p>
        </div>

        <div className="rounded-xl bg-slate-50 p-3">
          <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">{typeInfo.sourceLabel}</p>
          <p className="mt-1 truncate text-sm font-bold text-slate-800">{source}</p>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <MiniStat label="Venta" value={`$${servicio.costoBase.toLocaleString()}`} />
          <MiniStat label="Mínimo" value={`${servicio.cantidadMinima}u`} />
          <MiniStat label="Margen" value={margin !== null ? `$${margin.toLocaleString()}` : '-'} good={margin !== null && margin >= 0} />
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
          <button type="button" onClick={onEdit} className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 text-slate-500 transition hover:bg-blue-50 hover:text-blue-600">
            <Edit size={17} />
          </button>
          <button type="button" onClick={onDelete} className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 text-slate-500 transition hover:bg-rose-50 hover:text-rose-600">
            <Trash2 size={17} />
          </button>
        </div>
      </div>
    </article>
  );
};

const ServiceListItem = ({ servicio, onEdit, onDelete }: { servicio: Servicio; onEdit: () => void; onDelete: () => void }) => {
  const typeInfo = getTypeInfo(servicio.tipo);
  const TypeIcon = typeInfo.icon;
  const source = servicio.articuloNombre || servicio.productoNombre || servicio.proveedorNombre || 'Sin origen vinculado';

  return (
    <article className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-blue-200 hover:shadow-md md:grid-cols-[120px_1fr_auto] md:items-center">
      <div className="relative h-28 overflow-hidden rounded-xl bg-slate-100 md:h-24">
        <MediaViewerR2 url={servicio.imagenUrl || ''} alt={servicio.nombre} className="h-full w-full" />
      </div>
      <div className="min-w-0">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-black ${typeInfo.classes}`}>
            <TypeIcon size={13} />
            {typeInfo.label}
          </span>
          {servicio.requiereTemporizador && <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-blue-700">{servicio.duracionMinutos} min</span>}
        </div>
        <h2 className="truncate text-base font-black text-slate-900">{servicio.nombre}</h2>
        <p className="mt-1 truncate text-sm font-semibold text-slate-500">{servicio.descripcion || source}</p>
        <p className="mt-2 text-xs font-black uppercase tracking-wide text-slate-400">{source}</p>
      </div>
      <div className="flex items-center justify-between gap-4 md:justify-end">
        <div className="text-right">
          <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">Venta</p>
          <p className="text-lg font-black text-slate-900">${servicio.costoBase.toLocaleString()}</p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={onEdit} className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 text-slate-500 transition hover:bg-blue-50 hover:text-blue-600">
            <Edit size={17} />
          </button>
          <button type="button" onClick={onDelete} className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 text-slate-500 transition hover:bg-rose-50 hover:text-rose-600">
            <Trash2 size={17} />
          </button>
        </div>
      </div>
    </article>
  );
};

const MiniStat = ({ label, value, good = false }: { label: string; value: string; good?: boolean }) => (
  <div className="rounded-xl bg-slate-50 px-3 py-2 text-center">
    <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">{label}</p>
    <p className={`mt-1 text-sm font-black ${good ? 'text-emerald-600' : 'text-slate-900'}`}>{value}</p>
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
    <Zap className="mx-auto text-slate-200" size={40} />
    <h3 className="mt-4 text-lg font-black text-slate-900">{title}</h3>
    <p className="mt-1 text-sm font-semibold text-slate-400">{subtitle}</p>
    <button type="button" onClick={onAction} className="mt-6 rounded-xl bg-slate-900 px-5 py-3 text-xs font-black text-white transition hover:bg-blue-600">
      {actionLabel}
    </button>
  </div>
);

export default ServiciosPage;

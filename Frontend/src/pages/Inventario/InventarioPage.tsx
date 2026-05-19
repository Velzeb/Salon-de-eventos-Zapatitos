import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowRightLeft,
  BarChart3,
  Edit,
  Infinity as InfinityIcon,
  Layers,
  LayoutGrid,
  List,
  Package,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  Warehouse
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { toast } from 'sonner';
import { inventarioService, type Articulo } from '../../services/inventarioService';
import MediaViewerR2 from '../../components/common/MediaViewerR2';
import ArticuloModal from './components/ArticuloModal';
import StockAdjustModal from './components/StockAdjustModal';

type StockFilter = 'all' | 'ok' | 'low' | 'empty' | 'unlimited';
type ViewMode = 'grid' | 'list';

const inputClass =
  'w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10';

const money = (value: number) => (value > 0 ? `$${value.toLocaleString()}` : '-');

const getApiError = (error: unknown, fallback: string) => {
  if (
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
  ) {
    return error.response.data.errors[0] || fallback;
  }

  return fallback;
};

const getStockState = (articulo: Articulo): { key: StockFilter; label: string; classes: string; icon: LucideIcon } => {
  if (!articulo.controlarStock) {
    return { key: 'unlimited', label: 'Ilimitado', classes: 'border-slate-200 bg-slate-50 text-slate-600', icon: InfinityIcon };
  }

  if (articulo.stockActual <= 0) {
    return { key: 'empty', label: 'Sin stock', classes: 'border-rose-100 bg-rose-50 text-rose-700', icon: AlertTriangle };
  }

  if (articulo.stockActual <= articulo.stockMinimo) {
    return { key: 'low', label: 'Stock bajo', classes: 'border-amber-100 bg-amber-50 text-amber-700', icon: AlertTriangle };
  }

  return { key: 'ok', label: 'Disponible', classes: 'border-emerald-100 bg-emerald-50 text-emerald-700', icon: BarChart3 };
};

const InventarioPage = () => {
  const [articulos, setArticulos] = useState<Articulo[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<StockFilter>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [selectedArticulo, setSelectedArticulo] = useState<Articulo | null>(null);

  const loadArticulos = async () => {
    setLoading(true);
    try {
      const data = await inventarioService.getArticulos();
      setArticulos(data);
    } catch {
      toast.error('Hubo un error al cargar el inventario');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void Promise.resolve().then(loadArticulos);
  }, []);

  const filteredArticulos = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return articulos.filter(articulo => {
      const state = getStockState(articulo);
      const matchesSearch =
        !query ||
        articulo.nombre.toLowerCase().includes(query) ||
        articulo.descripcion?.toLowerCase().includes(query) ||
        articulo.proveedorNombre?.toLowerCase().includes(query);
      const matchesState = filterType === 'all' || state.key === filterType;
      return matchesSearch && matchesState;
    });
  }, [articulos, searchTerm, filterType]);

  const stats = useMemo(() => ({
    total: articulos.length,
    low: articulos.filter(articulo => getStockState(articulo).key === 'low').length,
    empty: articulos.filter(articulo => getStockState(articulo).key === 'empty').length,
    unlimited: articulos.filter(articulo => getStockState(articulo).key === 'unlimited').length
  }), [articulos]);

  const handleEdit = (articulo: Articulo) => {
    setSelectedArticulo(articulo);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Eliminar este articulo del inventario?')) return;

    try {
      await inventarioService.deleteArticulo(id);
      toast.success('Articulo eliminado');
      await loadArticulos();
    } catch (error: unknown) {
      toast.error(getApiError(error, 'Error al eliminar el articulo'));
    }
  };

  return (
    <div className="space-y-8 pb-16">
      <CatalogHeader
        icon={Warehouse}
        title="Inventario"
        subtitle="Insumos y articulos disponibles para venta, paquetes y produccion."
        actionLabel="Nuevo articulo"
        onAction={() => {
          setSelectedArticulo(null);
          setIsModalOpen(true);
        }}
        secondaryLabel="Ajuste de stock"
        onSecondary={() => setIsAdjustModalOpen(true)}
      />

      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard label="Articulos" value={stats.total.toString()} icon={Layers} />
        <MetricCard label="Stock bajo" value={stats.low.toString()} icon={AlertTriangle} />
        <MetricCard label="Sin stock" value={stats.empty.toString()} icon={Package} />
        <MetricCard label="Ilimitados" value={stats.unlimited.toString()} icon={InfinityIcon} />
      </div>

      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm xl:flex-row xl:items-center xl:justify-between">
        <div className="relative xl:w-[460px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            className={`${inputClass} pl-11`}
            placeholder="Buscar articulo, descripcion o proveedor"
            value={searchTerm}
            onChange={event => setSearchTerm(event.target.value)}
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex flex-wrap gap-1 rounded-xl bg-slate-100 p-1">
            {[
              { id: 'all', label: 'Todos' },
              { id: 'ok', label: 'Disponibles' },
              { id: 'low', label: 'Stock bajo' },
              { id: 'empty', label: 'Sin stock' },
              { id: 'unlimited', label: 'Ilimitados' }
            ].map(filter => (
              <button
                key={filter.id}
                type="button"
                onClick={() => setFilterType(filter.id as StockFilter)}
                className={`rounded-lg px-4 py-2 text-xs font-black transition ${
                  filterType === filter.id ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
          <ViewToggle viewMode={viewMode} onChange={setViewMode} />
          <button
            type="button"
            onClick={loadArticulos}
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50"
            title="Actualizar"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {loading ? (
        <LoadingState label="Cargando inventario..." />
      ) : filteredArticulos.length > 0 ? (
        <div className={viewMode === 'grid' ? 'grid gap-4 md:grid-cols-2 xl:grid-cols-3' : 'space-y-3'}>
          {filteredArticulos.map(articulo => (
            viewMode === 'grid' ? (
              <InventoryCard
                key={articulo.id}
                articulo={articulo}
                onEdit={() => handleEdit(articulo)}
                onDelete={() => handleDelete(articulo.id)}
              />
            ) : (
              <InventoryListItem
                key={articulo.id}
                articulo={articulo}
                onEdit={() => handleEdit(articulo)}
                onDelete={() => handleDelete(articulo.id)}
              />
            )
          ))}
        </div>
      ) : (
        <EmptyState
          title="No hay articulos"
          subtitle="No encontramos articulos con los filtros actuales."
          actionLabel="Limpiar filtros"
          onAction={() => {
            setSearchTerm('');
            setFilterType('all');
          }}
        />
      )}

      <ArticuloModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedArticulo(null);
        }}
        onSuccess={loadArticulos}
        articulo={selectedArticulo}
      />
      <StockAdjustModal
        isOpen={isAdjustModalOpen}
        articulos={articulos}
        onClose={() => setIsAdjustModalOpen(false)}
        onSuccess={loadArticulos}
      />
    </div>
  );
};

const CatalogHeader = ({
  icon: Icon,
  title,
  subtitle,
  actionLabel,
  onAction,
  secondaryLabel,
  onSecondary
}: {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  actionLabel: string;
  onAction: () => void;
  secondaryLabel: string;
  onSecondary: () => void;
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
    <div className="flex flex-col gap-2 sm:flex-row">
      <button
        type="button"
        onClick={onSecondary}
        className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-xs font-black text-slate-600 transition hover:bg-slate-50"
      >
        <ArrowRightLeft size={17} />
        {secondaryLabel}
      </button>
      <button
        type="button"
        onClick={onAction}
        className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-xs font-black text-white shadow-lg shadow-blue-600/20 transition hover:bg-slate-900"
      >
        <Plus size={17} />
        {actionLabel}
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

const InventoryCard = ({ articulo, onEdit, onDelete }: { articulo: Articulo; onEdit: () => void; onDelete: () => void }) => {
  const state = getStockState(articulo);
  const StateIcon = state.icon;

  return (
    <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-lg">
      <div className="relative aspect-[16/10] max-h-56 bg-slate-100">
        <MediaViewerR2 url={articulo.imagenUrl || ''} alt={articulo.nombre} className="h-full w-full" />
        <span className={`absolute left-3 top-3 inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-black ${state.classes}`}>
          <StateIcon size={13} />
          {state.label}
        </span>
      </div>

      <div className="space-y-4 p-5">
        <div>
          <h2 className="truncate text-base font-black text-slate-900">{articulo.nombre}</h2>
          <p className="mt-1 min-h-10 overflow-hidden text-sm font-semibold leading-5 text-slate-500">
            {articulo.descripcion || 'Sin descripcion registrada.'}
          </p>
        </div>

        <div className="rounded-xl bg-slate-50 p-3">
          <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">Proveedor</p>
          <p className="mt-1 truncate text-sm font-bold text-slate-800">{articulo.proveedorNombre || 'Sin proveedor'}</p>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <MiniStat label="Stock" value={articulo.controlarStock ? articulo.stockActual.toString() : '∞'} />
          <MiniStat label="Minimo" value={articulo.controlarStock ? articulo.stockMinimo.toString() : '-'} />
          <MiniStat label="Costo" value={money(articulo.precioCosto)} />
        </div>

        <div className="flex items-center justify-between border-t border-slate-100 pt-4">
          <span className="rounded-lg bg-slate-50 px-3 py-1.5 text-xs font-black text-slate-500">{articulo.unidadMedida || 'u'}</span>
          <div className="flex gap-2">
            <button type="button" onClick={onEdit} className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 text-slate-500 transition hover:bg-blue-50 hover:text-blue-600">
              <Edit size={17} />
            </button>
            <button type="button" onClick={onDelete} className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 text-slate-500 transition hover:bg-rose-50 hover:text-rose-600">
              <Trash2 size={17} />
            </button>
          </div>
        </div>
      </div>
    </article>
  );
};

const InventoryListItem = ({ articulo, onEdit, onDelete }: { articulo: Articulo; onEdit: () => void; onDelete: () => void }) => {
  const state = getStockState(articulo);
  const StateIcon = state.icon;

  return (
    <article className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-blue-200 hover:shadow-md md:grid-cols-[120px_1fr_auto] md:items-center">
      <div className="relative h-28 overflow-hidden rounded-xl bg-slate-100 md:h-24">
        <MediaViewerR2 url={articulo.imagenUrl || ''} alt={articulo.nombre} className="h-full w-full" />
      </div>
      <div className="min-w-0">
        <span className={`mb-2 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-black ${state.classes}`}>
          <StateIcon size={13} />
          {state.label}
        </span>
        <h2 className="truncate text-base font-black text-slate-900">{articulo.nombre}</h2>
        <p className="mt-1 truncate text-sm font-semibold text-slate-500">{articulo.proveedorNombre || articulo.descripcion || 'Sin proveedor'}</p>
        <p className="mt-2 text-xs font-black uppercase tracking-wide text-slate-400">
          Stock {articulo.controlarStock ? articulo.stockActual : 'ilimitado'} | Min {articulo.controlarStock ? articulo.stockMinimo : '-'} | {articulo.unidadMedida || 'u'}
        </p>
      </div>
      <div className="flex items-center justify-between gap-4 md:justify-end">
        <div className="text-right">
          <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">Costo</p>
          <p className="text-lg font-black text-slate-900">{money(articulo.precioCosto)}</p>
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

const MiniStat = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-xl bg-slate-50 px-3 py-2 text-center">
    <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">{label}</p>
    <p className="mt-1 text-sm font-black text-slate-900">{value}</p>
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

export default InventarioPage;

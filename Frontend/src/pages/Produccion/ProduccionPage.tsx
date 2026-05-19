import { useEffect, useMemo, useState } from 'react';
import {
  Boxes,
  Edit,
  Layers,
  LayoutGrid,
  List,
  Package,
  Plus,
  RefreshCw,
  Scale,
  Search,
  Trash2,
  Wrench
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { toast } from 'sonner';
import { produccionService, type ProductoProduccion } from '../../services/produccionService';
import MediaViewerR2 from '../../components/common/MediaViewerR2';
import ProductoModal from './components/ProductoModal';

const inputClass =
  'w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10';
type ViewMode = 'grid' | 'list';

const ProduccionPage = () => {
  const [productos, setProductos] = useState<ProductoProduccion[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProducto, setSelectedProducto] = useState<ProductoProduccion | null>(null);

  const loadProductos = async () => {
    setLoading(true);
    try {
      const data = await produccionService.getProductos();
      setProductos(data);
    } catch {
      toast.error('Error al cargar los productos de fabricacion');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void Promise.resolve().then(loadProductos);
  }, []);

  const filteredProductos = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return productos;

    return productos.filter(producto => {
      const ingredientes = producto.ingredientes.map(ingrediente => ingrediente.articuloNombre).join(' ');
      return [producto.nombre, producto.descripcion, producto.estado, ingredientes]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(query);
    });
  }, [productos, searchTerm]);

  const stats = useMemo(() => ({
    total: productos.length,
    ingredients: productos.reduce((sum, producto) => sum + producto.ingredientes.length, 0),
    units: productos.reduce((sum, producto) => sum + producto.cantidadProducida, 0),
    active: productos.filter(producto => producto.estado?.toLowerCase() !== 'inactivo').length
  }), [productos]);

  const handleEdit = (producto: ProductoProduccion) => {
    setSelectedProducto(producto);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Eliminar este producto de fabricacion?')) return;

    try {
      await produccionService.deleteProducto(id);
      toast.success('Producto eliminado');
      await loadProductos();
    } catch {
      toast.error('Error al eliminar el producto');
    }
  };

  return (
    <div className="space-y-8 pb-16">
      <CatalogHeader
        icon={Wrench}
        title="Produccion interna"
        subtitle="Productos fabricados con insumos del inventario y listos para vender como servicios."
        actionLabel="Nuevo producto"
        onAction={() => {
          setSelectedProducto(null);
          setIsModalOpen(true);
        }}
      />

      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard label="Productos" value={stats.total.toString()} icon={Boxes} />
        <MetricCard label="Activos" value={stats.active.toString()} icon={Wrench} />
        <MetricCard label="Insumos usados" value={stats.ingredients.toString()} icon={Layers} />
        <MetricCard label="Unidades base" value={stats.units.toString()} icon={Scale} />
      </div>

      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div className="relative lg:w-[460px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            className={`${inputClass} pl-11`}
            placeholder="Buscar producto, insumo o estado"
            value={searchTerm}
            onChange={event => setSearchTerm(event.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <ViewToggle viewMode={viewMode} onChange={setViewMode} />
          <button
            type="button"
            onClick={loadProductos}
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50"
            title="Actualizar"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {loading ? (
        <LoadingState label="Cargando productos..." />
      ) : filteredProductos.length > 0 ? (
        <div className={viewMode === 'grid' ? 'grid gap-4 xl:grid-cols-2' : 'space-y-3'}>
          {filteredProductos.map(producto => (
            viewMode === 'grid' ? (
              <ProductionCard
                key={producto.id}
                producto={producto}
                onEdit={() => handleEdit(producto)}
                onDelete={() => handleDelete(producto.id)}
              />
            ) : (
              <ProductionListItem
                key={producto.id}
                producto={producto}
                onEdit={() => handleEdit(producto)}
                onDelete={() => handleDelete(producto.id)}
              />
            )
          ))}
        </div>
      ) : (
        <EmptyState
          title="No hay productos"
          subtitle="No encontramos productos de fabricacion con la busqueda actual."
          actionLabel="Limpiar busqueda"
          onAction={() => setSearchTerm('')}
        />
      )}

      <ProductoModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedProducto(null);
        }}
        onSuccess={loadProductos}
        producto={selectedProducto}
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

const ProductionCard = ({ producto, onEdit, onDelete }: { producto: ProductoProduccion; onEdit: () => void; onDelete: () => void }) => (
  <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-lg">
    <div className="grid md:grid-cols-[220px_1fr]">
      <div className="relative min-h-56 max-h-72 overflow-hidden bg-slate-100">
        <MediaViewerR2 url={producto.imagenUrl || ''} alt={producto.nombre} className="h-full w-full" />
        <span className="absolute left-3 top-3 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-black text-blue-700">
          <Wrench size={13} />
          Fabricacion
        </span>
      </div>

      <div className="space-y-5 p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 className="truncate text-base font-black text-slate-900">{producto.nombre}</h2>
            <p className="mt-1 min-h-10 overflow-hidden text-sm font-semibold leading-5 text-slate-500">
              {producto.descripcion || 'Sin descripcion registrada.'}
            </p>
          </div>
          <div className="flex shrink-0 gap-2">
            <button type="button" onClick={onEdit} className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 text-slate-500 transition hover:bg-blue-50 hover:text-blue-600">
              <Edit size={17} />
            </button>
            <button type="button" onClick={onDelete} className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 text-slate-500 transition hover:bg-rose-50 hover:text-rose-600">
              <Trash2 size={17} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <MiniStat label="Produce" value={`${producto.cantidadProducida} ${producto.unidadMedida || 'u'}`} />
          <MiniStat label="Insumos" value={producto.ingredientes.length.toString()} />
          <MiniStat label="Estado" value={producto.estado || 'Activo'} />
        </div>

        <div className="rounded-xl bg-slate-50 p-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-black uppercase tracking-wide text-slate-400">Insumos</p>
            <Package size={16} className="text-slate-400" />
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {producto.ingredientes.slice(0, 6).map(ingrediente => (
              <div key={ingrediente.id} className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2">
                <span className="truncate text-xs font-bold text-slate-700">{ingrediente.articuloNombre}</span>
                <span className="shrink-0 rounded-md bg-blue-50 px-2 py-1 text-[11px] font-black text-blue-700">
                  {ingrediente.cantidadRequerida} {ingrediente.unidadMedida || 'u'}
                </span>
              </div>
            ))}
            {producto.ingredientes.length === 0 && <p className="text-sm font-semibold text-slate-400">Sin insumos vinculados</p>}
            {producto.ingredientes.length > 6 && (
              <span className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-black text-white">+{producto.ingredientes.length - 6} mas</span>
            )}
          </div>
        </div>
      </div>
    </div>
  </article>
);

const ProductionListItem = ({ producto, onEdit, onDelete }: { producto: ProductoProduccion; onEdit: () => void; onDelete: () => void }) => (
  <article className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-blue-200 hover:shadow-md md:grid-cols-[120px_1fr_auto] md:items-center">
    <div className="relative h-28 overflow-hidden rounded-xl bg-slate-100 md:h-24">
      <MediaViewerR2 url={producto.imagenUrl || ''} alt={producto.nombre} className="h-full w-full" />
    </div>
    <div className="min-w-0">
      <span className="mb-2 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-black text-blue-700">
        <Wrench size={13} />
        Fabricacion
      </span>
      <h2 className="truncate text-base font-black text-slate-900">{producto.nombre}</h2>
      <p className="mt-1 truncate text-sm font-semibold text-slate-500">{producto.descripcion || 'Sin descripcion registrada.'}</p>
      <p className="mt-2 text-xs font-black uppercase tracking-wide text-slate-400">
        {producto.ingredientes.length} insumos | {producto.cantidadProducida} {producto.unidadMedida || 'u'} | {producto.estado || 'Activo'}
      </p>
    </div>
    <div className="flex items-center justify-between gap-4 md:justify-end">
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

const MiniStat = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-xl bg-slate-50 px-3 py-2 text-center">
    <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">{label}</p>
    <p className="mt-1 truncate text-sm font-black text-slate-900">{value}</p>
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
    <Wrench className="mx-auto text-slate-200" size={40} />
    <h3 className="mt-4 text-lg font-black text-slate-900">{title}</h3>
    <p className="mt-1 text-sm font-semibold text-slate-400">{subtitle}</p>
    <button type="button" onClick={onAction} className="mt-6 rounded-xl bg-slate-900 px-5 py-3 text-xs font-black text-white transition hover:bg-blue-600">
      {actionLabel}
    </button>
  </div>
);

export default ProduccionPage;

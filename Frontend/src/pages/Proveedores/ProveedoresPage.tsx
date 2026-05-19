import { useEffect, useMemo, useState } from 'react';
import {
  Briefcase,
  Edit,
  LayoutGrid,
  List,
  Mail,
  Phone,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Trash2,
  Truck,
  Users
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { toast } from 'sonner';
import { proveedoresService, type Proveedor } from '../../services/proveedoresService';
import ProveedorModal from './components/ProveedorModal';

type SupplierFilter = 'all' | 'supplies' | 'services' | 'general';
type ViewMode = 'grid' | 'list';

const inputClass =
  'w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10';

const supplierTypes: Record<number, { key: SupplierFilter; label: string; icon: LucideIcon; classes: string }> = {
  0: { key: 'supplies', label: 'Suministros', icon: Truck, classes: 'border-amber-100 bg-amber-50 text-amber-700' },
  1: { key: 'services', label: 'Servicios', icon: Briefcase, classes: 'border-emerald-100 bg-emerald-50 text-emerald-700' },
  2: { key: 'general', label: 'General', icon: ShieldCheck, classes: 'border-blue-100 bg-blue-50 text-blue-700' }
};

const getSupplierType = (tipo: number) => supplierTypes[tipo] || supplierTypes[2];

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

const ProveedoresPage = () => {
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<SupplierFilter>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProveedor, setSelectedProveedor] = useState<Proveedor | null>(null);

  const loadProveedores = async () => {
    setLoading(true);
    try {
      const data = await proveedoresService.getProveedores();
      setProveedores(data);
    } catch {
      toast.error('No se pudo cargar la lista de aliados');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void Promise.resolve().then(loadProveedores);
  }, []);

  const filteredProveedores = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return proveedores.filter(proveedor => {
      const typeInfo = getSupplierType(proveedor.tipo);
      const matchesSearch =
        !query ||
        proveedor.nombre.toLowerCase().includes(query) ||
        proveedor.contactoNombre?.toLowerCase().includes(query) ||
        proveedor.email?.toLowerCase().includes(query) ||
        proveedor.telefono?.toLowerCase().includes(query);
      const matchesType = filterType === 'all' || typeInfo.key === filterType;
      return matchesSearch && matchesType;
    });
  }, [proveedores, searchTerm, filterType]);

  const stats = useMemo(() => ({
    total: proveedores.length,
    supplies: proveedores.filter(proveedor => proveedor.tipo === 0).length,
    services: proveedores.filter(proveedor => proveedor.tipo === 1).length,
    general: proveedores.filter(proveedor => proveedor.tipo === 2).length
  }), [proveedores]);

  const handleEdit = (proveedor: Proveedor) => {
    setSelectedProveedor(proveedor);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Eliminar este aliado tambien puede afectar servicios o productos vinculados.')) return;

    try {
      await proveedoresService.deleteProveedor(id);
      toast.success('Aliado eliminado');
      await loadProveedores();
    } catch (error: unknown) {
      toast.error(getApiError(error, 'Error al eliminar el aliado'));
    }
  };

  return (
    <div className="space-y-8 pb-16">
      <CatalogHeader
        icon={Users}
        title="Proveedores y aliados"
        subtitle="Contactos comerciales que alimentan inventario, servicios externos y operaciones."
        actionLabel="Nuevo aliado"
        onAction={() => {
          setSelectedProveedor(null);
          setIsModalOpen(true);
        }}
      />

      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard label="Total aliados" value={stats.total.toString()} icon={Users} />
        <MetricCard label="Suministros" value={stats.supplies.toString()} icon={Truck} />
        <MetricCard label="Servicios" value={stats.services.toString()} icon={Briefcase} />
        <MetricCard label="General" value={stats.general.toString()} icon={ShieldCheck} />
      </div>

      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm xl:flex-row xl:items-center xl:justify-between">
        <div className="relative xl:w-[460px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            className={`${inputClass} pl-11`}
            placeholder="Buscar aliado, contacto, correo o telefono"
            value={searchTerm}
            onChange={event => setSearchTerm(event.target.value)}
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex flex-wrap gap-1 rounded-xl bg-slate-100 p-1">
            {[
              { id: 'all', label: 'Todos' },
              { id: 'supplies', label: 'Suministros' },
              { id: 'services', label: 'Servicios' },
              { id: 'general', label: 'General' }
            ].map(filter => (
              <button
                key={filter.id}
                type="button"
                onClick={() => setFilterType(filter.id as SupplierFilter)}
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
            onClick={loadProveedores}
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50"
            title="Actualizar"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {loading ? (
        <LoadingState label="Cargando aliados..." />
      ) : filteredProveedores.length > 0 ? (
        <div className={viewMode === 'grid' ? 'grid gap-4 md:grid-cols-2 xl:grid-cols-3' : 'space-y-3'}>
          {filteredProveedores.map(proveedor => (
            viewMode === 'grid' ? (
              <SupplierCard
                key={proveedor.id}
                proveedor={proveedor}
                onEdit={() => handleEdit(proveedor)}
                onDelete={() => handleDelete(proveedor.id)}
              />
            ) : (
              <SupplierListItem
                key={proveedor.id}
                proveedor={proveedor}
                onEdit={() => handleEdit(proveedor)}
                onDelete={() => handleDelete(proveedor.id)}
              />
            )
          ))}
        </div>
      ) : (
        <EmptyState
          title="No hay aliados"
          subtitle="No encontramos proveedores con los filtros actuales."
          actionLabel="Limpiar filtros"
          onAction={() => {
            setSearchTerm('');
            setFilterType('all');
          }}
        />
      )}

      <ProveedorModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedProveedor(null);
        }}
        onSuccess={loadProveedores}
        proveedor={selectedProveedor}
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

const SupplierCard = ({ proveedor, onEdit, onDelete }: { proveedor: Proveedor; onEdit: () => void; onDelete: () => void }) => {
  const typeInfo = getSupplierType(proveedor.tipo);
  const TypeIcon = typeInfo.icon;
  const initials = proveedor.nombre
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0])
    .join('')
    .toUpperCase();

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-lg">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-slate-900 text-lg font-black text-white">
            {initials || 'A'}
          </div>
          <div className="min-w-0">
            <h2 className="truncate text-base font-black text-slate-900">{proveedor.nombre}</h2>
            <p className="mt-1 text-sm font-semibold text-slate-500">{proveedor.contactoNombre || 'Sin contacto asignado'}</p>
          </div>
        </div>
        <span className={`inline-flex shrink-0 items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-black ${typeInfo.classes}`}>
          <TypeIcon size={13} />
          {typeInfo.label}
        </span>
      </div>

      <div className="mt-5 space-y-3 rounded-xl bg-slate-50 p-4">
        <ContactLine icon={Phone} value={proveedor.telefono || 'Sin telefono'} />
        <ContactLine icon={Mail} value={proveedor.email || 'Sin correo'} />
      </div>

      <div className="mt-5 flex justify-between border-t border-slate-100 pt-4">
        <div className="inline-flex items-center gap-2 text-xs font-black text-emerald-600">
          <ShieldCheck size={15} />
          Aliado activo
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

const SupplierListItem = ({ proveedor, onEdit, onDelete }: { proveedor: Proveedor; onEdit: () => void; onDelete: () => void }) => {
  const typeInfo = getSupplierType(proveedor.tipo);
  const TypeIcon = typeInfo.icon;
  const initials = proveedor.nombre
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0])
    .join('')
    .toUpperCase();

  return (
    <article className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-blue-200 hover:shadow-md md:grid-cols-[72px_1fr_auto] md:items-center">
      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-slate-900 text-lg font-black text-white">
        {initials || 'A'}
      </div>
      <div className="min-w-0">
        <span className={`mb-2 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-black ${typeInfo.classes}`}>
          <TypeIcon size={13} />
          {typeInfo.label}
        </span>
        <h2 className="truncate text-base font-black text-slate-900">{proveedor.nombre}</h2>
        <p className="mt-1 truncate text-sm font-semibold text-slate-500">{proveedor.contactoNombre || 'Sin contacto asignado'}</p>
        <p className="mt-2 truncate text-xs font-black uppercase tracking-wide text-slate-400">
          {proveedor.telefono || 'Sin telefono'} | {proveedor.email || 'Sin correo'}
        </p>
      </div>
      <div className="flex items-center justify-end gap-2">
        <button type="button" onClick={onEdit} className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 text-slate-500 transition hover:bg-blue-50 hover:text-blue-600">
          <Edit size={17} />
        </button>
        <button type="button" onClick={onDelete} className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 text-slate-500 transition hover:bg-rose-50 hover:text-rose-600">
          <Trash2 size={17} />
        </button>
      </div>
    </article>
  );
};

const ContactLine = ({ icon: Icon, value }: { icon: LucideIcon; value: string }) => (
  <div className="flex min-w-0 items-center gap-3 text-sm font-semibold text-slate-600">
    <Icon className="shrink-0 text-slate-400" size={16} />
    <span className="truncate">{value}</span>
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
    <Users className="mx-auto text-slate-200" size={40} />
    <h3 className="mt-4 text-lg font-black text-slate-900">{title}</h3>
    <p className="mt-1 text-sm font-semibold text-slate-400">{subtitle}</p>
    <button type="button" onClick={onAction} className="mt-6 rounded-xl bg-slate-900 px-5 py-3 text-xs font-black text-white transition hover:bg-blue-600">
      {actionLabel}
    </button>
  </div>
);

export default ProveedoresPage;

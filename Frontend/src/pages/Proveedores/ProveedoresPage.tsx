import { useEffect, useState } from 'react';
import { 
  Users, 
  Search, 
  Plus, 
  RefreshCw, 
  Filter, 
  Mail, 
  Phone, 
  Edit, 
  Trash2,
  ShieldCheck,
  Truck,
  Briefcase
} from 'lucide-react';
import { proveedoresService } from '../../services/proveedoresService';
import type { Proveedor } from '../../services/proveedoresService';
import ProveedorModal from './components/ProveedorModal';
import { toast } from 'sonner';

const ProveedoresPage = () => {
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProveedor, setSelectedProveedor] = useState<Proveedor | null>(null);

  useEffect(() => {
    loadProveedores();
  }, []);

  const loadProveedores = async () => {
    setLoading(true);
    try {
      const data = await proveedoresService.getProveedores();
      setProveedores(data);
    } catch (err) {
      console.error('Error al cargar proveedores', err);
      toast.error('No se pudo cargar la lista de aliados');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (proveedor: Proveedor) => {
    setSelectedProveedor(proveedor);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar este aliado? ALERTA: Si eliminas este proveedor, todos los servicios y productos relacionados a él desaparecerán también del catálogo. Esta acción no se puede deshacer.')) return;
    
    try {
      await proveedoresService.deleteProveedor(id);
      toast.success('Aliado eliminado con éxito');
      loadProveedores();
    } catch (err: any) {
      console.error('Error al eliminar aliado', err);
      const errorMsg = err.response?.data?.errors?.[0] || 'Error al eliminar el aliado';
      toast.error(errorMsg);
    }
  };

  const filteredProveedores = proveedores.filter(p => 
    p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.contactoNombre?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 pb-12">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-6">
          <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
            <Users size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">
              Aliados Externos
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              Gestión de proveedores y servicios adicionales
            </p>
          </div>
        </div>

        <button 
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors w-full md:w-auto font-medium" 
          onClick={() => {
            setSelectedProveedor(null);
            setIsModalOpen(true);
          }}
        >
          <Plus size={20} /> Nuevo Aliado
        </button>
      </div>

      {/* QUICK KPI CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Total Aliados', value: proveedores.length, icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-50' },
          { label: 'Suministros', value: Math.ceil(proveedores.length * 0.7), icon: Truck, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Servicios Externos', value: Math.floor(proveedores.length * 0.3), icon: Briefcase, color: 'text-emerald-600', bg: 'bg-emerald-50' },
        ].map((kpi, idx) => (
          <div key={idx} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${kpi.bg} ${kpi.color}`}>
                <kpi.icon size={24} />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800">{kpi.value}</p>
                <p className="text-sm font-medium text-slate-500">{kpi.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* SEARCH & FILTERS */}
      <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input 
            type="text" 
            placeholder="Buscar por nombre, contacto o correo..." 
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-12 pr-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm text-slate-800 placeholder:text-slate-400"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-3">
          <div className="relative flex-1 sm:flex-none">
            <select className="w-full sm:w-auto bg-slate-50 border border-slate-200 rounded-lg pl-4 pr-10 py-3 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all appearance-none cursor-pointer">
              <option value="todas">Todos los Tipos</option>
              <option value="suministros">Suministros</option>
              <option value="servicios">Servicios Externos</option>
            </select>
            <Filter size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
          <button 
            onClick={loadProveedores} 
            className="w-12 h-12 flex items-center justify-center bg-slate-50 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-100 transition-colors shrink-0"
            title="Actualizar"
          >
            <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* PROVEEDORES GRID */}
      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center space-y-4">
          <RefreshCw className="w-10 h-10 text-indigo-400 animate-spin" />
          <p className="text-slate-500 font-medium text-sm">Cargando proveedores...</p>
        </div>
      ) : filteredProveedores.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProveedores.map((proveedor) => (
            <div key={proveedor.id} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col">
              
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center font-bold text-xl">
                  {proveedor.nombre[0]}
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleEdit(proveedor)}
                    className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                    title="Editar"
                  >
                    <Edit size={16} />
                  </button>
                  <button 
                    onClick={() => handleDelete(proveedor.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                    title="Eliminar"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-lg font-bold text-slate-800">{proveedor.nombre}</h3>
                <div className="flex items-center gap-1.5 mt-1">
                  <ShieldCheck size={14} className="text-emerald-500" />
                  <span className="text-xs font-medium text-slate-500">Aliado Activo</span>
                </div>
              </div>

              <div className="space-y-3 pt-4 border-t border-slate-100 mt-auto">
                <div className="flex items-center gap-3 text-slate-600">
                  <Mail size={16} className="text-slate-400" />
                  <span className="text-sm truncate">{proveedor.email || 'Sin correo registrado'}</span>
                </div>
                <div className="flex items-center gap-3 text-slate-600">
                  <Phone size={16} className="text-slate-400" />
                  <span className="text-sm">{proveedor.telefono || 'Sin teléfono'}</span>
                </div>
              </div>

            </div>
          ))}
        </div>
      ) : (
        <div className="py-24 flex flex-col items-center justify-center text-center px-4 bg-white border border-slate-200 rounded-2xl">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mb-4">
            <Users size={32} />
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-1">No hay aliados</h3>
          <p className="text-sm text-slate-500 mb-6 max-w-sm">No se han detectado proveedores en la red con los filtros actuales.</p>
          <button 
            onClick={() => {
              setSearchTerm('');
              setIsModalOpen(true);
            }}
            className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
          >
            Registrar Aliado
          </button>
        </div>
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

export default ProveedoresPage;

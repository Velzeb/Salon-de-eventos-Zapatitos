import { useEffect, useState, useMemo } from 'react';
import { 
  Plus, 
  Search, 
  Trash2, 
  Edit, 
  RefreshCw,
  Package,
  Users,
  Wrench,
  Zap,
  LayoutGrid,
  Boxes,
  Truck
} from 'lucide-react';
import { paquetesService, type Servicio } from '../../services/paquetesService';
import { toast } from 'sonner';
import ServicioModal from './components/ServicioModal';

const ServiciosPage = () => {
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedServicio, setSelectedServicio] = useState<Servicio | null>(null);
  const [filterType, setFilterType] = useState<number | 'all'>('all');

  useEffect(() => {
    loadServicios();
  }, []);

  const loadServicios = async () => {
    setLoading(true);
    try {
      const data = await paquetesService.getServicios();
      setServicios(data);
    } catch (err) {
      console.error('Error al cargar servicios', err);
      toast.error('Error al cargar el catálogo de servicios');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (servicio: Servicio) => {
    setSelectedServicio(servicio);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar este servicio?')) return;
    
    try {
      await paquetesService.deleteServicio(id);
      toast.success('Servicio eliminado con éxito');
      loadServicios();
    } catch (err: any) {
      console.error('Error al eliminar servicio', err);
      const errorMsg = err.response?.data?.errors?.[0] || 'Error al eliminar el servicio';
      toast.error(errorMsg);
    }
  };

  const filteredServicios = useMemo(() => {
    return servicios.filter(s => {
      const matchesSearch = s.nombre.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = filterType === 'all' || s.tipo === filterType;
      return matchesSearch && matchesType;
    });
  }, [servicios, searchTerm, filterType]);

  const stats = useMemo(() => {
    return {
      total: servicios.length,
      inventario: servicios.filter(s => s.tipo === 0).length,
      produccion: servicios.filter(s => s.tipo === 1).length,
      terceros: servicios.filter(s => s.tipo === 2).length,
      avgPrice: servicios.length > 0 
        ? servicios.reduce((acc, s) => acc + s.costoBase, 0) / servicios.length 
        : 0
    };
  }, [servicios]);

  const getTypeInfo = (tipo: number) => {
    switch(tipo) {
      case 0: return { label: 'Inventario', color: 'indigo', icon: Package, desc: 'Respaldado por stock' };
      case 1: return { label: 'Fabricación', color: 'amber', icon: Wrench, desc: 'Producción interna' };
      case 2: return { label: 'Tercero', color: 'emerald', icon: Users, desc: 'Proveedor externo' };
      default: return { label: 'Otros', color: 'slate', icon: Zap, desc: 'General' };
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-6">
          <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
            <LayoutGrid size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">
              Catálogo de Servicios
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              Gestión de servicios y amenidades ofrecidas
            </p>
          </div>
        </div>

        <button 
          onClick={() => {
            setSelectedServicio(null);
            setIsModalOpen(true);
          }}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors w-full md:w-auto font-medium" 
        >
          <Plus size={20} /> Nuevo Servicio
        </button>
      </div>

      {/* STATS OVERVIEW */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Servicios', value: stats.total, icon: Zap, color: 'text-indigo-600', bg: 'bg-indigo-50' },
          { label: 'Stock / Insumos', value: stats.inventario, icon: Boxes, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Producción', value: stats.produccion, icon: Wrench, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Terceros / Externos', value: stats.terceros, icon: Truck, color: 'text-emerald-600', bg: 'bg-emerald-50' }
        ].map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium text-slate-500">{stat.label}</p>
              <p className="text-2xl font-bold text-slate-800">{stat.value}</p>
            </div>
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.bg} ${stat.color}`}>
              <stat.icon size={24} />
            </div>
          </div>
        ))}
      </div>

      {/* SEARCH & FILTERS */}
      <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm flex flex-col lg:flex-row gap-6 items-center">
        <div className="flex-1 relative w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input 
            type="text" 
            placeholder="Buscar por nombre del servicio..." 
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-12 pr-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm text-slate-800 placeholder:text-slate-400"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          {[
            { id: 'all', label: 'Todos' },
            { id: 0, label: 'Inventario' },
            { id: 1, label: 'Fabricación' },
            { id: 2, label: 'Terceros' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterType(tab.id as any)}
              className={`
                px-4 py-2 rounded-lg text-sm font-medium transition-all
                ${filterType === tab.id 
                  ? 'bg-slate-800 text-white' 
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'}
              `}
            >
              {tab.label}
            </button>
          ))}
          <div className="w-px h-8 bg-slate-200 mx-2 hidden sm:block" />
          <button 
            onClick={loadServicios} 
            className="w-10 h-10 flex items-center justify-center bg-slate-50 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-100 transition-colors shrink-0"
            title="Actualizar"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* SERVICES LIST */}
      <div className="flex flex-col gap-4">
        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center space-y-4">
            <RefreshCw className="w-10 h-10 text-indigo-400 animate-spin" />
            <p className="text-slate-500 font-medium text-sm">Cargando servicios...</p>
          </div>
        ) : filteredServicios.length > 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="px-6 py-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Servicio</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-600 uppercase tracking-wider text-center">Tipo / Origen</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-600 uppercase tracking-wider text-center">Mínimo</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-600 uppercase tracking-wider text-right">Precio Venta</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-600 uppercase tracking-wider text-right">Margen</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-600 uppercase tracking-wider text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredServicios.map((servicio) => {
                    const typeInfo = getTypeInfo(servicio.tipo);
                    const margen = servicio.precioProveedor > 0 
                      ? (((servicio.costoBase - servicio.precioProveedor) / servicio.costoBase) * 100).toFixed(0)
                      : null;

                    return (
                      <tr key={servicio.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center bg-${typeInfo.color}-50 text-${typeInfo.color}-600 shrink-0`}>
                              <typeInfo.icon size={18} />
                            </div>
                            <div className="flex flex-col">
                              <span className="font-semibold text-slate-800 text-sm">{servicio.nombre}</span>
                              {servicio.descripcion && (
                                <span className="text-xs text-slate-500 mt-0.5 line-clamp-1">{servicio.descripcion}</span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex flex-col items-center">
                            <span className={`text-xs font-medium px-2 py-0.5 rounded text-${typeInfo.color}-700 bg-${typeInfo.color}-50 border border-${typeInfo.color}-200`}>
                              {typeInfo.label}
                            </span>
                            <span className="text-xs text-slate-500 mt-1 truncate max-w-[120px]" title={servicio.articuloNombre || servicio.productoNombre || servicio.proveedorNombre || 'Sistema'}>
                              {servicio.articuloNombre || servicio.productoNombre || servicio.proveedorNombre || '-'}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="text-sm font-semibold text-slate-700">{servicio.cantidadMinima} u.</span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="text-sm font-bold text-slate-800">${servicio.costoBase.toLocaleString()}</span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          {margen ? (
                            <div className="flex flex-col items-end">
                              <span className="text-sm font-semibold text-emerald-600">{margen}%</span>
                              <span className="text-xs text-slate-500" title={`Costo proveedor: $${servicio.precioProveedor.toLocaleString()}`}>
                                Costo: ${servicio.precioProveedor.toLocaleString()}
                              </span>
                            </div>
                          ) : (
                            <span className="text-sm text-slate-400">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button 
                              onClick={() => handleEdit(servicio)}
                              className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                              title="Editar"
                            >
                              <Edit size={18} />
                            </button>
                            <button 
                              onClick={() => handleDelete(servicio.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                              title="Eliminar"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="py-24 flex flex-col items-center justify-center text-center px-4 bg-white border border-slate-200 rounded-2xl">
             <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mb-4">
               <Zap size={32} />
             </div>
             <h3 className="text-lg font-bold text-slate-800 mb-1">Catálogo vacío</h3>
             <p className="text-sm text-slate-500 mb-6 max-w-sm">No se encontraron servicios que coincidan con los filtros.</p>
             <button 
              onClick={() => {
                setSearchTerm('');
                setFilterType('all');
              }}
              className="px-5 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-200 transition-colors"
             >
               Limpiar Filtros
             </button>
          </div>
        )}
      </div>

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

export default ServiciosPage;

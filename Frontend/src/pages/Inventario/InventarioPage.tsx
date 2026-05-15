import { useEffect, useState } from 'react';
import { 
  Package, 
  Search, 
  Plus, 
  ArrowRightLeft, 
  AlertTriangle,
  RefreshCw,
  Infinity,
  BarChart3,
  Filter,
  Layers,
  Warehouse,
  Edit,
  Trash2
} from 'lucide-react';
import { inventarioService } from '../../services/inventarioService';
import type { Articulo } from '../../services/inventarioService';
import ArticuloModal from './components/ArticuloModal';
import StockAdjustModal from './components/StockAdjustModal';
import { toast } from 'sonner';

const InventarioPage = () => {
  const [articulos, setArticulos] = useState<Articulo[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [selectedArticulo, setSelectedArticulo] = useState<Articulo | null>(null);

  useEffect(() => {
    loadArticulos();
  }, []);

  const loadArticulos = async () => {
    setLoading(true);
    try {
      const data = await inventarioService.getArticulos();
      setArticulos(data);
    } catch (err) {
      console.error('Error al cargar inventario', err);
      toast.error('Hubo un error al cargar el inventario');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (articulo: Articulo) => {
    setSelectedArticulo(articulo);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar este artículo? Esta acción no se puede deshacer.')) return;
    
    try {
      await inventarioService.deleteArticulo(id);
      toast.success('Artículo eliminado con éxito');
      loadArticulos();
    } catch (err: any) {
      console.error('Error al eliminar artículo', err);
      const errorMsg = err.response?.data?.errors?.[0] || 'Error al eliminar el artículo';
      toast.error(errorMsg);
    }
  };

  const filteredArticulos = articulos.filter(a => 
    a.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (a.proveedorNombre?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 pb-12">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-6">
          <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
            <Warehouse size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">
              Inventario
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              Gestión de insumos y artículos del salón
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3">
          <button 
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors w-full sm:w-auto font-medium"
            onClick={() => setIsAdjustModalOpen(true)}
          >
            <ArrowRightLeft size={18} className="text-indigo-600" /> Ajuste de Stock
          </button>
          <button 
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors w-full sm:w-auto font-medium" 
            onClick={() => {
              setSelectedArticulo(null);
              setIsModalOpen(true);
            }}
          >
            <Plus size={20} /> Nuevo Artículo
          </button>
        </div>
      </div>

      {/* SEARCH & KPI BAR */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-8 bg-white border border-slate-200 p-6 rounded-2xl shadow-sm flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input 
              type="text" 
              placeholder="Buscar artículo o proveedor..." 
              className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-12 pr-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm text-slate-800 placeholder:text-slate-400"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-3">
            <div className="relative flex-1 sm:flex-none">
              <select className="w-full sm:w-auto bg-slate-50 border border-slate-200 rounded-lg pl-4 pr-10 py-3 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all appearance-none cursor-pointer">
                <option value="todas">Todos los Sectores</option>
                <option value="consumibles">Consumibles</option>
                <option value="activos">Activos Fijos</option>
              </select>
              <Filter size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
            <button 
              onClick={loadArticulos} 
              className="w-12 h-12 flex items-center justify-center bg-slate-50 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-100 transition-colors shrink-0"
              title="Actualizar"
            >
              <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* QUICK STATS */}
        <div className="lg:col-span-4 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
              <Layers size={24} />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">{articulos.length}</p>
              <p className="text-sm font-medium text-slate-500">Artículos en total</p>
            </div>
          </div>
          <div className="text-right flex flex-col items-end">
            <div className="flex items-center justify-end gap-1.5 text-rose-600 mb-0.5 bg-rose-50 px-2.5 py-1 rounded-md">
              <AlertTriangle size={14} />
              <span className="font-bold text-sm">{articulos.filter(a => a.controlarStock && a.stockActual <= a.stockMinimo).length}</span>
            </div>
            <span className="text-xs font-medium text-slate-500">Alertas de Stock</span>
          </div>
        </div>
      </div>

      {/* INVENTORY TABLE */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center space-y-4">
            <RefreshCw className="w-10 h-10 text-indigo-400 animate-spin" />
            <p className="text-slate-500 font-medium text-sm">Cargando inventario...</p>
          </div>
        ) : filteredArticulos.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-6 py-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Artículo</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Proveedor</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-600 uppercase tracking-wider text-center">Stock</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-600 uppercase tracking-wider text-center">Unidad</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-600 uppercase tracking-wider text-right">Costo</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-600 uppercase tracking-wider text-center">Estado</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-600 uppercase tracking-wider text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredArticulos.map((articulo) => (
                  <tr key={articulo.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-800 text-sm">{articulo.nombre}</span>
                        {articulo.descripcion && (
                          <span className="text-xs text-slate-500 mt-0.5">{articulo.descripcion}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-slate-600">
                        {articulo.proveedorNombre || 'Sin proveedor'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {!articulo.controlarStock ? (
                        <div className="flex justify-center text-slate-400" title="Stock ilimitado">
                          <Infinity size={20} />
                        </div>
                      ) : (
                        <span className={`text-sm font-bold ${articulo.stockActual <= articulo.stockMinimo ? 'text-rose-600' : 'text-slate-800'}`}>
                          {articulo.stockActual}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-xs font-medium text-slate-600 bg-slate-100 px-2 py-1 rounded-md">{articulo.unidadMedida}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-sm font-semibold text-slate-800">
                        {articulo.precioCosto > 0 ? `$${articulo.precioCosto.toLocaleString()}` : '—'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center">
                        <div className={`
                          inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border
                          ${!articulo.controlarStock 
                            ? 'bg-slate-50 text-slate-600 border-slate-200' 
                            : articulo.stockActual <= 0 
                              ? 'bg-rose-50 text-rose-700 border-rose-200' 
                              : articulo.stockActual <= articulo.stockMinimo 
                                ? 'bg-amber-50 text-amber-700 border-amber-200' 
                                : 'bg-emerald-50 text-emerald-700 border-emerald-200'}
                        `}>
                          {!articulo.controlarStock ? (
                            <>Ilimitado</>
                          ) : (
                            <>
                              {articulo.stockActual <= 0 ? (
                                <AlertTriangle size={12} />
                              ) : articulo.stockActual <= articulo.stockMinimo ? (
                                <AlertTriangle size={12} />
                              ) : (
                                <BarChart3 size={12} />
                              )}
                              {articulo.stockActual <= 0 ? 'Sin stock' : articulo.stockActual <= articulo.stockMinimo ? 'Stock bajo' : 'OK'}
                            </>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => handleEdit(articulo)}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                          title="Editar artículo"
                        >
                          <Edit size={18} />
                        </button>
                        <button 
                          onClick={() => handleDelete(articulo.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                          title="Eliminar artículo"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-24 flex flex-col items-center justify-center text-center px-4">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mb-4">
              <Package size={32} />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-1">No hay artículos</h3>
            <p className="text-sm text-slate-500 mb-6 max-w-sm">No se encontraron artículos con los criterios de búsqueda actuales en el inventario.</p>
            <button 
              onClick={() => {
                setSearchTerm('');
                loadArticulos();
              }}
              className="px-5 py-2 bg-indigo-50 text-indigo-600 rounded-lg text-sm font-medium hover:bg-indigo-100 transition-colors"
            >
              Limpiar búsqueda
            </button>
          </div>
        )}
      </div>

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

export default InventarioPage;

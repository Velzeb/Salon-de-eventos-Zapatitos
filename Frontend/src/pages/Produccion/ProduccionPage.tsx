import { useEffect, useState } from 'react';
import { 
  Wrench, 
  Search, 
  Plus, 
  RefreshCw,
  Trash2,
  Edit,
  Boxes,
  Scale,
  Package
} from 'lucide-react';
import { produccionService, type ProductoProduccion } from '../../services/produccionService';
import { toast } from 'sonner';
import ProductoModal from './components/ProductoModal';

const ProduccionPage = () => {
  const [productos, setProductos] = useState<ProductoProduccion[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProducto, setSelectedProducto] = useState<ProductoProduccion | null>(null);

  useEffect(() => {
    loadProductos();
  }, []);

  const loadProductos = async () => {
    setLoading(true);
    try {
      const data = await produccionService.getProductos();
      setProductos(data);
    } catch (err) {
      console.error('Error al cargar productos de producción', err);
      toast.error('Error al cargar los productos de fabricación');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (producto: ProductoProduccion) => {
    setSelectedProducto(producto);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar este producto de fabricación?')) return;
    
    try {
      await produccionService.deleteProducto(id);
      toast.success('Producto eliminado con éxito');
      loadProductos();
    } catch (err: any) {
      console.error('Error al eliminar producto', err);
      toast.error('Error al eliminar el producto');
    }
  };

  const filteredProductos = productos.filter(p => 
    p.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 pb-12">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-6">
          <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
            <Wrench size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">
              Producción Interna
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              Ensamblaje y fabricación de productos
            </p>
          </div>
        </div>

        <button 
          onClick={() => {
            setSelectedProducto(null);
            setIsModalOpen(true);
          }}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors w-full md:w-auto font-medium" 
        >
          <Plus size={20} /> Nuevo Producto
        </button>
      </div>

      {/* SEARCH & FILTERS */}
      <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input 
            type="text" 
            placeholder="Buscar por nombre de producto..." 
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-12 pr-4 py-3 outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all text-sm text-slate-800 placeholder:text-slate-400"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button 
          onClick={loadProductos} 
          className="w-12 h-12 flex items-center justify-center bg-slate-50 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-100 transition-colors shrink-0"
          title="Actualizar"
        >
          <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* PRODUCTS LIST */}
      <div className="grid grid-cols-1 gap-6">
        {loading ? (
          Array(3).fill(0).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-6 border border-slate-200 animate-pulse h-40" />
          ))
        ) : filteredProductos.length > 0 ? (
          filteredProductos.map((producto) => (
            <div key={producto.id} className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex flex-col lg:flex-row gap-8">
                {/* Left: Info */}
                <div className="lg:w-1/3 space-y-5">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
                      <Boxes size={24} />
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => handleEdit(producto)}
                        className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-md transition-colors"
                      >
                        <Edit size={18} />
                      </button>
                      <button 
                        onClick={() => handleDelete(producto.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-800 mb-1">{producto.nombre}</h3>
                    <p className="text-sm text-slate-500 line-clamp-2">{producto.descripcion || 'Sin descripción detallada'}</p>
                  </div>
                  <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 inline-flex">
                    <Scale size={16} className="text-amber-600" />
                    <span className="text-sm font-medium text-slate-700">{producto.cantidadProducida} {producto.unidadMedida || 'unidades'}</span>
                  </div>
                </div>

                {/* Right: Components/Ingredients */}
                <div className="lg:w-2/3 bg-slate-50 rounded-xl p-6 border border-slate-100">
                  <div className="flex items-center gap-2 mb-4">
                    <Package size={18} className="text-slate-400" />
                    <span className="text-sm font-semibold text-slate-700">Insumos / Componentes ({producto.ingredientes.length})</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {producto.ingredientes.map((ing) => (
                      <div key={ing.id} className="flex items-center justify-between bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                          <span className="text-sm font-medium text-slate-700 truncate">{ing.articuloNombre}</span>
                        </div>
                        <div className="flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 shrink-0">
                          {ing.cantidadRequerida} {ing.unidadMedida}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="py-24 flex flex-col items-center justify-center space-y-4 bg-white rounded-2xl border border-slate-200">
             <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300">
               <Wrench size={32} />
             </div>
             <p className="text-slate-500 font-medium text-sm">No hay productos de fabricación registrados aún.</p>
          </div>
        )}
      </div>

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

export default ProduccionPage;

import { useEffect, useState } from 'react';
import { 
  X, 
  Wrench, 
  Plus, 
  Trash2, 
  RefreshCw,
  Boxes
} from 'lucide-react';
import { inventarioService, type Articulo } from '../../../services/inventarioService';
import { produccionService, type ProductoProduccion, type CreateProductoProduccionCommand, type IngredienteCommand } from '../../../services/produccionService';
import { toast } from 'sonner';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  producto: ProductoProduccion | null;
}

const ProductoModal = ({ isOpen, onClose, onSuccess, producto }: Props) => {
  const [articulos, setArticulos] = useState<Articulo[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CreateProductoProduccionCommand>({
    nombre: '',
    descripcion: '',
    cantidadProducida: 1,
    unidadMedida: 'unidades',
    ingredientes: []
  });

  useEffect(() => {
    if (isOpen) {
      loadArticulos();
      if (producto) {
        setFormData({
          nombre: producto.nombre,
          descripcion: producto.descripcion || '',
          cantidadProducida: producto.cantidadProducida,
          unidadMedida: producto.unidadMedida || 'unidades',
          ingredientes: producto.ingredientes.map(i => ({
            articuloInventarioId: i.articuloInventarioId,
            cantidadRequerida: i.cantidadRequerida,
            unidadMedida: i.unidadMedida
          }))
        });
      } else {
        setFormData({
          nombre: '',
          descripcion: '',
          cantidadProducida: 1,
          unidadMedida: 'unidades',
          ingredientes: []
        });
      }
    }
  }, [isOpen, producto]);

  const loadArticulos = async () => {
    try {
      const data = await inventarioService.getArticulos();
      setArticulos(data);
    } catch (err) {
      console.error('Error al cargar artículos de inventario', err);
    }
  };

  const handleAddIngrediente = () => {
    setFormData(prev => ({
      ...prev,
      ingredientes: [
        ...prev.ingredientes,
        { articuloInventarioId: 0, cantidadRequerida: 0, unidadMedida: '' }
      ]
    }));
  };

  const handleRemoveIngrediente = (index: number) => {
    setFormData(prev => ({
      ...prev,
      ingredientes: prev.ingredientes.filter((_, i) => i !== index)
    }));
  };

  const handleIngredienteChange = (index: number, field: keyof IngredienteCommand, value: any) => {
    const newIngredientes = [...formData.ingredientes];
    newIngredientes[index] = { ...newIngredientes[index], [field]: value };
    
    // Auto-set unidad medida if article selected
    if (field === 'articuloInventarioId') {
      const articulo = articulos.find(a => a.id === parseInt(value));
      if (articulo) {
        newIngredientes[index].unidadMedida = articulo.unidadMedida || '';
      }
    }

    setFormData(prev => ({ ...prev, ingredientes: newIngredientes }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.ingredientes.length === 0) {
      toast.error('Debe agregar al menos un componente/insumo');
      return;
    }

    if (formData.ingredientes.some(i => i.articuloInventarioId === 0 || i.cantidadRequerida <= 0)) {
      toast.error('Todos los componentes deben tener un artículo y una cantidad válida');
      return;
    }

    setLoading(true);
    try {
      if (producto) {
        await produccionService.updateProducto(producto.id, { ...formData, id: producto.id });
        toast.success('Producto actualizado con éxito');
      } else {
        await produccionService.createProducto(formData);
        toast.success('Producto de fabricación creado con éxito');
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Error al guardar producto', err);
      toast.error('Error al guardar el producto de fabricación');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-10">
      <div className="absolute inset-0 bg-bg-dark/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={onClose} />
      
      <div className="relative w-full max-w-4xl bg-white rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-10 duration-500 border border-slate-100 max-h-[90vh] flex flex-col">
        {/* HEADER */}
        <div className="bg-bg-dark p-10 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-6">
            <div className="w-14 h-14 bg-amber-500 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-amber-500/20">
              <Wrench size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-display font-bold text-white uppercase tracking-tight">
                {producto ? 'Editar' : 'Nuevo'} <span className="text-amber-500">Producto</span>
              </h2>
              <p className="text-white/40 text-[10px] font-bold uppercase tracking-[0.2em] mt-1">Configuración de Fabricación Interna</p>
            </div>
          </div>
          <button onClick={onClose} className="w-12 h-12 flex items-center justify-center rounded-xl bg-white/10 text-white/50 hover:bg-rose-500 hover:text-white transition-all duration-300">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto custom-scrollbar p-10 space-y-10">
          {/* GENERAL INFO */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Nombre del Producto</label>
              <input 
                required
                type="text" 
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-5 outline-none focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 transition-all font-bold text-xs uppercase tracking-widest text-bg-dark"
                value={formData.nombre}
                onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                placeholder="Ej: Kit de Decoración, Estructura de Arco..."
              />
            </div>
            <div className="space-y-4">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Unidad de Salida (Lote)</label>
              <div className="flex gap-4">
                <input 
                  required
                  type="number" 
                  min="0"
                  step="any"
                  className="w-1/3 bg-slate-50 border border-slate-100 rounded-2xl px-6 py-5 outline-none focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 transition-all font-bold text-xs text-bg-dark"
                  value={formData.cantidadProducida}
                  onChange={(e) => setFormData({...formData, cantidadProducida: parseFloat(e.target.value) || 0})}
                />
                <input 
                  required
                  type="text" 
                  className="w-2/3 bg-slate-50 border border-slate-100 rounded-2xl px-6 py-5 outline-none focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 transition-all font-bold text-xs uppercase tracking-widest text-bg-dark"
                  value={formData.unidadMedida || ''}
                  onChange={(e) => setFormData({...formData, unidadMedida: e.target.value})}
                  placeholder="Ej: unidades, sets, metros"
                />
              </div>
            </div>
            <div className="md:col-span-2 space-y-4">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Especificaciones de Fabricación</label>
              <textarea 
                className="w-full bg-slate-50 border border-slate-100 rounded-3xl px-6 py-5 outline-none focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 transition-all font-bold text-xs uppercase tracking-widest text-bg-dark min-h-[100px]"
                value={formData.descripcion || ''}
                onChange={(e) => setFormData({...formData, descripcion: e.target.value})}
                placeholder="Indique brevemente cómo se fabrica o ensambla este producto..."
              />
            </div>
          </div>

          {/* INGREDIENTS SECTION */}
          <div className="space-y-6">
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-3">
                <Boxes size={18} className="text-amber-500" />
                <h3 className="text-sm font-black text-bg-dark uppercase tracking-widest">Insumos y Materia Prima</h3>
              </div>
              <button 
                type="button"
                onClick={handleAddIngrediente}
                className="flex items-center gap-2 px-4 py-2 bg-bg-dark text-white rounded-xl text-[9px] font-bold uppercase tracking-widest hover:bg-amber-500 transition-colors shadow-lg shadow-bg-dark/10"
              >
                <Plus size={14} /> Añadir Insumo
              </button>
            </div>

            <div className="space-y-4">
              {formData.ingredientes.map((ing, index) => (
                <div key={index} className="flex flex-col md:flex-row items-stretch md:items-center gap-4 bg-slate-50 p-6 rounded-3xl border border-slate-100 group/item relative">
                  <div className="flex-1 space-y-2">
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Insumo / Componente</label>
                    <select 
                      className="w-full bg-white border border-slate-100 rounded-xl px-4 py-3 text-xs font-bold outline-none focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 transition-all uppercase tracking-widest"
                      value={ing.articuloInventarioId}
                      onChange={(e) => handleIngredienteChange(index, 'articuloInventarioId', e.target.value)}
                    >
                      <option value={0}>Seleccionar Insumo...</option>
                      {articulos.map(art => (
                        <option key={art.id} value={art.id}>{art.nombre}</option>
                      ))}
                    </select>
                  </div>
                  <div className="w-full md:w-32 space-y-2">
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Cantidad</label>
                    <input 
                      type="number" 
                      min="0"
                      step="any"
                      className="w-full bg-white border border-slate-100 rounded-xl px-4 py-3 text-xs font-bold outline-none focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 transition-all"
                      value={ing.cantidadRequerida}
                      onChange={(e) => handleIngredienteChange(index, 'cantidadRequerida', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div className="w-full md:w-32 space-y-2">
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Unidad</label>
                    <input 
                      readOnly
                      type="text" 
                      className="w-full bg-slate-100/50 border border-slate-100 rounded-xl px-4 py-3 text-[10px] font-bold text-slate-400 outline-none uppercase tracking-widest"
                      value={ing.unidadMedida || ''}
                      placeholder="Auto"
                    />
                  </div>
                  <div className="flex items-end pb-1">
                    <button 
                      type="button"
                      onClick={() => handleRemoveIngrediente(index)}
                      className="w-12 h-12 flex items-center justify-center rounded-xl text-slate-300 hover:bg-rose-50 hover:text-rose-500 transition-all"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}

              {formData.ingredientes.length === 0 && (
                <div className="py-20 bg-slate-50/50 border-2 border-dashed border-slate-100 rounded-[2.5rem] flex flex-col items-center justify-center gap-4 text-slate-300">
                  <Boxes size={48} className="opacity-10" />
                  <p className="text-[9px] font-black uppercase tracking-[0.3em]">Sin insumos asignados al producto</p>
                </div>
              )}
            </div>
          </div>
        </form>

        {/* FOOTER */}
        <div className="p-10 border-t border-slate-50 flex items-center justify-end gap-6 bg-white shrink-0">
          <button 
            type="button"
            onClick={onClose}
            className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-bg-dark transition-colors"
          >
            Cancelar Operación
          </button>
          <button 
            onClick={handleSubmit}
            disabled={loading}
            className="bg-bg-dark text-white px-12 py-5 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-2xl shadow-bg-dark/20 hover:bg-amber-500 transition-all flex items-center gap-4 disabled:opacity-50 active:scale-95"
          >
            {loading ? <RefreshCw className="animate-spin" size={16} /> : <Wrench size={16} />}
            {producto ? 'Actualizar Producto' : 'Finalizar Fabricación'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductoModal;

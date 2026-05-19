import { useEffect, useState } from 'react';
import { X, Save, Package, Info, Hash, Truck, ToggleLeft, ToggleRight, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { inventarioService } from '../../../services/inventarioService';
import type { CreateArticuloCommand, Articulo } from '../../../services/inventarioService';
import { proveedoresService } from '../../../services/proveedoresService';
import type { Proveedor } from '../../../services/proveedoresService';
import ImageUpload from '../../../components/common/ImageUpload';
interface ArticuloModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  articulo?: Articulo | null;
}

const ArticuloModal = ({ isOpen, onClose, onSuccess, articulo }: ArticuloModalProps) => {
  const [loading, setLoading] = useState(false);
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [precioSinDefinir, setPrecioSinDefinir] = useState(false);
  const [formData, setFormData] = useState<CreateArticuloCommand>({
    nombre: '',
    descripcion: '',
    stockActual: 0,
    stockMinimo: 5,
    controlarStock: true,
    unidadMedida: 'Unidades',
    precioCosto: 0,
    proveedorId: undefined,
    imagenUrl: ''
  });

  useEffect(() => {
    if (articulo) {
      setFormData({
        nombre: articulo.nombre,
        descripcion: articulo.descripcion || '',
        stockActual: articulo.stockActual,
        stockMinimo: articulo.stockMinimo,
        controlarStock: articulo.controlarStock,
        unidadMedida: articulo.unidadMedida || 'Unidades',
        precioCosto: articulo.precioCosto,
        proveedorId: articulo.proveedorId,
        imagenUrl: articulo.imagenUrl || ''
      });
      setPrecioSinDefinir(articulo.precioCosto === 0);
    } else {
      setFormData({
        nombre: '',
        descripcion: '',
        stockActual: 0,
        stockMinimo: 5,
        controlarStock: true,
        unidadMedida: 'Unidades',
        precioCosto: 0,
        proveedorId: undefined,
        imagenUrl: ''
      });
      setPrecioSinDefinir(false);
    }
  }, [articulo, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const loadProveedores = async () => {
      try {
        const data = await proveedoresService.getProveedores();
        setProveedores(data);
      } catch (err) {
        console.error('Error al cargar proveedores', err);
      }
    };
    loadProveedores();
  }, [isOpen]);

  useEffect(() => {
    if (precioSinDefinir && !articulo) {
      setFormData((prev) => ({ ...prev, precioCosto: 0 }));
    }
  }, [precioSinDefinir, articulo]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (articulo) {
        await inventarioService.updateArticulo(articulo.id, formData);
        toast.success('Articulo actualizado correctamente');
      } else {
        await inventarioService.createArticulo(formData);
        toast.success('Articulo creado correctamente');
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Error al guardar artículo', err);
      toast.error(err.response?.data?.join?.(', ') || err.response?.data?.title || 'Error al guardar el artículo');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex justify-end animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-bg-dark/40 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-xl bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-500">
        <div className="flex items-center justify-between p-8 border-b border-slate-50 bg-white sticky top-0 z-10">
          <div className="space-y-1">
            <h2 className="text-2xl font-display font-bold text-bg-dark uppercase tracking-tight">
              {articulo ? 'Editar Artículo' : 'Nuevo Artículo'}
            </h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              {articulo ? 'Modifica los detalles del artículo' : 'Registra suministros o productos'}
            </p>
          </div>
          <button 
            onClick={onClose}
            className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-bg-dark hover:text-white transition-all"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar">
          <div className="space-y-10">
            {/* INFORMACIÓN BÁSICA */}
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <Package size={16} />
                </div>
                <h3 className="text-sm font-bold text-bg-dark uppercase tracking-widest">Información Básica</h3>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Nombre del Producto</label>
                  <input 
                    required
                    placeholder="Ej. Coca Cola 2.5L"
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm font-bold focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all"
                    value={formData.nombre}
                    onChange={e => setFormData({...formData, nombre: e.target.value})}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Descripción</label>
                  <textarea 
                    placeholder="Detalles adicionales sobre el artículo..."
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm font-bold focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all resize-none"
                    rows={3}
                    value={formData.descripcion}
                    onChange={e => setFormData({...formData, descripcion: e.target.value})}
                  />
                </div>
                
                <div className="pt-2">
                  <ImageUpload
                    value={formData.imagenUrl}
                    onChange={(url) => setFormData({ ...formData, imagenUrl: url })}
                    folder="inventario"
                    label="Imagen o Video del Artículo de Inventario"
                  />
                </div>
              </div>
            </div>

            {/* GESTIÓN DE STOCK */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-500 flex items-center justify-center">
                    <Hash size={16} />
                  </div>
                  <h3 className="text-sm font-bold text-bg-dark uppercase tracking-widest">Gestión de Stock</h3>
                </div>
                <button 
                  type="button"
                  onClick={() => setFormData({...formData, controlarStock: !formData.controlarStock})}
                  className="flex items-center gap-3 px-3 py-1.5 bg-slate-50 rounded-full group"
                >
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Stock Infinito</span>
                  {!formData.controlarStock ? <ToggleRight size={28} className="text-primary transition-colors" /> : <ToggleLeft size={28} className="text-slate-300 transition-colors" />}
                </button>
              </div>

              {formData.controlarStock ? (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Stock Actual</label>
                    <input 
                      type="number"
                      min="0"
                      step="any"
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm font-bold focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all"
                      value={formData.stockActual}
                      onChange={e => setFormData({...formData, stockActual: parseFloat(e.target.value) || 0})}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Stock Mínimo</label>
                    <input 
                      type="number"
                      min="0"
                      step="any"
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm font-bold focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all"
                      value={formData.stockMinimo}
                      onChange={e => setFormData({...formData, stockMinimo: parseFloat(e.target.value) || 0})}
                    />
                  </div>
                </div>
              ) : (
                <div className="p-6 bg-blue-50 border border-blue-100 rounded-3xl flex gap-4">
                  <Info size={20} className="text-blue-500 shrink-0" />
                  <p className="text-blue-700 text-xs font-bold leading-relaxed">Este artículo no tendrá límite de stock. Útil para servicios, consumibles ilimitados o activos fijos.</p>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Unidad de Medida</label>
                <select 
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm font-black uppercase tracking-widest outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all appearance-none cursor-pointer"
                  value={formData.unidadMedida}
                  onChange={e => setFormData({...formData, unidadMedida: e.target.value})}
                >
                  <option value="Unidades">Unidades</option>
                  <option value="Litros">Litros</option>
                  <option value="Kilos">Kilos</option>
                  <option value="Servicios">Servicios</option>
                </select>
              </div>
            </div>

            {/* COSTOS Y SUMINISTRO */}
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-500 flex items-center justify-center">
                  <Truck size={16} />
                </div>
                <h3 className="text-sm font-bold text-bg-dark uppercase tracking-widest">Costos y Suministro</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Precio Costo ($)</label>
                  <div className="relative group">
                    <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</div>
                    <input 
                      type="number"
                      min="0"
                      step="any"
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-10 pr-5 py-4 text-sm font-bold focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all disabled:opacity-50"
                      value={precioSinDefinir ? '' : formData.precioCosto}
                      onChange={e => setFormData({...formData, precioCosto: parseFloat(e.target.value) || 0})}
                      disabled={precioSinDefinir}
                      placeholder={precioSinDefinir ? 'Sin definir' : '0.00'}
                    />
                  </div>
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={precioSinDefinir}
                      onChange={(e) => setPrecioSinDefinir(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary"
                    />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover:text-bg-dark transition-colors">Precio sin definir</span>
                  </label>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Proveedor Principal</label>
                  <div className="relative group">
                    <Truck size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" />
                    <select 
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-12 pr-5 py-4 text-[10px] font-black uppercase tracking-widest outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all appearance-none cursor-pointer"
                      value={formData.proveedorId || ''}
                      onChange={e => setFormData({...formData, proveedorId: e.target.value ? parseInt(e.target.value) : undefined})}
                    >
                      <option value="">Sin Proveedor</option>
                      {proveedores
                        .filter(p => p.tipo === 0 || p.tipo === 2)
                        .map((p) => (
                          <option key={p.id} value={p.id}>{p.nombre}</option>
                        ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-8 bg-white border-t border-slate-50 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.05)] sticky bottom-0 z-10 flex items-center justify-end gap-4">
          <button 
            onClick={onClose}
            className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest hover:text-bg-dark transition-colors"
          >
            Cancelar
          </button>
          <button 
            onClick={handleSubmit} 
            disabled={loading}
            className="bg-primary text-white px-10 py-4 flex items-center justify-center gap-3 disabled:opacity-50 rounded-2xl shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            {loading ? <RefreshCw className="animate-spin" size={16} /> : <Save size={18} />}
            <span className="font-bold uppercase tracking-widest text-xs">
              {loading ? 'Guardando...' : articulo ? 'Actualizar Artículo' : 'Guardar Artículo'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ArticuloModal;

import { useEffect, useState } from 'react';
import { 
  X, 
  Save, 
  Zap, 
  FileText, 
  DollarSign, 
  Package, 
  RefreshCw,
  Wrench,
  Users,
  Warehouse,
  Hash
} from 'lucide-react';
import { paquetesService } from '../../../services/paquetesService';
import { inventarioService, type Articulo } from '../../../services/inventarioService';
import { produccionService, type ProductoProduccion } from '../../../services/produccionService';
import { proveedoresService, type Proveedor } from '../../../services/proveedoresService';
import type { CreateServicioCommand, Servicio } from '../../../services/paquetesService';
import { toast } from 'sonner';

interface ServicioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  servicio?: Servicio | null;
}

const ServicioModal = ({ isOpen, onClose, onSuccess, servicio }: ServicioModalProps) => {
  const [loading, setLoading] = useState(false);
  const [articulos, setArticulos] = useState<Articulo[]>([]);
  const [recetas, setRecetas] = useState<ProductoProduccion[]>([]);
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  
  const [formData, setFormData] = useState<CreateServicioCommand>({
    nombre: '',
    descripcion: '',
    costoBase: 0,
    precioProveedor: 0,
    esExtra: false,
    tipo: 2, // Default to ServicioTercero
    cantidadMinima: 1,
    articuloInventarioId: undefined,
    productoProduccionId: undefined,
    proveedorId: undefined
  });

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  useEffect(() => {
    if (servicio) {
      setFormData({
        nombre: servicio.nombre,
        descripcion: servicio.descripcion || '',
        costoBase: servicio.costoBase,
        precioProveedor: servicio.precioProveedor || 0,
        esExtra: servicio.esExtra,
        tipo: servicio.tipo,
        cantidadMinima: servicio.cantidadMinima,
        articuloInventarioId: servicio.articuloInventarioId,
        productoProduccionId: servicio.productoProduccionId,
        proveedorId: servicio.proveedorId
      });
    } else {
      setFormData({
        nombre: '',
        descripcion: '',
        costoBase: 0,
        precioProveedor: 0,
        esExtra: false,
        tipo: 2,
        cantidadMinima: 1,
        articuloInventarioId: undefined,
        productoProduccionId: undefined,
        proveedorId: undefined
      });
    }
  }, [servicio, isOpen]);

  const loadData = async () => {
    try {
      const [art, rec, prov] = await Promise.all([
        inventarioService.getArticulos(),
        produccionService.getProductos(),
        proveedoresService.getProveedores()
      ]);
      setArticulos(art);
      setRecetas(rec);
      setProveedores(prov);
    } catch (err) {
      console.error('Error al cargar datos auxiliares', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Auto-derive name ONLY for internal types
    let derivedNombre = formData.nombre;
    if (formData.tipo === 0) {
      derivedNombre = articulos.find(a => a.id === formData.articuloInventarioId)?.nombre || '';
    } else if (formData.tipo === 1) {
      derivedNombre = recetas.find(r => r.id === formData.productoProduccionId)?.nombre || '';
    }
    // For Third Party (tipo 2), we use the manual name provided in the input

    const command = { ...formData, nombre: derivedNombre };

    // Clean up IDs based on selected type before sending
    if (command.tipo === 0) { // ArticuloInventario
      command.productoProduccionId = undefined;
      command.proveedorId = undefined;
      command.precioProveedor = articulos.find(a => a.id === command.articuloInventarioId)?.precioCosto || 0;
    } else if (command.tipo === 1) { // ProductoProduccion
      command.articuloInventarioId = undefined;
      command.proveedorId = undefined;
      command.precioProveedor = 0; // Production cost calculation is complex, default to 0 for now
    } else { // ServicioTercero
      command.articuloInventarioId = undefined;
      command.productoProduccionId = undefined;
    }

    try {
      if (servicio) {
        await paquetesService.updateServicio(servicio.id, command);
        toast.success('Servicio actualizado con éxito');
      } else {
        await paquetesService.createServicio(command);
        toast.success('Servicio creado con éxito');
      }
      onSuccess();
      onClose();
    } catch (err) {
      console.error('Error al guardar servicio', err);
      toast.error('Error al guardar el servicio');
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
              {servicio ? 'Editar Servicio' : 'Nuevo Servicio'}
            </h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Configuración de catálogo maestro
            </p>
          </div>
          <button 
            onClick={onClose}
            className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-bg-dark hover:text-white transition-all"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar">
          
          {/* STEP 1: ORIGEN */}
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-500 flex items-center justify-center">
                <Warehouse size={16} />
              </div>
              <h3 className="text-sm font-bold text-bg-dark uppercase tracking-widest">1. Origen del Servicio</h3>
            </div>

            <div className="space-y-6">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">¿Cómo se respalda este servicio?</label>
                <div className="grid grid-cols-3 gap-2 bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
                  {[
                    { val: 0, label: 'Inventario', icon: Package, color: 'text-blue-500' },
                    { val: 1, label: 'Producción', icon: Wrench, color: 'text-amber-500' },
                    { val: 2, label: 'Tercero', icon: Users, color: 'text-emerald-500' }
                  ].map((t) => (
                    <button
                      key={t.val}
                      type="button"
                      onClick={() => setFormData({...formData, tipo: t.val})}
                      className={`flex flex-col items-center justify-center gap-2 py-3 rounded-xl transition-all border ${formData.tipo === t.val ? 'bg-white border-slate-200 shadow-sm' : 'border-transparent text-slate-400 opacity-60'}`}
                    >
                      <t.icon size={16} className={formData.tipo === t.val ? t.color : ''} />
                      <span className="text-[9px] font-black uppercase tracking-widest">{t.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                {formData.tipo === 0 && (
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Seleccionar Artículo</label>
                    <div className="relative">
                      <Package size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <select 
                        required
                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-12 pr-5 py-4 text-sm font-bold focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none appearance-none cursor-pointer text-bg-dark"
                        value={formData.articuloInventarioId || ''}
                        onChange={e => setFormData({...formData, articuloInventarioId: e.target.value ? parseInt(e.target.value) : undefined})}
                      >
                        <option value="">-- Seleccionar del Inventario --</option>
                        {articulos.map(a => <option key={a.id} value={a.id}>{a.nombre} (Stock: {a.stockActual})</option>)}
                      </select>
                    </div>
                  </div>
                )}
                {formData.tipo === 1 && (
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Seleccionar Producto</label>
                    <div className="relative">
                      <Wrench size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <select 
                        required
                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-12 pr-5 py-4 text-sm font-bold focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none appearance-none cursor-pointer text-bg-dark"
                        value={formData.productoProduccionId || ''}
                        onChange={e => setFormData({...formData, productoProduccionId: e.target.value ? parseInt(e.target.value) : undefined})}
                      >
                        <option value="">-- Seleccionar de Producción --</option>
                        {recetas.map(r => <option key={r.id} value={r.id}>{r.nombre}</option>)}
                      </select>
                    </div>
                  </div>
                )}
                {formData.tipo === 2 && (
                  <div className="space-y-6 animate-in slide-in-from-top-2 duration-300">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Nombre Específico del Servicio</label>
                      <input 
                        required
                        placeholder="Ej. Show de Magia, Decoración Premium"
                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm font-bold focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all text-bg-dark"
                        value={formData.nombre}
                        onChange={e => setFormData({...formData, nombre: e.target.value})}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Seleccionar Proveedor / Aliado</label>
                      <div className="relative">
                        <Users size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <select 
                          required
                          className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-12 pr-5 py-4 text-sm font-bold focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none appearance-none cursor-pointer text-bg-dark"
                          value={formData.proveedorId || ''}
                          onChange={e => setFormData({...formData, proveedorId: e.target.value ? parseInt(e.target.value) : undefined})}
                        >
                          <option value="">-- Seleccionar Aliado --</option>
                          {proveedores
                            .filter(p => p.tipo === 1 || p.tipo === 2)
                            .map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)
                          }
                        </select>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* STEP 2: FINANCIERO Y LOGÍSTICA */}
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-500 flex items-center justify-center">
                <DollarSign size={16} />
              </div>
              <h3 className="text-sm font-bold text-bg-dark uppercase tracking-widest">2. Configuración Comercial</h3>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Precio al Público ($)</label>
                  <div className="relative">
                    <DollarSign className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input 
                      type="number"
                      required
                      min="0"
                      step="any"
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-12 pr-5 py-4 text-sm font-bold focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all text-bg-dark"
                      value={formData.costoBase}
                      onChange={e => setFormData({...formData, costoBase: parseFloat(e.target.value) || 0})}
                    />
                  </div>
                </div>

                {formData.tipo === 2 && (
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-rose-400 uppercase tracking-widest ml-1">Costo Proveedor ($)</label>
                    <div className="relative">
                      <DollarSign className="absolute left-5 top-1/2 -translate-y-1/2 text-rose-300" size={16} />
                      <input 
                        type="number"
                        required
                        min="0"
                        step="any"
                        className="w-full bg-rose-50/30 border border-rose-100 rounded-2xl pl-12 pr-5 py-4 text-sm font-bold focus:ring-4 focus:ring-rose-500/10 focus:border-rose-300 outline-none transition-all text-bg-dark placeholder:text-rose-200"
                        value={formData.precioProveedor}
                        onChange={e => setFormData({...formData, precioProveedor: parseFloat(e.target.value) || 0})}
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                    Cantidad Mínima
                  </label>
                  <div className="relative">
                    <Hash className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input 
                      type="number"
                      min="0"
                      step="any"
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-12 pr-5 py-4 text-sm font-bold focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all text-bg-dark"
                      value={formData.cantidadMinima}
                      onChange={e => setFormData({...formData, cantidadMinima: parseFloat(e.target.value) || 0})}
                    />
                  </div>
                </div>
              </div>

              {formData.tipo === 2 && formData.costoBase > 0 && (
                <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center justify-between animate-in zoom-in duration-300">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white">
                      <Zap size={14} />
                    </div>
                    <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">Margen de Ganancia</span>
                  </div>
                  <span className="text-sm font-black text-emerald-600 italic">
                    +${(formData.costoBase - formData.precioProveedor).toLocaleString()} ({( ((formData.costoBase - formData.precioProveedor) / formData.costoBase) * 100).toFixed(1)}%)
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* STEP 3: DETALLES */}
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <FileText size={16} />
              </div>
              <h3 className="text-sm font-bold text-bg-dark uppercase tracking-widest">3. Detalles de Venta</h3>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Descripción del Servicio</label>
              <div className="relative">
                <FileText className="absolute left-5 top-5 text-slate-400" size={16} />
                <textarea 
                  placeholder="Ej: Incluye montaje, desarmado y transporte en zona urbana..."
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-12 pr-5 py-4 text-sm font-bold focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all min-h-[100px] resize-none text-bg-dark"
                  value={formData.descripcion}
                  onChange={e => setFormData({...formData, descripcion: e.target.value})}
                />
              </div>
            </div>
          </div>
        </form>

        <div className="p-8 bg-white border-t border-slate-50 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.05)] sticky bottom-0 z-10 flex items-center justify-end gap-4">
          <button 
            type="button"
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
              {loading ? 'Guardando...' : servicio ? 'Actualizar Servicio' : 'Publicar Servicio'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ServicioModal;

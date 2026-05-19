import { useState, useEffect, useMemo } from 'react';
import { X, Save, Zap, List, Plus, Search, RefreshCw, Info, ShoppingBag } from 'lucide-react';
import { toast } from 'sonner';
import { paquetesService } from '../../../services/paquetesService';
import type { CreatePaqueteCommand, Servicio } from '../../../services/paquetesService';
import ImageUpload from '../../../components/common/ImageUpload';

interface PaqueteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  onCreated?: (newId: number) => void;
}

const PaqueteModal = ({ isOpen, onClose, onSuccess, onCreated }: PaqueteModalProps) => {
  const [loading, setLoading] = useState(false);
  const [serviciosDisponibles, setServiciosDisponibles] = useState<Servicio[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState<CreatePaqueteCommand>({
    nombre: '',
    descripcion: '',
    precioBase: 0,
    descuento: 0,
    servicios: [],
    imagenUrl: ''
  });

  const pricing = useMemo(() => {
    let subtotal = 0;
    formData.servicios.forEach((item) => {
      const srv = serviciosDisponibles.find(s => s.id === item.servicioId);
      if (srv) {
        subtotal += srv.costoBase * item.cantidad;
      }
    });
    const total = Math.max(0, subtotal - formData.descuento);
    return { subtotal, total };
  }, [formData.servicios, formData.descuento, serviciosDisponibles]);

  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      precioBase: pricing.total
    }));
  }, [pricing.total]);

  useEffect(() => {
    if (isOpen) {
      loadServicios();
    }
  }, [isOpen]);

  const loadServicios = async () => {
    try {
      const data = await paquetesService.getServicios();
      setServiciosDisponibles(data);
    } catch (err) {
      console.error('Error al cargar servicios', err);
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.nombre) newErrors.nombre = 'El nombre es obligatorio';
    if (formData.servicios.length === 0) newErrors.servicios = 'Debes añadir al menos un servicio';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const toggleServicio = (id: number) => {
    setFormData(prev => {
      const existing = prev.servicios.find(s => s.servicioId === id);
      if (existing) {
        return { ...prev, servicios: prev.servicios.filter(s => s.servicioId !== id) };
      } else {
        return { ...prev, servicios: [...prev.servicios, { servicioId: id, cantidad: 1 }] };
      }
    });
  };

  const updateCantidad = (id: number, delta: number) => {
    setFormData(prev => ({
      ...prev,
      servicios: prev.servicios.map(s => 
        s.servicioId === id 
          ? { ...s, cantidad: Math.max(1, s.cantidad + delta) } 
          : s
      )
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      toast.error('Por favor, revisa los errores en el formulario');
      return;
    }
    setLoading(true);
    try {
      const newId = await paquetesService.createPaquete(formData);
      toast.success('Paquete creado con éxito');
      if (onCreated) {
        onCreated(newId);
      }
      onSuccess();
      onClose();
      setFormData({
        nombre: '',
        descripcion: '',
        precioBase: 0,
        descuento: 0,
        servicios: [],
        imagenUrl: ''
      });
      setErrors({});
    } catch (err) {
      console.error('Error al crear paquete', err);
      toast.error('Error al guardar el paquete');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const filteredServicios = serviciosDisponibles.filter(s => 
    s.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex justify-end animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-bg-dark/40 backdrop-blur-md" onClick={onClose} />
      
      <div className="relative w-full max-w-2xl bg-white h-full shadow-[0_0_100px_rgba(0,0,0,0.3)] flex flex-col animate-in slide-in-from-right duration-500 rounded-l-[4rem] overflow-hidden">
        {/* HEADER */}
        <div className="flex items-center justify-between p-12 border-b border-slate-50 bg-white sticky top-0 z-10">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-bg-dark">
                <Zap size={16} />
              </div>
              <p className="text-primary font-black uppercase text-[10px] tracking-[0.3em] italic">Ingeniería de Experiencias</p>
            </div>
            <h2 className="text-4xl font-display font-black text-bg-dark uppercase tracking-tight italic leading-none">Nuevo Paquete</h2>
          </div>
          <button 
            onClick={onClose}
            className="w-16 h-16 rounded-[1.5rem] bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-bg-dark hover:text-white transition-all shadow-sm active:scale-90"
          >
            <X size={28} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-12 space-y-12 custom-scrollbar pb-32">
          {/* NOMBRE Y DESCRIPCIÓN */}
          <div className="space-y-8">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-1">Identidad del Paquete</label>
              <input 
                required
                placeholder="EJ. CUMPLEAÑOS ÉPICO PREMIUM"
                className={`w-full bg-slate-50 border rounded-[2rem] px-8 py-6 text-lg font-black outline-none transition-all uppercase italic tracking-tighter ${errors.nombre ? 'border-rose-500 ring-8 ring-rose-500/5' : 'border-slate-100 focus:ring-8 focus:ring-primary/5 focus:border-primary'}`}
                value={formData.nombre}
                onChange={e => setFormData({...formData, nombre: e.target.value})}
              />
              {errors.nombre && <span className="text-[10px] font-bold text-rose-500 uppercase tracking-widest ml-1">{errors.nombre}</span>}
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-1">Descripción Estratégica</label>
              <textarea 
                placeholder="Define la propuesta de valor de este paquete..."
                className="w-full bg-slate-50 border border-slate-100 rounded-[2rem] px-8 py-6 text-sm font-bold outline-none focus:ring-8 focus:ring-primary/5 focus:border-primary transition-all min-h-[120px] resize-none"
                value={formData.descripcion}
                onChange={e => setFormData({...formData, descripcion: e.target.value})}
              />
            </div>

            <div className="pt-2">
              <ImageUpload
                value={formData.imagenUrl}
                onChange={(url) => setFormData({ ...formData, imagenUrl: url })}
                folder="paquetes"
                label="Imagen o Video de Referencia del Paquete"
              />
            </div>
          </div>

          {/* MATRIZ DE SERVICIOS - SELECCIÓN DIRECTA */}
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-bg-dark text-white flex items-center justify-center shadow-lg shadow-bg-dark/10">
                  <List size={20} />
                </div>
                <div className="flex flex-col">
                  <h3 className="text-xl font-black text-bg-dark uppercase tracking-tight italic">Matriz de Servicios</h3>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Selecciona los componentes y cantidades</p>
                </div>
              </div>
              <div className="relative w-64 group">
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" />
                <input 
                  type="text"
                  placeholder="BUSCAR..."
                  className="w-full bg-slate-50 border border-slate-100 rounded-xl pl-10 pr-4 py-3 text-[10px] font-black uppercase outline-none focus:border-primary transition-all"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 max-h-[400px] overflow-y-auto pr-4 custom-scrollbar">
              {filteredServicios.map(s => {
                const serviceConfig = formData.servicios.find(item => item.servicioId === s.id);
                const isSelected = !!serviceConfig;
                
                return (
                  <div
                    key={s.id}
                    className={`flex items-center justify-between p-6 rounded-[2rem] border-2 transition-all duration-300 text-left group relative ${
                      isSelected 
                        ? 'bg-primary/5 border-primary shadow-lg shadow-primary/5' 
                        : 'bg-white border-slate-50 hover:border-slate-200'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => toggleServicio(s.id)}
                      className="flex items-center gap-5 flex-1"
                    >
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${
                        isSelected ? 'bg-primary text-bg-dark' : 'bg-slate-50 text-slate-300 group-hover:bg-slate-100'
                      }`}>
                        {isSelected ? <Plus size={20} className="rotate-45" /> : <Plus size={20} />}
                      </div>
                      <div className="flex flex-col">
                        <span className={`text-sm font-black uppercase italic tracking-tight ${isSelected ? 'text-bg-dark' : 'text-slate-500'}`}>
                          {s.nombre}
                        </span>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                          ${s.costoBase.toLocaleString()} por unidad
                        </span>
                      </div>
                    </button>

                    {isSelected && (
                      <div className="flex items-center gap-4 bg-white/50 backdrop-blur-sm p-2 rounded-2xl border border-primary/20 animate-in zoom-in duration-300">
                        <button 
                          type="button"
                          onClick={() => updateCantidad(s.id, -1)}
                          className="w-8 h-8 flex items-center justify-center text-bg-dark hover:bg-primary rounded-lg transition-colors font-black"
                        >
                          -
                        </button>
                        <span className="text-sm font-black italic min-w-[20px] text-center">{serviceConfig.cantidad}</span>
                        <button 
                          type="button"
                          onClick={() => updateCantidad(s.id, 1)}
                          className="w-8 h-8 flex items-center justify-center text-bg-dark hover:bg-primary rounded-lg transition-colors font-black"
                        >
                          +
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
              {filteredServicios.length === 0 && (
                <div className="py-12 bg-slate-50 border-2 border-dashed border-slate-100 rounded-[2.5rem] flex flex-col items-center justify-center text-slate-300 italic text-xs font-bold">
                  No se encontraron servicios compatibles.
                </div>
              )}
            </div>
            {errors.servicios && <span className="text-[10px] font-bold text-rose-500 uppercase tracking-widest ml-1">{errors.servicios}</span>}
          </div>

          {/* ARQUITECTURA FINANCIERA */}
          <div className="space-y-8 bg-bg-dark p-10 rounded-[3rem] shadow-2xl border border-white/5 relative overflow-hidden group/finance">
            <div className="absolute top-0 right-0 p-10 opacity-5 group-hover/finance:rotate-12 transition-transform duration-700">
              <Zap size={120} />
            </div>
            
            <div className="flex items-center gap-4 text-white mb-8 relative z-10">
              <div className="w-10 h-10 bg-primary/20 text-primary rounded-xl flex items-center justify-center">
                <Info size={20} />
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.3em] italic">Arquitectura Financiera</span>
            </div>

            <div className="grid grid-cols-2 gap-8 relative z-10">
              <div className="space-y-3">
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] ml-1 text-center block">Subtotal Servicios</label>
                <div className="bg-white/5 border border-white/10 rounded-[1.5rem] px-6 py-5 text-2xl font-black text-white italic tracking-tighter text-center">
                  <span className="text-xs text-slate-500 mr-2">$</span>
                  {pricing.subtotal.toLocaleString()}
                </div>
              </div>
              <div className="space-y-3">
                <label className="text-[9px] font-black text-primary uppercase tracking-[0.3em] ml-1 text-center block">Descuento del Plan</label>
                <div className="relative group">
                  <span className="absolute left-6 top-1/2 -translate-y-1/2 text-primary font-black italic">$</span>
                  <input 
                    type="number"
                    min="0"
                    placeholder="0"
                    className="w-full bg-primary/10 border border-primary/20 rounded-[1.5rem] pl-10 pr-6 py-5 text-2xl font-black text-primary italic tracking-tighter text-center outline-none focus:ring-4 focus:ring-primary/20 transition-all placeholder:text-primary/30"
                    value={formData.descuento || ''}
                    onChange={e => setFormData({...formData, descuento: parseFloat(e.target.value) || 0})}
                  />
                </div>
              </div>
            </div>

            <div className="pt-8 border-t border-white/5 mt-8 relative z-10">
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] italic mb-1">Precio Final de Venta</span>
                  <div className="flex items-baseline gap-3">
                    <span className="text-5xl font-display font-black text-white italic tracking-tight">
                      <span className="text-xl text-primary mr-2 italic">$</span>
                      {pricing.total.toLocaleString()}
                    </span>
                    <span className="text-[10px] font-black text-primary bg-primary/10 px-3 py-1 rounded-full uppercase tracking-widest italic">
                      Listo para Catálogo
                    </span>
                  </div>
                </div>
                <div className="w-16 h-16 bg-primary rounded-[1.5rem] flex items-center justify-center text-bg-dark shadow-xl shadow-primary/20">
                  <ShoppingBag size={28} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div className="p-12 border-t border-slate-100 flex items-center justify-between bg-white sticky bottom-0 z-10 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.05)]">
          <button 
            onClick={onClose}
            className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] hover:text-bg-dark transition-colors px-6"
          >
            Descartar Diseño
          </button>
          <button 
            onClick={handleSubmit} 
            disabled={loading}
            className="btn-primary-glow px-16 py-6 group/btn shadow-2xl active:scale-95 disabled:opacity-50"
          >
            <div className="flex items-center gap-4">
              {loading ? <RefreshCw className="animate-spin text-bg-dark" size={20} /> : <Save className="text-bg-dark" size={20} />}
              <span className="font-black uppercase tracking-[0.2em] text-[10px] text-bg-dark">
                {loading ? 'Publicando...' : 'Publicar en Catálogo'}
              </span>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaqueteModal;

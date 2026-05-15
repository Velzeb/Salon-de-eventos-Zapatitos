import { useEffect, useState } from 'react';
import { X, Save, User, Phone, Mail, MapPin, Tag, RefreshCw, Truck, Zap, ShieldCheck } from 'lucide-react';
import { proveedoresService } from '../../../services/proveedoresService';
import type { CreateProveedorCommand, Proveedor } from '../../../services/proveedoresService';
import { toast } from 'sonner';

interface ProveedorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  proveedor?: Proveedor | null;
}

const ProveedorModal = ({ isOpen, onClose, onSuccess, proveedor }: ProveedorModalProps) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CreateProveedorCommand>({
    nombre: '',
    contactoNombre: '',
    telefono: '',
    email: '',
    direccion: '',
    tipo: 0
  });

  useEffect(() => {
    if (proveedor) {
      setFormData({
        nombre: proveedor.nombre,
        contactoNombre: proveedor.contactoNombre || '',
        telefono: proveedor.telefono || '',
        email: proveedor.email || '',
        direccion: '', 
        tipo: proveedor.tipo
      });
    } else {
      setFormData({
        nombre: '',
        contactoNombre: '',
        telefono: '',
        email: '',
        direccion: '',
        tipo: 0
      });
    }
  }, [proveedor, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (proveedor) {
        await proveedoresService.updateProveedor(proveedor.id, formData);
        toast.success('Proveedor actualizado con éxito');
      } else {
        await proveedoresService.createProveedor(formData);
        toast.success('Proveedor registrado con éxito');
      }
      onSuccess();
      onClose();
    } catch (err) {
      console.error('Error al guardar proveedor', err);
      toast.error('Error al guardar el proveedor');
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
              {proveedor ? 'Editar Proveedor' : 'Nuevo Proveedor'}
            </h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              {proveedor ? 'Actualiza la información del aliado' : 'Registra un nuevo aliado comercial'}
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
          <div className="space-y-10">
            {/* IDENTIDAD */}
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <Tag size={16} />
                </div>
                <h3 className="text-sm font-bold text-bg-dark uppercase tracking-widest">Identidad Comercial</h3>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Razón Social / Nombre</label>
                  <input 
                    required
                    placeholder="Ej. Distribuidora del Valle"
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm font-bold focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all"
                    value={formData.nombre}
                    onChange={e => setFormData({...formData, nombre: e.target.value})}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Tipo de Aliado</label>
                  <div className="flex bg-slate-50 p-1.5 rounded-[2rem] border border-slate-100">
                    {[
                      { id: 0, label: 'Suministros', icon: Truck, color: 'primary' },
                      { id: 1, label: 'Servicios', icon: Zap, color: 'emerald' },
                      { id: 2, label: 'General', icon: ShieldCheck, color: 'amber' }
                    ].map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setFormData({...formData, tipo: t.id})}
                        className={`
                          flex-1 flex items-center justify-center gap-3 py-3 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all
                          ${formData.tipo === t.id 
                            ? `bg-white text-${t.color}-500 shadow-sm border border-slate-100` 
                            : 'text-slate-400 hover:text-slate-600'}
                        `}
                      >
                        <t.icon size={14} />
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* CONTACTO */}
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-500 flex items-center justify-center">
                  <User size={16} />
                </div>
                <h3 className="text-sm font-bold text-bg-dark uppercase tracking-widest">Punto de Contacto</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Nombre del Contacto</label>
                  <div className="relative">
                    <User className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input 
                      placeholder="Ej. Juan Pérez"
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-12 pr-5 py-4 text-sm font-bold focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all"
                      value={formData.contactoNombre}
                      onChange={e => setFormData({...formData, contactoNombre: e.target.value})}
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Teléfono</label>
                  <div className="relative">
                    <Phone className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input 
                      placeholder="+591 ..."
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-12 pr-5 py-4 text-sm font-bold focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all"
                      value={formData.telefono}
                      onChange={e => setFormData({...formData, telefono: e.target.value})}
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input 
                      type="email"
                      placeholder="proveedor@empresa.com"
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-12 pr-5 py-4 text-sm font-bold focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all"
                      value={formData.email}
                      onChange={e => setFormData({...formData, email: e.target.value})}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* UBICACIÓN */}
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-500 flex items-center justify-center">
                  <MapPin size={16} />
                </div>
                <h3 className="text-sm font-bold text-bg-dark uppercase tracking-widest">Ubicación Física</h3>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Dirección Completa</label>
                <textarea 
                  placeholder="Calle, Número, Ciudad..."
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm font-bold focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all resize-none"
                  rows={3}
                  value={formData.direccion}
                  onChange={e => setFormData({...formData, direccion: e.target.value})}
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
              {loading ? 'Guardando...' : proveedor ? 'Actualizar Aliado' : 'Registrar Aliado'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProveedorModal;

import { useEffect, useState } from 'react';
import { X, Save, ArrowRightLeft, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { inventarioService } from '../../../services/inventarioService';
import type { Articulo } from '../../../services/inventarioService';


interface StockAdjustModalProps {
  isOpen: boolean;
  articulos: Articulo[];
  onClose: () => void;
  onSuccess: () => void;
}

const StockAdjustModal = ({ isOpen, articulos, onClose, onSuccess }: StockAdjustModalProps) => {
  const [loading, setLoading] = useState(false);
  const [articuloId, setArticuloId] = useState<number | ''>('');
  const [delta, setDelta] = useState<number>(0);

  useEffect(() => {
    if (!isOpen) {
      setArticuloId('');
      setDelta(0);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!articuloId || delta === 0) return;

    setLoading(true);
    try {
      await inventarioService.adjustStock(articuloId, delta);
      toast.success('Stock ajustado correctamente');
      onSuccess();
      onClose();
    } catch (err) {
      console.error('Error al ajustar stock', err);
      toast.error('Error al ajustar el stock.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const selected = articulos.find(a => a.id === articuloId);

  return (
    <div className="fixed inset-0 z-50 flex justify-end animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-bg-dark/40 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-xl bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-500">
        <div className="flex items-center justify-between p-8 border-b border-slate-100 bg-white sticky top-0 z-10">
          <div className="space-y-1">
            <h2 className="text-2xl font-display font-black text-bg-dark uppercase tracking-tight italic">Ajuste de Stock</h2>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Corrige movimientos o inventario físico</p>
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
            {/* SELECCIÓN DE ARTÍCULO */}
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-500 flex items-center justify-center">
                  <ArrowRightLeft size={16} />
                </div>
                <h3 className="text-sm font-black text-bg-dark uppercase tracking-widest">Artículo</h3>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Selecciona artículo</label>
                  <select
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm font-black uppercase tracking-widest outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all appearance-none cursor-pointer"
                    value={articuloId}
                    onChange={(e) => setArticuloId(e.target.value ? parseInt(e.target.value) : '')}
                    required
                  >
                    <option value="">-- Seleccionar --</option>
                    {articulos.map((a) => (
                      <option key={a.id} value={a.id}>{a.nombre}</option>
                    ))}
                  </select>
                </div>

                {selected && (
                  <div className="p-6 bg-slate-50 border border-slate-100 rounded-3xl flex items-center justify-between">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Stock Actual:</span>
                    <span className="text-sm font-black text-bg-dark">
                      {selected.controlarStock ? selected.stockActual : 'Ilimitado'} {selected.unidadMedida}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* MOVIMIENTO */}
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-500 flex items-center justify-center">
                  <ArrowRightLeft size={16} />
                </div>
                <h3 className="text-sm font-black text-bg-dark uppercase tracking-widest">Movimiento de Stock</h3>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Cantidad a ajustar</label>
                  <input
                    type="number"
                    placeholder="Ej. 10 para sumar, -5 para restar"
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm font-bold focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all"
                    value={delta === 0 ? '' : delta}
                    onChange={(e) => setDelta(parseInt(e.target.value) || 0)}
                  />
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-3 ml-1 italic">
                    Usa valores negativos para restar existencias.
                  </p>
                </div>

                {selected && selected.controlarStock && (
                  <div className="p-8 bg-bg-dark rounded-[2.5rem] shadow-xl border border-slate-800 flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">Stock Resultante</span>
                      <span className="text-2xl font-black text-primary italic tracking-tighter">
                        {selected.stockActual + delta} {selected.unidadMedida}
                      </span>
                    </div>
                    <ArrowRightLeft size={24} className="text-white/10" />
                  </div>
                )}
              </div>
            </div>
          </div>
        </form>

        <div className="p-8 bg-white border-t border-slate-100 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.05)] sticky bottom-0 z-10 flex items-center justify-end gap-4">
          <button 
            onClick={onClose}
            className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-bg-dark transition-colors"
          >
            Cancelar
          </button>
          <button 
            onClick={handleSubmit} 
            disabled={loading || !articuloId || delta === 0}
            className="btn-primary-glow px-10 py-4 flex items-center justify-center gap-3 disabled:opacity-50 min-w-[200px]"
          >
            {loading ? <RefreshCw className="animate-spin" size={16} /> : <Save size={18} />}
            <span className="font-black uppercase tracking-widest text-xs">{loading ? 'Procesando...' : 'Aplicar Ajuste'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default StockAdjustModal;

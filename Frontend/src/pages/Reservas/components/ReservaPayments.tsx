import { useState, useEffect } from 'react';
import { X, Plus, Receipt } from 'lucide-react';
import { finanzasService } from '../../../services/finanzasService';
import type { Pago, MetodoPago } from '../../../services/finanzasService';
import { toast } from 'sonner';

interface ReservaPaymentsProps {
  isOpen: boolean;
  onClose: () => void;
  eventoId: number;
  totalPrice: number;
  saldoPendiente: number;
  onSuccess: () => void;
}

const ReservaPayments = ({ isOpen, onClose, eventoId, totalPrice, saldoPendiente, onSuccess }: ReservaPaymentsProps) => {
  const [pagos, setPagos] = useState<Pago[]>([]);
  const [metodos, setMetodos] = useState<MetodoPago[]>([]);
  const [loading, setLoading] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  const [newPago, setNewPago] = useState({
    monto: saldoPendiente,
    metodoPagoId: '',
    referencia: ''
  });

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen, eventoId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [allPagos, allMetodos] = await Promise.all([
        finanzasService.getPagos(),
        finanzasService.getMetodosPago()
      ]);
      setPagos(allPagos.filter((p: Pago) => p.eventoId === eventoId));
      setMetodos(allMetodos.filter((m: MetodoPago) => m.activo));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleAddPago = async () => {
    if (!newPago.monto || newPago.monto <= 0) {
      toast.error('El monto debe ser mayor a cero');
      return;
    }
    setLoading(true);
    try {
      await finanzasService.registerPago({
        eventoId,
        monto: newPago.monto,
        metodoPagoId: newPago.metodoPagoId ? parseInt(newPago.metodoPagoId) : undefined,
        referencia: newPago.referencia
      });
      toast.success('Pago registrado correctamente');
      setIsAdding(false);
      onSuccess();
      loadData();
    } catch (e) {
      toast.error('Error al registrar el pago');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyPago = async (pagoId: number, isAccepted: boolean) => {
    setLoading(true);
    try {
      await finanzasService.verifyPago(pagoId, isAccepted);
      toast.success(isAccepted ? 'Pago verificado correctamente' : 'Pago rechazado');
      onSuccess();
      loadData();
    } catch (e) {
      toast.error('Error al verificar el pago');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex justify-end">
      {/* OVERLAY */}
      <div 
        className="absolute inset-0 bg-bg-dark/60 backdrop-blur-sm animate-in fade-in duration-500"
        onClick={onClose}
      />
      
      {/* PANEL */}
      <div className="relative w-full max-w-xl bg-white h-screen shadow-2xl flex flex-col animate-in slide-in-from-right duration-500 ease-out border-l border-slate-100">
        <div className="flex items-center justify-between p-10 border-b border-slate-50">
          <div className="space-y-1">
            <h2 className="text-2xl font-display font-bold text-bg-dark uppercase tracking-tight">
              Gestión de <span className="text-primary opacity-70">Pagos</span>
            </h2>
            <div className="flex items-center gap-2 text-xs font-bold text-slate-400 ">
              <Receipt size={14} className="text-primary" />
              <span>Reserva #{eventoId}</span>
            </div>
          </div>
          <button 
            className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center hover:bg-bg-dark hover:text-white transition-all active:scale-90 shadow-sm"
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-10 space-y-10">
          {/* SUMMARY CARDS */}
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
              <span className="text-xs font-bold text-slate-400 ">Total Evento</span>
              <div className="text-xl font-bold text-bg-dark mt-1">${totalPrice.toLocaleString()}</div>
            </div>
            <div className="bg-primary/5 rounded-2xl p-6 border border-primary/10">
              <span className="text-xs font-bold text-primary ">Saldo Pendiente</span>
              <div className="text-xl font-bold text-primary mt-1">${saldoPendiente.toLocaleString()}</div>
            </div>
          </div>

          {/* ADD PAYMENT SECTION */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-bg-dark ">Registro de Abonos</h3>
              {!isAdding && saldoPendiente > 0 && (
                <button 
                  className="flex items-center gap-2 bg-bg-dark text-white px-5 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider hover:bg-primary transition-all shadow-lg active:scale-95"
                  onClick={() => setIsAdding(true)}
                >
                  <Plus size={14} /> Nuevo Abono
                </button>
              )}
            </div>

            {isAdding && (
              <div className="bg-white border border-slate-100 rounded-2xl p-8 shadow-xl animate-in zoom-in-95 duration-300">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400  ml-1">Monto del Pago</label>
                    <div className="relative">
                      <span className="absolute left-6 top-1/2 -translate-y-1/2 text-primary font-bold">$</span>
                      <input 
                        type="number"
                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-12 pr-6 py-4 outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all font-bold text-lg"
                        value={newPago.monto}
                        onChange={e => setNewPago(p => ({ ...p, monto: parseFloat(e.target.value) }))}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1">Método de Selección</label>
                    <select 
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all font-bold text-sm"
                      value={newPago.metodoPagoId}
                      onChange={e => setNewPago(p => ({ ...p, metodoPagoId: e.target.value }))}
                    >
                      <option value="">-- Seleccionar --</option>
                      {metodos.map(m => (
                        <option key={m.id} value={m.id}>{m.nombre}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1">Referencia / Notas</label>
                    <input 
                      type="text"
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all font-bold text-sm"
                      placeholder="Ej: Transferencia Bancaria, Seña Efectivo..."
                      value={newPago.referencia}
                      onChange={e => setNewPago(p => ({ ...p, referencia: e.target.value }))}
                    />
                  </div>

                  <div className="flex gap-4 pt-4">
                    <button 
                      className="flex-1 px-8 py-4 rounded-2xl border border-slate-100 text-xs font-semibold uppercase tracking-wider text-slate-400 hover:bg-slate-50 transition-all active:scale-95"
                      onClick={() => setIsAdding(false)}
                    >
                      Cancelar
                    </button>
                    <button 
                      className="flex-[2] bg-primary text-white py-4 rounded-2xl shadow-lg shadow-primary/20 font-bold  text-xs hover:scale-[1.02] active:scale-[0.98] transition-all"
                      onClick={handleAddPago}
                      disabled={loading}
                    >
                      {loading ? 'Procesando...' : 'Confirmar Abono'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* HISTORY SECTION */}
          <div className="space-y-6 pb-10">
            <h3 className="text-xs font-bold text-bg-dark ">Historial de Transacciones</h3>
            
            <div className="space-y-4">
              {pagos.map(p => (
                <div key={p.id} className="flex flex-col p-6 bg-white border border-slate-100 rounded-xl hover:bg-slate-50 transition-all hover:translate-x-1 gap-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm ${p.estado === 'Pendiente' ? 'bg-amber-50 text-amber-500' : p.estado === 'Rechazado' ? 'bg-rose-50 text-rose-500' : 'bg-emerald-50 text-emerald-500'}`}>
                        <Receipt size={18} />
                      </div>
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-400  leading-none">
                            {new Date(p.fechaPago).toLocaleDateString()}
                          </span>
                          <span className={`text-xs px-2 py-0.5 rounded-full uppercase font-bold ${p.estado === 'Pendiente' ? 'bg-amber-100 text-amber-700' : p.estado === 'Rechazado' ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`}>
                            {p.estado}
                          </span>
                        </div>
                        <span className="text-sm font-bold text-bg-dark uppercase tracking-tight mt-1">{p.metodoPago || 'Efectivo/Transferencia'}</span>
                        {p.referencia && <span className="text-xs font-medium text-slate-400 mt-0.5">{p.referencia}</span>}
                      </div>
                    </div>
                    <div className="text-lg font-bold text-bg-dark group-hover:text-primary transition-colors">
                      +${p.monto.toLocaleString()}
                    </div>
                  </div>

                  {p.estado === 'Pendiente' && p.comprobanteUrl && (
                    <div className="pt-4 mt-2 border-t border-slate-100 flex flex-col gap-4">
                      <div className="flex gap-4 items-start">
                        <div className="flex-1 space-y-2">
                          <p className="text-xs font-bold text-slate-500 ">Comprobante Adjunto</p>
                          <img src={p.comprobanteUrl} alt="Comprobante de pago" className="max-w-[200px] rounded-lg border border-slate-200" />
                        </div>
                        <div className="flex flex-col gap-2 shrink-0">
                          <button 
                            onClick={() => handleVerifyPago(p.id, true)}
                            disabled={loading}
                            className="bg-emerald-500 text-white text-xs font-bold  px-4 py-2 rounded-lg hover:bg-emerald-600 transition-colors"
                          >
                            Aprobar Pago
                          </button>
                          <button 
                            onClick={() => handleVerifyPago(p.id, false)}
                            disabled={loading}
                            className="bg-rose-50 text-rose-600 text-xs font-bold  px-4 py-2 rounded-lg hover:bg-rose-100 transition-colors border border-rose-200"
                          >
                            Rechazar
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              
              {pagos.length === 0 && (
                <div className="py-20 flex flex-col items-center justify-center space-y-4 bg-slate-50 rounded-2xl border border-slate-100 border-dashed">
                  <Receipt size={48} className="text-slate-200" />
                  <p className="text-xs font-bold text-slate-400 ">No hay pagos registrados</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReservaPayments;





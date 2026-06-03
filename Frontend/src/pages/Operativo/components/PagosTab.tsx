import { RefreshCw, CheckCircle2, Plus, CreditCard, DollarSign, History } from 'lucide-react';
import type { EventoOperativo } from '../../../services/operativoService';

interface Props {
  data: EventoOperativo;
  metodosPago: any[];
  registeringPago: boolean;
  verifyingPago: number | null;
  pagoManual: { monto: number; metodoPagoId?: number; referencia: string };
  onPagoManualChange: (v: { monto: number; metodoPagoId?: number; referencia: string }) => void;
  onRegisterPago: (e: React.FormEvent) => Promise<void>;
  onVerificarPago: (pagoId: number) => void;
}

export default function PagosTab({
  data, metodosPago, registeringPago, verifyingPago, pagoManual,
  onPagoManualChange, onRegisterPago, onVerificarPago
}: Props) {
  const totalPagado = data.precioTotal - data.saldoPendiente;
  const porcentajePagado = data.precioTotal > 0 ? (totalPagado / data.precioTotal) * 100 : 0;
  const pagosConfirmados = data.pagos.filter(p => p.estado === 'Completado' || p.estado === 'Verificado');
  const pagosPendientes = data.pagos.filter(p => p.estado === 'Pendiente');

  return (
    <div className="grid grid-cols-1 gap-6 font-sans">
      <div className="space-y-6">
        {/* Resumen Financiero */}
        <section className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50">
            <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
              <DollarSign size={16} className="text-indigo-500" /> Resumen Financiero
            </h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-6">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Costo Total</p>
                <p className="text-2xl font-bold text-slate-900">${data.precioTotal.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Abonado</p>
                <p className="text-2xl font-bold text-emerald-600">${totalPagado.toLocaleString()}</p>
              </div>
              <div className="sm:border-l sm:border-slate-200 sm:pl-6">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Por Cobrar</p>
                <p className="text-2xl font-bold text-rose-600">${data.saldoPendiente.toLocaleString()}</p>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-slate-500">Progreso de pagos</span>
                <span className="text-slate-700">{Math.round(porcentajePagado)}%</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className={`h-full transition-all ${porcentajePagado === 100 ? 'bg-emerald-500' : 'bg-indigo-500'}`} style={{ width: `${porcentajePagado}%` }} />
              </div>
              {data.saldoPendiente === 0 && (
                <p className="text-xs font-semibold text-emerald-600 flex items-center gap-1.5 mt-2">
                  <CheckCircle2 size={14} /> Evento liquidado al 100%
                </p>
              )}
            </div>
          </div>
        </section>

        {/* Historial de Pagos */}
        <section className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
              <History size={16} className="text-slate-400" /> Historial de Abonos
            </h3>
            <span className="text-xs font-medium bg-white border border-slate-200 px-2 py-0.5 rounded text-slate-500">
              {data.pagos.length} registros
            </span>
          </div>
          
          <div className="divide-y divide-slate-100">
            {pagosPendientes.length > 0 && (
              <div className="bg-amber-50/30 p-4 border-b border-slate-100">
                <p className="text-[10px] font-bold text-amber-600 uppercase tracking-widest mb-3">Pendientes de verificación</p>
                <div className="space-y-3">
                  {pagosPendientes.map(pago => (
                    <div key={pago.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-white rounded border border-amber-200 shadow-sm">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-bold text-slate-900">${pago.monto.toLocaleString()}</p>
                          <span className="text-[9px] font-bold uppercase tracking-wider text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-100">Por verificar</span>
                        </div>
                        <p className="text-xs text-slate-500">Efectivo · Ref: {pago.referencia || 'N/A'}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">{new Date(pago.fechaPago).toLocaleString()}</p>
                      </div>
                      <button onClick={() => onVerificarPago(pago.id)} disabled={verifyingPago === pago.id} className="bg-indigo-600 text-white px-4 py-2 rounded text-xs font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-sm">
                        {verifyingPago === pago.id ? 'Verificando...' : 'Confirmar Recepción'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {pagosConfirmados.length > 0 ? (
              <div className="p-4 space-y-3">
                {pagosConfirmados.map((pago, i) => (
                  <div key={pago.id} className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-lg transition-colors border border-transparent hover:border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
                        <CheckCircle2 size={16} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900">Abono {pagosConfirmados.length - i}</p>
                        <p className="text-xs text-slate-500">Efectivo {pago.referencia && `· ${pago.referencia}`}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-emerald-600">+${pago.monto.toLocaleString()}</p>
                      <p className="text-[10px] text-slate-400">{new Date(pago.fechaPago).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center">
                <CreditCard size={24} className="mx-auto text-slate-300 mb-2" />
                <p className="text-sm text-slate-500">No hay pagos confirmados registrados.</p>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Registrar Abono Form */}
      <div>
        <section className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm sticky top-24">
          <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50">
            <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
              <Plus size={16} className="text-indigo-500" /> Registrar Abono Manual
            </h3>
          </div>
          
          <div className="p-5">
            {data.saldoPendiente > 0 ? (
              <form onSubmit={onRegisterPago} className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1.5">Monto del abono</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                    <input
                      type="number"
                      step="0.01"
                      className="w-full bg-white border border-slate-200 rounded-lg pl-8 pr-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-100 transition-all font-semibold"
                      value={pagoManual.monto || ''}
                      onChange={e => onPagoManualChange({ ...pagoManual, monto: parseFloat(e.target.value) || 0 })}
                      max={data.saldoPendiente}
                    />
                  </div>
                  <div className="flex justify-between items-center mt-1.5">
                    <p className="text-[10px] text-slate-400">Máx: ${data.saldoPendiente}</p>
                    <button type="button" onClick={() => onPagoManualChange({ ...pagoManual, monto: data.saldoPendiente })} className="text-[10px] font-bold text-indigo-600 hover:text-indigo-700">Liquidar saldo</button>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1.5">Método de pago</label>
                  <select
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-100 transition-all"
                    value={pagoManual.metodoPagoId || ''}
                    onChange={e => onPagoManualChange({ ...pagoManual, metodoPagoId: parseInt(e.target.value) || undefined })}
                  >
                    <option value="">Efectivo (Directo)</option>
                    {metodosPago.filter(m => m.activo).map(m => (
                      <option key={m.id} value={m.id}>{m.nombre} ({m.tipo})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1.5">Referencia <span className="text-slate-400 font-normal normal-case">(Opcional)</span></label>
                  <input
                    type="text"
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-100 transition-all"
                    placeholder="Ej. Num ticket, nota..."
                    value={pagoManual.referencia}
                    onChange={e => onPagoManualChange({ ...pagoManual, referencia: e.target.value })}
                  />
                </div>

                <button type="submit" disabled={registeringPago || pagoManual.monto <= 0} className="w-full mt-2 bg-slate-900 text-white rounded-lg px-4 py-2.5 text-sm font-semibold hover:bg-slate-800 disabled:opacity-50 transition-colors shadow-sm flex items-center justify-center gap-2">
                  {registeringPago ? <RefreshCw className="animate-spin" size={16} /> : <><Plus size={16} /> Registrar Abono</>}
                </button>
              </form>
            ) : (
              <div className="py-8 text-center bg-emerald-50 border border-emerald-100 rounded-lg">
                <CheckCircle2 size={24} className="mx-auto text-emerald-500 mb-2" />
                <p className="text-sm font-semibold text-emerald-700">Evento Liquidado</p>
                <p className="text-xs text-emerald-600/70 mt-1">No hay saldo pendiente por cobrar.</p>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

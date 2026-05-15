import { DollarSign, CreditCard, RefreshCw } from 'lucide-react';

interface StepFinancialsProps {
  pagoInicial: number;
  precioFinal: number;
  recommendedPrice: number;
  isManualPrice: boolean;
  onUpdateForm: (data: any) => void;
}

const StepFinancials = ({
  pagoInicial,
  precioFinal,
  recommendedPrice,
  isManualPrice,
  onUpdateForm
}: StepFinancialsProps) => {
  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      <div className="flex items-center gap-3 px-2">
        <DollarSign size={20} className="text-primary" />
        <h3 className="text-xs font-black text-bg-dark uppercase tracking-[0.2em] italic">Resumen Económico</h3>
      </div>

      <div className="bg-white border border-slate-100 rounded-[3.5rem] p-10 shadow-premium overflow-hidden group">
        <div className="space-y-8">
          {/* PRECIO FINAL */}
          <div className="flex items-center justify-between p-8 bg-slate-50 rounded-[2.5rem] border border-transparent group-hover:border-slate-100 transition-all duration-500">
            <div className="space-y-1">
              <span className="text-[10px] font-black text-bg-dark uppercase tracking-[0.2em]">Precio Final Pactado</span>
              {isManualPrice ? (
                <div className="flex items-center gap-2 text-rose-500 animate-pulse">
                  <span className="text-[9px] font-black uppercase tracking-widest leading-none">Manual</span>
                  <span className="text-[9px] font-black uppercase tracking-widest leading-none opacity-50 italic">(Rec: ${recommendedPrice.toLocaleString()})</span>
                </div>
              ) : (
                <span className="text-[9px] font-black text-primary uppercase tracking-widest leading-none italic">Sugerido por Sistema</span>
              )}
            </div>
            
            <div className="flex items-center gap-4">
              <div className="relative">
                <span className="absolute left-5 top-1/2 -translate-y-1/2 text-primary font-black italic">$</span>
                <input 
                  type="number"
                  min="0"
                  step="any"
                  className={`w-32 bg-white border border-slate-100 rounded-2xl pl-10 pr-5 py-3 outline-none focus:ring-4 focus:ring-primary/10 transition-all font-black text-lg italic tracking-tighter text-right ${isManualPrice ? 'ring-rose-500/10 border-rose-200' : ''}`}
                  value={precioFinal}
                  onChange={e => onUpdateForm({ precioFinal: parseFloat(e.target.value) || 0, isManualPrice: true })}
                />
              </div>
              {isManualPrice && (
                <button 
                  className="w-10 h-10 rounded-xl bg-bg-dark text-white flex items-center justify-center hover:bg-primary transition-all active:rotate-180 duration-500 shadow-lg" 
                  onClick={() => onUpdateForm({ precioFinal: recommendedPrice, isManualPrice: false })}
                >
                  <RefreshCw size={14} />
                </button>
              )}
            </div>
          </div>

          {/* ABONO INICIAL */}
          <div className="flex items-center justify-between p-8 bg-emerald-50/30 rounded-[2.5rem] border border-emerald-100/30">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-white border border-emerald-100 flex items-center justify-center text-emerald-500 shadow-sm">
                <CreditCard size={20} />
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-black text-bg-dark uppercase tracking-[0.2em]">Abono Inicial / Seña</span>
                <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest leading-none italic">Depósito de Seguridad</span>
              </div>
            </div>

            <div className="relative">
              <span className="absolute left-5 top-1/2 -translate-y-1/2 text-emerald-500 font-black italic">$</span>
              <input 
                type="number"
                min="0"
                step="any"
                className="w-32 bg-white border border-emerald-100 rounded-2xl pl-10 pr-5 py-3 outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all font-black text-lg italic tracking-tighter text-right text-emerald-600"
                value={pagoInicial}
                onChange={e => onUpdateForm({ pagoInicial: parseFloat(e.target.value) || 0 })}
              />
            </div>
          </div>

          {/* SALDO PENDIENTE */}
          <div className="flex items-center justify-between p-10 bg-bg-dark rounded-[2.5rem] shadow-2xl shadow-black/20">
            <div className="space-y-1">
              <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">Saldo por Cobrar</span>
              <p className="text-[9px] font-black text-primary uppercase tracking-widest leading-none italic">Cobro el día del evento</p>
            </div>
            <div className="text-4xl font-black text-white italic tracking-tighter">
              ${(precioFinal - pagoInicial).toLocaleString()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StepFinancials;

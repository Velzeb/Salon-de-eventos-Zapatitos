import { CheckCircle2, FileText, DollarSign, Info } from 'lucide-react';
import type { EventoOperativo } from '../../../services/operativoService';

interface Props {
  evento: EventoOperativo;
  onConfirm: () => void;
  isUpdating: boolean;
}

export default function FaseRevision({ evento, onConfirm, isUpdating }: Props) {
  const isPaid = evento.saldoPendiente === 0;

  return (
    <div className="max-w-3xl mx-auto py-10 px-6 font-sans">
      <div className="text-center mb-10">
        <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-indigo-100 shadow-sm">
          <FileText size={32} className="text-indigo-600" />
        </div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Revisión de Reserva</h1>
        <p className="text-slate-500 mt-2 text-sm max-w-lg mx-auto">Valida los detalles con el cliente, asegúrate de que el anticipo se haya recibido y confirma el evento para generar el Checklist Logístico.</p>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden mb-8">
        <div className="p-8">
          <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6">Detalles del Cliente</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-xs text-slate-500 font-semibold mb-1">Clientes Responsables</p>
              <div className="space-y-1">
                {evento.clientes.map(c => (
                  <p key={c} className="text-sm font-bold text-slate-800">{c}</p>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs text-slate-500 font-semibold mb-1">Teléfono de Contacto</p>
              <p className="text-sm font-bold text-slate-800">Pendiente (CRM)</p>
            </div>
          </div>

          {evento.notasAdmin && (
            <div className="mt-8 p-4 bg-amber-50 border border-amber-100 rounded-xl">
              <p className="text-[10px] font-bold text-amber-600 uppercase tracking-widest mb-2 flex items-center gap-1.5"><Info size={14} /> Notas Internas de Venta</p>
              <p className="text-sm text-amber-900 font-medium whitespace-pre-wrap">{evento.notasAdmin}</p>
            </div>
          )}
        </div>

        <div className="border-t border-slate-100 bg-slate-50 p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 border-4 ${isPaid ? 'bg-emerald-100 text-emerald-600 border-emerald-50' : 'bg-rose-100 text-rose-600 border-rose-50'}`}>
              <DollarSign size={20} strokeWidth={3} />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900">Estado de Pago</p>
              {isPaid ? (
                <p className="text-xs text-emerald-600 font-semibold">Pagado en su totalidad</p>
              ) : (
                <p className="text-xs text-rose-600 font-semibold">Pendiente: ${evento.saldoPendiente.toLocaleString()}</p>
              )}
            </div>
          </div>

          <button
            onClick={onConfirm}
            disabled={isUpdating}
            className="w-full sm:w-auto px-8 py-3.5 bg-slate-900 hover:bg-indigo-600 text-white rounded-xl font-bold tracking-wide transition-all shadow-lg hover:shadow-indigo-500/25 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isUpdating ? 'Procesando...' : <><CheckCircle2 size={18} /> Confirmar Reserva</>}
          </button>
        </div>
      </div>
    </div>
  );
}

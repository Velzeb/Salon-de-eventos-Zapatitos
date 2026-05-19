import React from 'react';
import logo from '../../../assets/logoZapatitos.webp';

interface ReciboPrintProps {
  pago: {
    id: number;
    monto: number;
    fecha: string;
    metodo: string;
    referencia?: string;
    eventoId: number;
    cliente: string;
  };
}

const ReciboPrint = React.forwardRef<HTMLDivElement, ReciboPrintProps>(({ pago }, ref) => {
  return (
    <div ref={ref} className="p-16 text-slate-800 font-sans max-w-[800px] mx-auto bg-white">
      {/* HEADER */}
      <div className="flex justify-between items-start border-b-4 border-blue-600 pb-10 mb-12">
        <div className="flex items-center gap-6">
          <div className="w-24 h-24 p-4 bg-slate-50 rounded-3xl border border-slate-100 flex items-center justify-center">
            <img src={logo} alt="Zapatitos" className="w-full h-full object-contain" />
          </div>
          <div>
            <h1 className="text-4xl font-black uppercase tracking-tighter text-slate-900">Zapatitos</h1>
            <p className="text-blue-600 font-bold text-xs uppercase tracking-[0.3em] mt-1">Salón de Eventos Infantiles</p>
          </div>
        </div>
        <div className="text-right">
          <div className="bg-slate-900 text-white px-6 py-2 rounded-xl font-black uppercase text-xs tracking-widest mb-2 inline-block">
            Recibo Oficial
          </div>
          <p className="text-slate-400 font-bold text-sm">Nº REC-{pago.id.toString().padStart(6, '0')}</p>
        </div>
      </div>

      {/* CUERPO */}
      <div className="space-y-12">
        <div className="grid grid-cols-2 gap-16">
          <div className="space-y-6">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Recibido de:</p>
              <p className="text-xl font-bold text-slate-800">{pago.cliente}</p>
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Referente al Evento:</p>
              <p className="text-lg font-bold text-blue-600">Reserva #{pago.eventoId}</p>
            </div>
          </div>
          <div className="space-y-6 text-right">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Fecha de Pago:</p>
              <p className="text-lg font-bold text-slate-800">{new Date(pago.fecha).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Método:</p>
              <p className="text-lg font-bold text-slate-800 uppercase">{pago.metodo}</p>
            </div>
          </div>
        </div>

        <div className="bg-slate-50 rounded-[2.5rem] p-10 border border-slate-100">
           <div className="flex justify-between items-center border-b border-slate-200 pb-6 mb-6">
              <span className="text-sm font-bold text-slate-500 uppercase tracking-widest">Concepto</span>
              <span className="text-sm font-bold text-slate-500 uppercase tracking-widest">Importe</span>
           </div>
           <div className="flex justify-between items-center">
              <div>
                 <p className="font-bold text-slate-800 text-lg">Abono a Reserva de Evento</p>
                 <p className="text-xs text-slate-400 mt-1">Ref: {pago.referencia || 'Pago Manual'}</p>
              </div>
              <p className="text-3xl font-black text-slate-900">${pago.monto.toLocaleString()}</p>
           </div>
        </div>

        <div className="pt-12 text-center space-y-8">
           <div className="flex justify-center">
              <div className="w-64 border-b-2 border-slate-200 pt-12" />
           </div>
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.5em]">Firma Autorizada Zapatitos</p>
        </div>
      </div>

      {/* FOOTER */}
      <div className="mt-24 pt-8 border-t border-slate-100 flex justify-between items-center text-[9px] font-bold text-slate-400 uppercase tracking-widest">
         <span>Zapatitos Salon de Eventos • RUC: 123456789</span>
         <span>www.zapatitos.com</span>
      </div>
    </div>
  );
});

export default ReciboPrint;

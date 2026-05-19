import React from 'react';
import logo from '../../../assets/logoZapatitos.webp';

interface ContratoPrintProps {
  evento: any;
}

const ContratoPrint = React.forwardRef<HTMLDivElement, ContratoPrintProps>(({ evento }, ref) => {
  return (
    <div ref={ref} className="p-16 text-slate-800 font-sans max-w-[800px] mx-auto bg-white leading-relaxed">
      {/* HEADER */}
      <div className="flex justify-between items-start border-b-4 border-slate-900 pb-10 mb-12">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-center">
            <img src={logo} alt="Zapatitos" className="w-full h-full object-contain" />
          </div>
          <div>
            <h1 className="text-3xl font-bold uppercase tracking-tighter text-slate-900">Contrato de Servicio</h1>
            <p className="text-slate-500 font-bold text-xs  mt-1">Zapatitos Salon & Events</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-slate-400 font-bold text-xs uppercase mb-1">Folio del Evento</p>
          <p className="text-xl font-bold text-slate-900">#{evento.eventoId || evento.id}</p>
        </div>
      </div>

      {/* DETALLES PRINCIPALES */}
      <div className="grid grid-cols-2 gap-10 mb-12 bg-slate-50 p-8 rounded-3xl border border-slate-100">
        <div>
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4 border-b border-slate-200 pb-2">Información del Cliente</h3>
          <p className="font-bold text-slate-800">{evento.clientes?.join(', ') || 'Cliente por Definir'}</p>
          <p className="text-xs text-slate-500 mt-1">Titular Responsable</p>
        </div>
        <div>
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4 border-b border-slate-200 pb-2">Detalles de la Fiesta</h3>
          <p className="font-bold text-slate-800">{new Date(evento.fechaEvento).toLocaleDateString()}</p>
          <p className="text-xs text-slate-500 mt-1">{evento.horaInicio} a {evento.horaFin}</p>
        </div>
      </div>

      {/* CUERPO DEL CONTRATO */}
      <div className="space-y-8 text-xs text-slate-600">
        <section>
          <h4 className="font-bold text-slate-900 uppercase mb-3">1. Objeto del Contrato</h4>
          <p>
            El presente documento certifica la reserva del salón <strong>Zapatitos</strong> para la celebración del evento tipo <strong>{evento.paqueteNombre || evento.paquete}</strong>. 
            El servicio incluye el uso de las instalaciones, personal de apoyo y los elementos descritos en el plan seleccionado.
          </p>
        </section>

        <section>
          <h4 className="font-bold text-slate-900 uppercase mb-3">2. Plan Seleccionado e Inclusiones</h4>
          <div className="border border-slate-200 rounded-2xl overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-2 font-bold text-slate-500 uppercase text-xs">Concepto</th>
                  <th className="px-4 py-2 font-bold text-slate-500 uppercase text-xs">Detalle</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="px-4 py-3 font-bold text-slate-800">Paquete</td>
                  <td className="px-4 py-3">{evento.paqueteNombre || evento.paquete}</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-bold text-slate-800">Invitados</td>
                  <td className="px-4 py-3">Hasta {evento.cantidadNinosEstimada} niños</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-bold text-slate-800">Inversión Total</td>
                  <td className="px-4 py-3 font-bold text-blue-600">${evento.precioTotal?.toLocaleString()}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h4 className="font-bold text-slate-900 uppercase mb-3">3. Políticas de Cancelación y Pago</h4>
          <p>
            Para mantener la reserva vigente, se requiere el pago puntual del saldo pendiente de <strong>${evento.saldoPendiente?.toLocaleString()}</strong> a más tardar 7 días antes de la fecha del evento. 
            En caso de cancelación con menos de 15 días de anticipación, el depósito inicial no será reembolsable.
          </p>
        </section>

        <section>
          <h4 className="font-bold text-slate-900 uppercase mb-3">4. Responsabilidad</h4>
          <p>
            Zapatitos no se hace responsable por objetos olvidados dentro de las instalaciones. El cliente se compromete a hacer buen uso del mobiliario y equipo. Cualquier daño ocasionado por negligencia será facturado al titular del contrato.
          </p>
        </section>
      </div>

      {/* FIRMAS */}
      <div className="mt-24 grid grid-cols-2 gap-20">
        <div className="text-center">
          <div className="border-b border-slate-300 pt-12 mb-4" />
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Firma del Cliente</p>
          <p className="text-xs text-slate-300 mt-1">{evento.clientes?.[0]}</p>
        </div>
        <div className="text-center">
          <div className="border-b border-slate-300 pt-12 mb-4" />
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Por Zapatitos Salon</p>
          <p className="text-xs text-slate-300 mt-1">Representante Autorizado</p>
        </div>
      </div>

      {/* FOOTER */}
      <div className="mt-20 text-xs text-slate-400 text-center  opacity-50">
        Este documento es un comprobante de servicio digital generado por el sistema Zapatitos.
      </div>
    </div>
  );
});

export default ContratoPrint;





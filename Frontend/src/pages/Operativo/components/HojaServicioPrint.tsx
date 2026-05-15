import React from 'react';
import type { EventoOperativo } from '../../../services/operativoService';

interface Props {
  data: EventoOperativo;
}

const HojaServicioPrint: React.FC<Props> = ({ data }) => {
  return (
    <div className="print-only w-full bg-white p-8 text-slate-900 font-sans">
      {/* HEADER */}
      <div className="flex justify-between items-start border-b-2 border-slate-900 pb-6 mb-8">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tighter text-slate-900">Hoja de Servicio</h1>
          <p className="text-sm font-bold text-slate-500">Zapatitos • Salón de Fiestas Infantiles</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-black uppercase text-slate-400">Evento ID</p>
          <p className="text-2xl font-black text-slate-900">#{data.eventoId}</p>
          <p className="text-xs font-bold text-slate-600">{new Date(data.fechaEvento).toLocaleDateString()}</p>
        </div>
      </div>

      {/* DETALLES PRINCIPALES */}
      <div className="grid grid-cols-2 gap-8 mb-8">
        <div className="space-y-4">
          <div>
            <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Paquete Seleccionado</h3>
            <p className="text-lg font-bold text-slate-900">{data.paqueteNombre}</p>
          </div>
          <div>
            <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Horario</h3>
            <p className="text-lg font-bold text-slate-900">{data.horaInicio} - {data.horaFin}</p>
          </div>
          <div>
            <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Responsables</h3>
            <p className="text-sm font-semibold">{data.clientes.join(' / ')}</p>
          </div>
        </div>
        <div className="space-y-4">
          <div>
            <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Cumpleañeros</h3>
            {data.protagonistas.map((p, i) => (
              <p key={i} className="text-sm font-bold">{p.nombre} ({p.edadCumplir} años)</p>
            ))}
          </div>
          <div className="bg-slate-100 p-4 rounded-lg border border-slate-200">
            <h3 className="text-[10px] font-black uppercase text-slate-400 mb-2">Resumen Financiero</h3>
            <div className="flex justify-between text-xs font-bold">
                <span>Total:</span> <span>${data.precioTotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-xs font-black text-rose-600 mt-1">
                <span>Pendiente:</span> <span>${data.saldoPendiente.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* BRIEFING / LOGÍSTICA */}
      <div className="mb-8 bg-slate-50 p-6 rounded-xl border border-slate-200">
        <h2 className="text-xs font-black uppercase text-slate-400 tracking-widest mb-4 border-b border-slate-200 pb-2">Instrucciones de Personalización</h2>
        <div className="grid grid-cols-2 gap-6">
            <div>
                <h4 className="text-[10px] font-bold text-slate-500 uppercase">Temática</h4>
                <p className="text-sm font-bold">{data.tematica || 'No definida'}</p>
            </div>
            <div>
                <h4 className="text-[10px] font-bold text-slate-500 uppercase">Mantelería / Colores</h4>
                <p className="text-sm font-bold">{data.colorManteleria || 'Estándar'}</p>
            </div>
            <div>
                <h4 className="text-[10px] font-bold text-slate-500 uppercase">Pastel (Sabor/Estilo)</h4>
                <p className="text-sm font-bold">{data.saborPastel || 'Estándar'}</p>
            </div>
            <div>
                <h4 className="text-[10px] font-bold text-rose-600 uppercase">⚠️ Alergias / Avisos Médicos</h4>
                <p className="text-sm font-black text-rose-700">{data.alergias || 'Ninguna reportada'}</p>
            </div>
        </div>
        <div className="mt-4">
            <h4 className="text-[10px] font-bold text-slate-500 uppercase">Notas de Decoración y Montaje</h4>
            <p className="text-sm text-slate-700 mt-1 italic">{data.notasDecoracion || 'Sin notas adicionales'}</p>
        </div>
      </div>

      {/* CRONOGRAMA */}
      <div className="mb-8">
        <h2 className="text-xs font-black uppercase text-slate-400 tracking-widest mb-4 border-b border-slate-200 pb-2">Cronograma de Actividades</h2>
        <table className="w-full text-left">
            <thead>
                <tr className="bg-slate-100 text-[10px] font-black uppercase text-slate-500">
                    <th className="px-3 py-2">Hora</th>
                    <th className="px-3 py-2">Actividad</th>
                    <th className="px-3 py-2">Notas / Responsable</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
                {data.cronograma.map(act => (
                    <tr key={act.id} className="text-sm">
                        <td className="px-3 py-3 font-bold text-blue-600 whitespace-nowrap">{act.horaInicio} - {act.horaFin}</td>
                        <td className="px-3 py-3 font-bold">{act.nombre}</td>
                        <td className="px-3 py-3 text-slate-500 italic text-xs">{act.descripcion || '--'}</td>
                    </tr>
                ))}
            </tbody>
        </table>
      </div>

      {/* PERSONAL ASIGNADO */}
      <div className="mb-8">
        <h2 className="text-xs font-black uppercase text-slate-400 tracking-widest mb-4 border-b border-slate-200 pb-2">Equipo de Trabajo</h2>
        <div className="grid grid-cols-3 gap-4">
            {data.staff.map(s => (
                <div key={s.id} className="p-3 border border-slate-100 rounded bg-slate-50/50">
                    <p className="text-xs font-black text-slate-900">{s.nombre}</p>
                    <p className="text-[10px] font-bold text-blue-600 uppercase tracking-tighter">{s.rol}</p>
                </div>
            ))}
        </div>
      </div>

      {/* PIE DE PÁGINA / FIRMAS */}
      <div className="mt-16 pt-8 border-t-2 border-slate-100 grid grid-cols-2 gap-20">
        <div className="text-center">
            <div className="w-full border-b border-slate-900 h-12 mb-2"></div>
            <p className="text-[10px] font-bold text-slate-400 uppercase">Firma de Responsable del Salón</p>
        </div>
        <div className="text-center">
            <div className="w-full border-b border-slate-900 h-12 mb-2"></div>
            <p className="text-[10px] font-bold text-slate-400 uppercase">Firma de Conformidad del Cliente</p>
        </div>
      </div>

      <div className="mt-8 text-center">
        <p className="text-[8px] text-slate-300 font-bold uppercase tracking-[0.2em]">Generado automáticamente por Zapatitos ERP</p>
      </div>
    </div>
  );
};

export default HojaServicioPrint;

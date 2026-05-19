import { useState } from 'react';
import { Package, Calendar, Clock, Plus, FileText, X } from 'lucide-react';
import type { Paquete } from '../../../../services/paquetesService';
import type { AvailableSlot } from '../../../../services/disponibilidadService';
import PaqueteModal from '../../../Paquetes/components/PaqueteModal';

import type { EventoItemDto } from '../../../../services/eventosService';
import type { Articulo } from '../../../../services/inventarioService';
import type { Servicio } from '../../../../services/paquetesService';
import MediaViewerR2 from '../../../../components/common/MediaViewerR2';

interface StepEventDetailsProps {
  paqueteId: string;
  paquetes: Paquete[];
  items: EventoItemDto[];
  articulos: Articulo[];
  servicios: Servicio[];
  fechaEvento: string;
  horaInicio: string;
  horaFin: string;
  cantidadNinosEstimada: string;
  notasAdmin: string;
  tematica: string;
  availableSlots: AvailableSlot[];
  loadingSlots: boolean;
  errors: Record<string, string>;
  onUpdateForm: (data: any) => void;
  onRefreshPaquetes: () => void;
}

const StepEventDetails = ({
  paqueteId,
  paquetes,
  items,
  articulos,
  servicios,
  fechaEvento,
  horaInicio,
  horaFin,
  cantidadNinosEstimada,
  notasAdmin,
  tematica,
  availableSlots,
  loadingSlots,
  errors,
  onUpdateForm,
  onRefreshPaquetes
}: StepEventDetailsProps) => {
  const [isPaqueteModalOpen, setIsPaqueteModalOpen] = useState(false);

  const addItemFromInventory = (artId: number) => {
    const art = articulos.find(a => a.id === artId);
    if (!art) return;
    
    const newItem: EventoItemDto = {
      articuloId: art.id,
      nombre: art.nombre,
      cantidad: 1,
      notas: '',
      esIncluidoEnPaquete: false,
      precioUnitario: 0
    };
    onUpdateForm({ items: [...items, newItem] });
  };

  const addServiceAsItem = (srvId: number) => {
    const srv = servicios.find(s => s.id === srvId);
    if (!srv) return;
    
    const newItem: EventoItemDto = {
      servicioId: srv.id,
      nombre: srv.nombre,
      cantidad: 1,
      notas: '',
      esIncluidoEnPaquete: false,
      precioUnitario: srv.costoBase
    };
    onUpdateForm({ items: [...items, newItem] });
  };

  const updateItemDetail = (index: number, detail: string) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], notas: detail };
    onUpdateForm({ items: newItems });
  };

  const removeItem = (index: number) => {
    onUpdateForm({ items: items.filter((_, i) => i !== index) });
  };

  return (
    <div className="space-y-12 animate-in fade-in duration-500 pb-10">
      {/* PACKAGE & BASIC CONFIG */}
      <div className="space-y-8">
        <div className="flex items-center gap-3 px-2">
          <Package size={20} className="text-primary" />
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">Configuración del Servicio</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div className="space-y-3">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1">Plan / Paquete</label>
            <div className="flex gap-3">
              <div className="flex-1 relative group">
                <Package size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" />
                <select
                  className={`w-full bg-white border rounded-xl pl-16 pr-10 py-5 outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all text-sm font-medium text-slate-700 appearance-none cursor-pointer shadow-sm ${errors.paqueteId ? 'border-rose-300 ring-rose-500/10' : 'border-slate-100'}`}
                  value={paqueteId}
                  onChange={e => onUpdateForm({ paqueteId: e.target.value })}
                >
                  <option value="">Solo salón / sin paquete</option>
                  {paquetes.map(p => (
                    <option key={p.id} value={p.id}>{p.nombre} (${p.precioBase.toLocaleString()})</option>
                  ))}
                </select>
              </div>
              <button 
                type="button" 
                className="w-16 h-16 bg-slate-50 text-slate-400 rounded-xl flex items-center justify-center hover:bg-bg-dark hover:text-white transition-all shadow-sm active:scale-90"
                onClick={() => setIsPaqueteModalOpen(true)}
              >
                <Plus size={22} />
              </button>
            </div>
            {errors.paqueteId && <p className="text-xs font-medium text-rose-500 px-4">! {errors.paqueteId}</p>}
            
            {(() => {
              const selectedPaquete = paquetes.find(p => p.id.toString() === paqueteId);
              if (!selectedPaquete) return null;
              return (
                <div className="mt-4 p-6 bg-slate-50 border border-slate-100 rounded-2xl flex flex-col md:flex-row gap-6 animate-in slide-in-from-top-2 duration-300">
                  {selectedPaquete.imagenUrl ? (
                    <div className="w-full md:w-32 h-32 rounded-2xl overflow-hidden shadow-sm flex-shrink-0 bg-white">
                        <MediaViewerR2 
                          url={selectedPaquete.imagenUrl} 
                          alt={selectedPaquete.nombre} 
                          className="w-full h-full" 
                        />
                    </div>
                  ) : (
                    <div className="w-full md:w-32 h-32 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-slate-300 flex-shrink-0">
                      <Package size={32} />
                    </div>
                  )}
                  <div className="flex flex-col justify-center space-y-2">
                    <h4 className="text-base font-bold text-slate-900">{selectedPaquete.nombre}</h4>
                    <p className="text-xs font-bold text-slate-400  leading-relaxed">
                      {selectedPaquete.descripcion || 'Sin descripción estratégica.'}
                    </p>
                    <div className="flex gap-4 pt-1">
                      <span className="text-xs font-semibold text-primary bg-primary/10 px-3 py-1 rounded-full">
                        {selectedPaquete.servicios?.length || 0} Servicios
                      </span>
                      <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
                        ${selectedPaquete.precioBase.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>

          <div className="space-y-3">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1">Fecha Programada</label>
            <div className="relative group">
              <Calendar size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" />
              <input
                type="date"
                required
                className={`w-full bg-white border rounded-xl pl-16 pr-8 py-5 outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all font-bold text-sm shadow-sm ${errors.fechaEvento ? 'border-rose-300' : 'border-slate-100'}`}
                value={fechaEvento}
                onChange={e => onUpdateForm({ fechaEvento: e.target.value })}
              />
            </div>
            {errors.fechaEvento && <p className="text-xs font-medium text-rose-500 px-4">! {errors.fechaEvento}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div className="space-y-3">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1">Horario / Turno Disponible</label>
            <div className="relative group">
              <Clock size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" />
              <select 
                className="w-full bg-white border border-slate-100 rounded-xl pl-16 pr-10 py-5 outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all text-sm font-medium text-slate-700 appearance-none cursor-pointer shadow-sm"
                value={`${(horaInicio || '').substring(0,5)}-${(horaFin || '').substring(0,5)}`}
                onChange={(e) => {
                  const val = e.target.value;
                  if (!val) return;
                  const [start, end] = val.split('-');
                  onUpdateForm({ horaInicio: start, horaFin: end });
                }}
                disabled={loadingSlots || !fechaEvento}
              >
                {!fechaEvento ? (
                  <option value="">Selecciona una fecha primero</option>
                ) : loadingSlots ? (
                  <option value="">Cargando disponibilidad...</option>
                ) : availableSlots.length === 0 ? (
                  <option value="">Sin turnos para este día</option>
                ) : (
                  <>
                    <option value="">-- Elige un turno --</option>
                    {availableSlots.map((slot, sIdx) => (
                      <option 
                        key={sIdx} 
                        value={`${(slot.horaInicio || '').substring(0,5)}-${(slot.horaFin || '').substring(0,5)}`}
                        disabled={!slot.isAvailable}
                      >
                        {slot.nombreBloque} ({(slot.horaInicio || '').substring(0,5)} - {(slot.horaFin || '').substring(0,5)}) {!slot.isAvailable ? '- OCUPADO' : ''}
                      </option>
                    ))}
                  </>
                )}
              </select>
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1">Invitados Estimados</label>
            <input 
              type="number" 
              required 
              min="0"
              step="any"
              className="w-full bg-white border border-slate-100 rounded-xl px-8 py-5 outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all font-bold text-lg italic tracking-tighter shadow-sm"
              placeholder="0"
              value={cantidadNinosEstimada}
              onChange={e => onUpdateForm({ cantidadNinosEstimada: e.target.value })}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div className="space-y-3">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1">Temática de la Fiesta</label>
            <input 
              type="text"
              list="list-tematicas-reserva"
              className="w-full bg-white border border-slate-100 rounded-xl px-8 py-5 outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all font-bold text-sm shadow-sm"
              placeholder="Ej. Superhéroes, Princesas, Dinosaurios..."
              value={tematica || ''}
              onChange={e => onUpdateForm({ tematica: e.target.value })}
            />
            <datalist id="list-tematicas-reserva">
              <option value="Superhéroes" />
              <option value="Princesas" />
              <option value="Dinosaurios" />
              <option value="Unicornios" />
              <option value="Animales de la Selva" />
              <option value="Roblox / Minecraft" />
              <option value="Espacial / Galaxia" />
              <option value="Circo" />
              <option value="Frozen" />
              <option value="Mickey / Minnie" />
            </datalist>
          </div>
        </div>
      </div>

      {/* CHECKLIST / ITEMS */}
      <div className="space-y-8">
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-3">
            <Package size={20} className="text-primary" />
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">Checklist de la Fiesta</h3>
          </div>
          <span className="text-xs font-bold text-slate-300 ">Control de Logística</span>
        </div>
        
        <div className="bg-slate-50/50 border border-slate-100 rounded-3xl p-10 space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="relative group">
              <Plus size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-primary group-focus-within:rotate-90 transition-all duration-300" />
              <select 
                className="w-full bg-white border border-slate-100 rounded-xl pl-16 pr-10 py-4.5 outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all font-bold text-xs text-slate-400  appearance-none cursor-pointer shadow-sm"
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  if (val) addServiceAsItem(val);
                  e.target.value = "";
                }}
              >
                <option value="">Agregar Servicio Extra</option>
                {servicios.map(s => <option key={s.id} value={s.id}>{s.nombre} (+${s.costoBase.toLocaleString()})</option>)}
              </select>
            </div>

            <div className="relative group">
              <Plus size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-primary group-focus-within:rotate-90 transition-all duration-300" />
              <select 
                className="w-full bg-white border border-slate-100 rounded-xl pl-16 pr-10 py-4.5 outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all font-bold text-xs text-slate-400  appearance-none cursor-pointer shadow-sm"
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  if (val) addItemFromInventory(val);
                  e.target.value = "";
                }}
              >
                <option value="">Agregar Item Inventario</option>
                {articulos.map(a => <option key={a.id} value={a.id}>{a.nombre} (Stock: {a.stockActual})</option>)}
              </select>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-10 py-6 text-xs font-bold text-slate-400 ">Item / Servicio</th>
                  <th className="px-10 py-6 text-xs font-bold text-slate-400  w-[120px]">Cantidad</th>
                  <th className="px-10 py-6 text-xs font-bold text-slate-400 ">Instrucciones Especiales</th>
                  <th className="px-10 py-6 text-xs font-bold text-slate-400  text-right">Inversión</th>
                  <th className="px-10 py-6 w-[80px]"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {items.map((item, index) => (
                  <tr key={index} className={`group ${item.esIncluidoEnPaquete ? 'bg-primary/[0.02]' : 'hover:bg-slate-50'} transition-all`}>
                    <td className="px-10 py-6">
                      <div className="flex items-center gap-3">
                        {(() => {
                          const matchSrv = item.servicioId ? servicios.find(s => s.id === item.servicioId) : null;
                          const matchArt = item.articuloId ? articulos.find(a => a.id === item.articuloId) : null;
                          const imgToUse = matchSrv?.imagenUrl || matchArt?.imagenUrl;
                          
                          if (imgToUse) {
                            return (
                              <div className="w-10 h-10 rounded-xl overflow-hidden shadow-sm flex-shrink-0 bg-white">
                                {imgToUse.match(/\.(mp4|webm|ogg|mov)$/i) || imgToUse.includes('/videos/') ? (
                                  <video src={imgToUse} className="w-full h-full object-cover" autoPlay loop muted playsInline />
                                ) : (
                                  <img src={imgToUse} alt={item.nombre} className="w-full h-full object-cover" />
                                )}
                              </div>
                            );
                          }
                          return (
                            <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-300 flex-shrink-0">
                              <Package size={16} />
                            </div>
                          );
                        })()}
                        <div className="flex flex-col gap-1">
                          <span className="text-sm font-bold text-bg-dark uppercase italic tracking-tight">{item.nombre}</span>
                          {item.esIncluidoEnPaquete && (
                            <span className="text-xs font-bold bg-primary/10 text-primary px-3 py-1 rounded-full w-fit  leading-none">Incluido en Plan</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-10 py-6">
                      <input 
                        type="number" 
                        min="0"
                        step="any"
                        className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold text-bg-dark outline-none focus:ring-4 focus:ring-primary/5 transition-all text-center"
                        value={item.cantidad}
                        onChange={(e) => {
                          const newItems = [...items];
                          newItems[index].cantidad = parseFloat(e.target.value) || 0;
                          onUpdateForm({ items: newItems });
                        }}
                      />
                    </td>
                    <td className="px-10 py-6">
                      <input 
                        type="text" 
                        placeholder="Ej: Color azul, no abrir antes..."
                        value={item.notas || ''}
                        onChange={(e) => updateItemDetail(index, e.target.value)}
                        className="w-full bg-transparent border-b border-transparent focus:border-primary/30 py-2 outline-none text-xs font-bold text-slate-500 italic transition-all placeholder:text-slate-200"
                      />
                    </td>
                    <td className="px-10 py-6 text-right font-bold text-bg-dark text-sm italic tracking-tighter">
                       {item.precioUnitario > 0 ? `$${item.precioUnitario.toLocaleString()}` : <span className="text-primary text-xs font-semibold uppercase tracking-wider">Free</span>}
                    </td>
                    <td className="px-10 py-6 text-right">
                      {!item.esIncluidoEnPaquete && (
                        <button 
                          type="button" 
                          className="w-10 h-10 rounded-xl bg-slate-50 text-slate-300 flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all active:scale-90"
                          onClick={() => removeItem(index)}
                        >
                          <X size={16} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {items.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-24 text-center">
                      <div className="flex flex-col items-center gap-4 opacity-30">
                        <Package size={48} />
                        <p className="text-xs font-bold ">No hay items asignados a esta reserva.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* NOTES */}
      <div className="space-y-4">
        <div className="flex items-center gap-3 px-2">
          <FileText size={20} className="text-primary" />
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">Bitácora Operativa</h3>
        </div>
        <textarea 
          placeholder="Instrucciones generales para el staff, notas de montaje o especificaciones del salón..."
          className="w-full bg-white border border-slate-100 rounded-2xl p-10 outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all font-bold text-sm italic shadow-sm"
          rows={3}
          value={notasAdmin}
          onChange={e => onUpdateForm({ notasAdmin: e.target.value })}
        />
      </div>

      <PaqueteModal
        isOpen={isPaqueteModalOpen}
        onClose={() => setIsPaqueteModalOpen(false)}
        onSuccess={onRefreshPaquetes}
        onCreated={(newId) => {
          onUpdateForm({ paqueteId: newId.toString() });
        }}
      />
    </div>
  );
};

export default StepEventDetails;





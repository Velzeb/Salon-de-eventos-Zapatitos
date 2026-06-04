import { useState, useEffect } from 'react';
import { Save, RefreshCw, AlertTriangle, Users, Package, FileText, Plus, Trash2, Search, Check } from 'lucide-react';
import ChecklistLogistica from './ChecklistLogistica';
import { operativoService, type EventoOperativo } from '../../../services/operativoService';
import { paquetesService, type Servicio } from '../../../services/paquetesService';
import { authService } from '../../../services/authService';
import { toast } from 'sonner';
import type { Empleado } from '../../../services/empleadosService';

interface Props {
  data: EventoOperativo;
  allEmpleados: Empleado[];
  preferencias: { tematica: string; notasDecoracion: string };
  savingPreferencias: boolean;
  onPreferenciasChange: (v: { tematica: string; notasDecoracion: string }) => void;
  onSavePreferencias: () => void;
  onComplete: (tareaId: number) => void;
  onAssign: (tareaId: number, empleadoId: number) => void;
  onReload: () => Promise<void>;
  eventoId: number;
  onOpenEquipo: () => void;
}

export default function PreparacionTab({
  data, allEmpleados, preferencias, savingPreferencias, onPreferenciasChange,
  onSavePreferencias, onComplete, onAssign, onReload, eventoId, onOpenEquipo
}: Props) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [servicesCatalog, setServicesCatalog] = useState<Servicio[]>([]);
  const [loadingCatalog, setLoadingCatalog] = useState(false);
  const [selectedServiceId, setSelectedServiceId] = useState<number | ''>('');
  const [addQty, setAddQty] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [deletingItemId, setDeletingItemId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const isAdmin = authService.hasRole(['Administrador']);

  const filteredServices = servicesCatalog.filter(srv =>
    srv.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (srv.descripcion && srv.descripcion.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const faltantesInventario = data.tareas.filter(
    t => t.articuloId && t.cantidadRequerida > t.stockActual && !t.stockDescontado
  );
  const responsablesTareas = Array.from(
    new Set(data.tareas.map(t => t.asignadoA).filter(Boolean))
  ) as string[];

  useEffect(() => {
    if (showAddModal) {
      setLoadingCatalog(true);
      setSearchTerm('');
      setSelectedServiceId('');
      setAddQty(1);
      paquetesService.getServicios()
        .then(res => {
          setServicesCatalog(res);
        })
        .catch(err => {
          toast.error('No se pudo cargar el catálogo de servicios.');
          console.error(err);
        })
        .finally(() => {
          setLoadingCatalog(false);
        });
    }
  }, [showAddModal]);

  const handleAddService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedServiceId) {
      toast.error('Por favor selecciona un servicio.');
      return;
    }
    if (addQty < 1) {
      toast.error('La cantidad debe ser al menos 1.');
      return;
    }

    setSubmitting(true);
    try {
      await operativoService.addServicioToEvento(eventoId, Number(selectedServiceId), addQty);
      toast.success('Servicio agregado y tareas de logística regeneradas.');
      setShowAddModal(false);
      setSelectedServiceId('');
      setAddQty(1);
      await onReload();
    } catch (err: any) {
      const msg = err.response?.data?.join?.(', ') || 'No se pudo agregar el servicio.';
      toast.error(msg);
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteItem = async (itemId: number, itemName: string) => {
    if (!window.confirm(`¿Seguro que deseas quitar "${itemName}" de este evento? Las tareas no completadas asociadas se eliminarán.`)) {
      return;
    }

    setDeletingItemId(itemId);
    try {
      await operativoService.removeItemFromEvento(eventoId, itemId);
      toast.success(`"${itemName}" removido del evento.`);
      await onReload();
    } catch (err: any) {
      const msg = err.response?.data?.join?.(', ') || 'No se pudo quitar el servicio.';
      toast.error(msg);
      console.error(err);
    } finally {
      setDeletingItemId(null);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Alertas de inventario críticas */}
      {faltantesInventario.length > 0 && (
        <div className="bg-white border-l-4 border-l-rose-500 border-y border-r border-slate-200 p-5 rounded-r-xl shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-rose-100 text-rose-600 rounded">
              <AlertTriangle size={20} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Alerta de Inventario</h3>
              <p className="text-xs text-slate-600">Se requieren insumos que actualmente no tienen stock suficiente.</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {faltantesInventario.map(t => (
              <div key={t.id} className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex justify-between items-center">
                <div className="min-w-0 pr-3">
                  <p className="font-semibold text-slate-800 text-xs truncate">{t.nombre}</p>
                  <p className="text-[10px] font-bold text-rose-600 uppercase tracking-wider mt-0.5">Faltan {t.cantidadRequerida - t.stockActual} u.</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Stock actual</p>
                  <p className="text-sm font-bold text-slate-700">{t.stockActual}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Grid superior: Datos y Montaje */}
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px] gap-6">
        <section className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm flex flex-col">
          <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
              <Package size={16} className="text-slate-400" /> Servicios e Insumos Contratados
            </h3>
            {isAdmin && (
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-1.5 text-indigo-600 text-xs font-semibold bg-indigo-50 border border-indigo-100 px-3 py-1.5 rounded hover:bg-indigo-100 transition-colors"
              >
                <Plus size={14} /> Añadir Servicio
              </button>
            )}
          </div>
          
          <div className="p-5 flex-1">
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="p-4 bg-slate-50 border border-slate-100 rounded-lg">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Temática del Evento</p>
                <p className="text-base font-bold text-slate-900">{data.tematica || 'No definida'}</p>
              </div>
              <div className="p-4 bg-slate-50 border border-slate-100 rounded-lg">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Cumpleañeros</p>
                <div className="space-y-0.5">
                  {data.protagonistas.length > 0 ? data.protagonistas.map((p, i) => (
                    <p key={i} className="text-sm font-semibold text-slate-800">{p.nombre} · {p.edadCumplir} años</p>
                  )) : (
                    <p className="text-sm font-semibold text-slate-500 italic">No registrado</p>
                  )}
                </div>
              </div>
            </div>

            {data.items.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {data.items.map(item => (
                  <div key={item.id} className="group relative flex items-center gap-3 rounded-xl border border-slate-100 bg-white p-3 hover:border-slate-200 hover:shadow-sm transition-all">
                    <div className="w-12 h-12 rounded-lg overflow-hidden bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-300 shrink-0">
                      {item.imagenUrl ? (
                        item.imagenUrl.match(/\.(mp4|webm|ogg|mov)$/i) || item.imagenUrl.includes('/videos/') ? (
                          <video src={item.imagenUrl} className="w-full h-full object-cover" autoPlay loop muted playsInline />
                        ) : (
                          <img src={item.imagenUrl} alt={item.nombre} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                        )
                      ) : (
                        <Package size={20} strokeWidth={1.5} />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-slate-900 leading-tight truncate">{item.nombre}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] font-bold text-slate-500">x{item.cantidad}</span>
                        <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${item.esIncluidoEnPaquete ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>
                          {item.esIncluidoEnPaquete ? 'Paquete' : 'Extra'}
                        </span>
                      </div>
                    </div>
                    {isAdmin && (
                      <button
                        onClick={() => handleDeleteItem(item.id, item.nombre)}
                        disabled={deletingItemId === item.id}
                        className="absolute top-2 right-2 p-1 bg-rose-50 hover:bg-rose-100 text-rose-600 hover:text-rose-700 rounded border border-rose-100 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-all duration-200"
                        title="Quitar de este evento"
                      >
                        {deletingItemId === item.id ? (
                          <RefreshCw size={12} className="animate-spin" />
                        ) : (
                          <Trash2 size={12} />
                        )}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-sm text-slate-500 border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                Sin servicios adicionales contratados.
              </div>
            )}
          </div>
        </section>

        <section className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm flex flex-col">
          <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
              <FileText size={16} className="text-slate-400" /> Notas de Montaje
            </h3>
            <button onClick={onSavePreferencias} disabled={savingPreferencias} className="flex items-center gap-1.5 text-indigo-600 text-xs font-semibold bg-indigo-50 border border-indigo-100 px-3 py-1.5 rounded hover:bg-indigo-100 transition-colors">
              {savingPreferencias ? <RefreshCw className="animate-spin" size={14} /> : <Save size={14} />} Guardar
            </button>
          </div>
          <div className="p-5 flex-1 flex flex-col">
            <p className="text-xs text-slate-500 mb-3 leading-relaxed">Instrucciones específicas para el equipo de decoración, distribución de mesas y montaje del salón.</p>
            <textarea
              className="w-full flex-1 min-h-[160px] bg-white border border-slate-200 rounded-lg p-4 text-sm text-slate-700 outline-none focus:ring-inset focus:ring-2 focus:ring-indigo-500 resize-none transition-shadow"
              value={preferencias.notasDecoracion}
              onChange={e => onPreferenciasChange({ ...preferencias, notasDecoracion: e.target.value })}
              placeholder="Ej: Manteles color pastel, mesa dulce a la derecha del escenario, centro de mesa de dinosaurios..."
            />
          </div>
        </section>
      </div>

      {/* Checklist Logístico */}
      <ChecklistLogistica
        tareas={data.tareas}
        allEmpleados={allEmpleados}
        eventStaff={data.staff}
        onComplete={onComplete}
        onAssign={onAssign}
        onCreate={async (cmd) => { await operativoService.createTarea({ ...cmd, eventoId }); await onReload(); }}
        onUpdate={async (cmd) => { await operativoService.updateTarea(cmd); await onReload(); }}
        onDelete={async (tareaId) => { if (!window.confirm('¿Seguro que deseas eliminar esta tarea?')) return; await operativoService.deleteTarea(tareaId); await onReload(); }}
      />

      {/* Equipo de Trabajo (Read-Only) */}
      <section className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
              <Users size={18} className="text-indigo-500" /> Equipo de Trabajo
            </h3>
            <p className="text-xs text-slate-500 mt-1">Personal asignado a esta fiesta.</p>
          </div>
          <button
            onClick={onOpenEquipo}
            className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-100 px-4 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
          >
            <Users size={14} /> Gestionar Equipo
          </button>
        </div>

        <div className="p-6">
          {data.staff.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {data.staff.map(member => (
                <div key={member.id} className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 bg-white hover:shadow-sm transition-shadow">
                  {member.fotoPerfilUrl ? (
                    <img src={member.fotoPerfilUrl} alt={member.nombre} className="w-10 h-10 rounded-full object-cover border border-slate-200 shrink-0" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-xs shrink-0 border border-indigo-100">
                      {member.nombre.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-900 truncate">{member.nombre}</p>
                    <p className="text-xs text-slate-500 truncate">{member.rol}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 border border-dashed border-slate-300 rounded-lg bg-slate-50">
              <Users size={24} className="mx-auto text-slate-300 mb-2" />
              <p className="text-sm font-medium text-slate-600">No hay personal asignado</p>
              <p className="text-xs text-slate-400 mt-1">Usa el panel "Equipo" para asignar el personal de esta fiesta.</p>
            </div>
          )}

          {responsablesTareas.length > 0 && (
            <div className="mt-6 pt-5 border-t border-slate-100">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Implicados en Tareas de Logística</p>
              <div className="flex flex-wrap gap-2">
                {responsablesTareas.map(nombre => (
                  <div key={nombre} className="flex items-center gap-2 rounded bg-slate-50 border border-slate-200 px-2.5 py-1.5">
                    <div className="w-5 h-5 bg-white text-slate-600 rounded-full flex items-center justify-center text-[10px] font-bold border border-slate-200 shadow-sm">
                      {nombre.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-xs font-medium text-slate-700">{nombre}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Modal de agregar servicio */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-100 max-w-2xl w-full p-6 space-y-4 relative animate-scale-up">
            <button 
              onClick={() => setShowAddModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 font-semibold text-lg"
            >
              &times;
            </button>
            <div>
              <h3 className="text-base font-bold text-slate-950 flex items-center gap-2">
                <Plus size={18} className="text-indigo-600" /> Añadir Servicio al Evento
              </h3>
              <p className="text-xs text-slate-500 mt-1">Selecciona un servicio del catálogo para agregarlo a este evento.</p>
            </div>
            
            <form onSubmit={handleAddService} className="space-y-4">
              {/* Buscador */}
              <div className="relative">
                <Search className="absolute left-3 top-3.5 text-slate-400" size={16} />
                <input
                  type="text"
                  placeholder="Buscar servicio por nombre o descripción..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-4 py-2.5 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>

              {/* Grid de servicios */}
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Servicios Disponibles</label>
                {loadingCatalog ? (
                  <div className="flex items-center justify-center gap-2 text-sm text-slate-500 py-10 border border-dashed border-slate-200 rounded-xl bg-slate-50">
                    <RefreshCw className="animate-spin text-indigo-600" size={18} /> Cargando catálogo de servicios...
                  </div>
                ) : filteredServices.length === 0 ? (
                  <div className="text-center py-10 border border-dashed border-slate-200 rounded-xl bg-slate-50 text-xs text-slate-500">
                    No se encontraron servicios que coincidan con la búsqueda.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[280px] overflow-y-auto pr-1">
                    {filteredServices.map(srv => {
                      const isSelected = selectedServiceId === srv.id;
                      return (
                        <div
                          key={srv.id}
                          onClick={() => setSelectedServiceId(srv.id)}
                          className={`group relative flex gap-3 p-3 rounded-xl border transition-all cursor-pointer select-none ${
                            isSelected
                              ? 'border-indigo-600 bg-indigo-50/40 shadow-sm'
                              : 'border-slate-100 bg-slate-50 hover:border-slate-300 hover:bg-white'
                          }`}
                        >
                          <div className="w-12 h-12 rounded-lg overflow-hidden bg-slate-200 border border-slate-100 flex items-center justify-center text-slate-400 shrink-0">
                            {srv.imagenUrl ? (
                              srv.imagenUrl.match(/\.(mp4|webm|ogg|mov)$/i) || srv.imagenUrl.includes('/videos/') ? (
                                <video src={srv.imagenUrl} className="w-full h-full object-cover" autoPlay loop muted playsInline />
                              ) : (
                                <img src={srv.imagenUrl} alt={srv.nombre} className="w-full h-full object-cover" />
                              )
                            ) : (
                              <Package size={20} strokeWidth={1.5} />
                            )}
                          </div>
                          <div className="min-w-0 flex-1 flex flex-col justify-between">
                            <div>
                              <p className="text-xs font-bold text-slate-900 leading-tight truncate">{srv.nombre}</p>
                              {srv.descripcion && (
                                <p className="text-[10px] text-slate-500 line-clamp-2 mt-0.5 leading-normal">{srv.descripcion}</p>
                              )}
                            </div>
                            <p className="text-xs font-extrabold text-indigo-600 mt-1">${srv.costoBase}</p>
                          </div>
                          {isSelected && (
                            <div className="absolute top-2 right-2 p-0.5 bg-indigo-600 text-white rounded-full">
                              <Check size={10} strokeWidth={3} />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Cantidad */}
              <div className="flex items-center justify-between border-t border-slate-100 pt-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">Cantidad a Contratar</label>
                  <p className="text-[10px] text-slate-400">Especifica la cantidad del servicio seleccionado.</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setAddQty(prev => Math.max(1, prev - 1))}
                    className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center transition-colors"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min="1"
                    className="w-12 text-center bg-slate-50 border border-slate-200 rounded-lg py-1 text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500"
                    value={addQty}
                    onChange={e => setAddQty(Math.max(1, parseInt(e.target.value) || 1))}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setAddQty(prev => prev + 1)}
                    className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center transition-colors"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-3 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 text-sm font-semibold rounded-lg hover:bg-slate-100 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting || !selectedServiceId}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg flex items-center gap-1.5 transition-colors disabled:bg-slate-200 disabled:text-slate-400"
                >
                  {submitting && <RefreshCw size={14} className="animate-spin" />}
                  Confirmar y Añadir
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

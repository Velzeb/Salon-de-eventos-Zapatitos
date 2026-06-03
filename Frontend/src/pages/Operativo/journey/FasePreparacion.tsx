import { useState } from 'react';
import { Package, Users, ClipboardList, CheckCircle2, UserPlus, Image as ImageIcon, ArrowLeft, ArrowRight } from 'lucide-react';
import type { EventoOperativo } from '../../../services/operativoService';
import type { Empleado } from '../../../services/empleadosService';

interface Props {
  evento: EventoOperativo;
  allEmpleados: Empleado[];
  onCompleteTarea: (id: number) => Promise<void>;
  onAssignTarea: (tareaId: number, empleadoId: number) => Promise<void>;
  onAssignStaff: (cmd: any) => Promise<void>;
  onGoBack: () => void;
  onAvanzar: () => void;
}

export default function FasePreparacion({ evento, allEmpleados, onCompleteTarea, onAssignTarea, onAssignStaff, onGoBack, onAvanzar }: Props) {
  const [newStaff, setNewStaff] = useState({ empleadoId: 0, rol: 'Apoyo' });
  const [isAssigning, setIsAssigning] = useState(false);

  const handleAssignStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaff.empleadoId) return;
    setIsAssigning(true);
    try {
      await onAssignStaff({ eventoId: evento.eventoId, empleadoId: newStaff.empleadoId, rol: newStaff.rol });
      setNewStaff({ empleadoId: 0, rol: 'Apoyo' });
    } finally {
      setIsAssigning(false);
    }
  };

  const getFallbackImage = (nombre: string) => {
    const encoded = encodeURIComponent(nombre);
    return `https://ui-avatars.com/api/?name=${encoded}&background=random&color=fff&size=512&font-size=0.33`;
  };

  return (
    <div className="p-8 max-w-7xl mx-auto font-sans space-y-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Fase de Preparación</h1>
        <p className="text-slate-500 mt-2">Asegura el inventario, prepara los servicios contratados y asigna a tu equipo de trabajo.</p>
      </div>

      {/* Grid de Productos Contratados (Visual) */}
      <section>
        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-widest mb-4 flex items-center gap-2">
          <Package size={16} className="text-indigo-500" /> Servicios y Artículos
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {evento.items.map(item => (
            <div key={item.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow group">
              <div className="aspect-square bg-slate-100 relative overflow-hidden">
                <img 
                  src={item.imagenUrl || getFallbackImage(item.nombre)} 
                  alt={item.nombre}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-2 right-2 bg-white/90 backdrop-blur px-2 py-0.5 rounded-full text-[10px] font-bold text-slate-700 shadow-sm">
                  x{item.cantidad}
                </div>
              </div>
              <div className="p-3">
                <p className="text-xs font-bold text-slate-800 line-clamp-2 leading-tight">{item.nombre}</p>
                <p className="text-[9px] text-slate-400 mt-1 uppercase font-semibold">{item.esIncluidoEnPaquete ? 'Paquete' : 'Extra'}</p>
              </div>
            </div>
          ))}
          {evento.items.length === 0 && (
            <div className="col-span-full py-10 text-center bg-slate-50 border border-dashed border-slate-200 rounded-2xl">
              <ImageIcon size={24} className="mx-auto text-slate-300 mb-2" />
              <p className="text-sm text-slate-500 font-medium">No hay artículos contratados</p>
            </div>
          )}
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-8">
        {/* Checklist */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-widest flex items-center gap-2">
              <ClipboardList size={16} className="text-indigo-500" /> Tareas Logísticas
            </h2>
          </div>
          
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="divide-y divide-slate-100">
              {evento.tareas.map(t => {
                const completada = t.estado === 'Completada';
                const sinStock = t.articuloId && t.stockActual < t.cantidadRequerida && !t.stockDescontado;
                
                return (
                  <div key={t.id} className={`p-4 flex flex-col sm:flex-row sm:items-center gap-4 transition-colors ${completada ? 'bg-slate-50/50' : 'hover:bg-slate-50'}`}>
                    <button
                      onClick={() => {
                        if (completada) {
                          if (!window.confirm('Esta tarea pasará a no hecha. ¿Deseas continuar?')) return;
                        }
                        onCompleteTarea(t.id);
                      }}
                      className={`w-6 h-6 rounded flex items-center justify-center shrink-0 border-2 transition-all ${
                        completada ? 'bg-indigo-500 border-indigo-500 text-white' : 'bg-white border-slate-300 hover:border-indigo-400'
                      }`}
                    >
                      {completada && <CheckCircle2 size={16} strokeWidth={3} />}
                    </button>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className={`text-sm font-bold ${completada ? 'text-slate-400 line-through' : 'text-slate-800'}`}>{t.nombre}</p>
                        {sinStock && !completada && (
                          <span className="px-2 py-0.5 bg-rose-100 text-rose-700 text-[9px] font-black uppercase tracking-wider rounded border border-rose-200">
                            Falta Stock
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">{t.descripcion || 'Preparar insumo'}</p>
                    </div>

                    <div className="shrink-0 flex items-center gap-2">
                      <select
                        className="bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-600 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
                        value={allEmpleados.find(e => e.nombreCompleto === t.asignadoA)?.id || ''}
                        onChange={e => onAssignTarea(t.id, parseInt(e.target.value))}
                      >
                        <option value="">Nadie asignado</option>
                        {allEmpleados.map(e => (
                          <option key={e.id} value={e.id}>{e.nombreCompleto}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                );
              })}
              
              {evento.tareas.length === 0 && (
                <div className="p-10 text-center">
                  <p className="text-sm text-slate-500">El evento no requiere tareas logísticas de inventario.</p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Staff Assignment */}
        <section>
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-widest mb-4 flex items-center gap-2">
            <Users size={16} className="text-indigo-500" /> Equipo de Trabajo
          </h2>
          
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
            <form onSubmit={handleAssignStaff} className="flex flex-col gap-3">
              <select
                className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500"
                value={newStaff.empleadoId}
                onChange={e => setNewStaff({ ...newStaff, empleadoId: parseInt(e.target.value) })}
              >
                <option value={0}>Seleccionar empleado...</option>
                {allEmpleados.map(e => <option key={e.id} value={e.id}>{e.nombreCompleto}</option>)}
              </select>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Rol (ej. Animador)"
                  className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                  value={newStaff.rol}
                  onChange={e => setNewStaff({ ...newStaff, rol: e.target.value })}
                />
                <button type="submit" disabled={isAssigning || !newStaff.empleadoId} className="bg-slate-900 hover:bg-indigo-600 text-white w-10 rounded-xl flex items-center justify-center transition-colors disabled:opacity-50">
                  <UserPlus size={16} />
                </button>
              </div>
            </form>

            <div className="border-t border-slate-100 pt-4 space-y-3">
              {evento.staff.map(member => (
                <div key={member.id} className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-xl transition-colors">
                  <img src={member.fotoPerfilUrl || getFallbackImage(member.nombre)} alt={member.nombre} className="w-10 h-10 rounded-full object-cover shadow-sm" />
                  <div>
                    <p className="text-sm font-bold text-slate-800 leading-tight">{member.nombre}</p>
                    <p className="text-xs text-slate-500 font-medium">{member.rol}</p>
                  </div>
                </div>
              ))}
              {evento.staff.length === 0 && (
                <p className="text-xs text-slate-400 text-center py-4">Aún no hay equipo asignado.</p>
              )}
            </div>
          </div>
        </section>
      </div>

      <div className="flex items-center justify-between mt-12 pt-6 border-t border-slate-200">
        <button onClick={onGoBack} className="flex items-center gap-2 text-slate-500 hover:text-slate-800 font-bold text-sm px-6 py-3 rounded-xl hover:bg-slate-100 transition-colors">
          <ArrowLeft size={16} /> Volver a Revisión
        </button>
        <button onClick={onAvanzar} className="flex items-center gap-2 bg-indigo-600 text-white font-bold text-sm px-8 py-3 rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200">
          Iniciar Fiesta <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}

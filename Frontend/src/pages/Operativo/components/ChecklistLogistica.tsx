import { useState } from 'react';
import type { ComponentType } from 'react';
import { Plus, Trash2, Save, X, Users, PackageCheck, Boxes, ClipboardList, PackageSearch, PenTool } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { TareaOperativa } from '../../../services/operativoService';
import type { Empleado } from '../../../services/empleadosService';

interface Props {
  tareas: TareaOperativa[];
  allEmpleados: Empleado[];
  onComplete: (tareaId: number) => void;
  onAssign: (tareaId: number, empleadoId: number) => void;
  onCreate: (cmd: { nombreTarea: string; descripcion?: string; articuloInventarioId?: number; cantidadRequerida: number }) => Promise<void>;
  onUpdate: (cmd: { tareaId: number; nombreTarea: string; descripcion?: string; articuloInventarioId?: number; cantidadRequerida: number }) => Promise<void>;
  onDelete: (tareaId: number) => Promise<void>;
}

type TaskSection = {
  id: string;
  title: string;
  description: string;
  icon: ComponentType<{ size?: number; className?: string }>;
  tasks: TareaOperativa[];
};

const normalizeTipoTarea = (tarea: TareaOperativa) => {
  const tipo = tarea.tipoTarea?.toLowerCase();
  if (tipo === 'entrega') return 'entrega';
  if (tipo === 'servicio') return 'servicio';
  if (tipo === 'inventario' || tarea.articuloId) return 'inventario';
  return 'manual';
};

interface Props {
  tareas: TareaOperativa[];
  allEmpleados: Empleado[];
  eventStaff?: { empleadoId?: number; nombre: string }[];
  onComplete: (tareaId: number) => void;
  onAssign: (tareaId: number, empleadoId: number) => void;
  onCreate: (cmd: { nombreTarea: string; descripcion?: string; articuloInventarioId?: number; cantidadRequerida: number }) => Promise<void>;
  onUpdate: (cmd: { tareaId: number; nombreTarea: string; descripcion?: string; articuloInventarioId?: number; cantidadRequerida: number }) => Promise<void>;
  onDelete: (tareaId: number) => Promise<void>;
}

export default function ChecklistLogistica({ tareas, allEmpleados, eventStaff = [], onComplete, onAssign, onCreate, onUpdate, onDelete }: Props) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [newTarea, setNewTarea] = useState({ nombreTarea: '', descripcion: '', cantidadRequerida: 1 });
  const [editTarea, setEditTarea] = useState({ nombreTarea: '', descripcion: '', cantidadRequerida: 1 });

  const handleCreate = async () => {
    if (!newTarea.nombreTarea.trim()) return;
    await onCreate(newTarea);
    setIsAdding(false);
    setNewTarea({ nombreTarea: '', descripcion: '', cantidadRequerida: 1 });
  };

  const startEdit = (t: TareaOperativa) => {
    setEditingId(t.id);
    setEditTarea({ nombreTarea: t.nombre, descripcion: t.descripcion || '', cantidadRequerida: t.cantidadRequerida });
  };

  const saveEdit = async (id: number) => {
    await onUpdate({ tareaId: id, ...editTarea });
    setEditingId(null);
  };

  const activeTareas = tareas.filter(t => normalizeTipoTarea(t) !== 'entrega');

  const assignedIds = new Set(eventStaff.map(s => s.empleadoId).filter(Boolean) as number[]);
  const assignedNames = new Set(eventStaff.map(s => s.nombre.toLowerCase()).filter(Boolean) as string[]);

  const assignedStaffList = allEmpleados.filter(e => assignedIds.has(e.id) || assignedNames.has(e.nombreCompleto.toLowerCase()));
  const otherStaffList = allEmpleados.filter(e => !assignedIds.has(e.id) && !assignedNames.has(e.nombreCompleto.toLowerCase()));

  const sections: TaskSection[] = [
    {
      id: 'inventario',
      title: 'Insumos e Inventario',
      description: 'Productos que deben descontarse del almacén.',
      icon: Boxes,
      tasks: activeTareas.filter(t => normalizeTipoTarea(t) === 'inventario')
    },
    {
      id: 'servicio',
      title: 'Preparación de Servicios',
      description: 'Tareas generadas automáticamente por los servicios contratados.',
      icon: PackageCheck,
      tasks: activeTareas.filter(t => normalizeTipoTarea(t) === 'servicio')
    },
    {
      id: 'manual',
      title: 'Tareas Manuales',
      description: 'Asignaciones específicas añadidas manualmente para este evento.',
      icon: ClipboardList,
      tasks: activeTareas.filter(t => normalizeTipoTarea(t) === 'manual')
    }
  ];

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
      <div className="px-6 py-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
            <ClipboardList size={18} className="text-indigo-500" /> Checklist Logístico
          </h3>
          <p className="text-xs text-slate-500 mt-1">Supervisa y asigna tareas de preparación.</p>
        </div>
        <button
          onClick={() => setIsAdding(true)}
          className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-100 px-4 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
        >
          <Plus size={14} /> Nueva Tarea Manual
        </button>
      </div>

      <AnimatePresence>
        {isAdding && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-b border-slate-100 bg-slate-50 overflow-hidden"
          >
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-sm font-semibold text-slate-800">Agregar Nueva Tarea</h4>
                <button onClick={() => setIsAdding(false)} className="text-slate-400 hover:text-slate-600"><X size={16} /></button>
              </div>
              <div className="grid grid-cols-1 gap-4">
                <input
                  type="text"
                  placeholder="Título de la tarea (ej. Comprar globos extra)"
                  className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-100"
                  value={newTarea.nombreTarea}
                  onChange={e => setNewTarea({ ...newTarea, nombreTarea: e.target.value })}
                />
                <textarea
                  placeholder="Detalles adicionales (opcional)"
                  className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-100 resize-none h-20"
                  value={newTarea.descripcion}
                  onChange={e => setNewTarea({ ...newTarea, descripcion: e.target.value })}
                />
                <button
                  onClick={handleCreate}
                  disabled={!newTarea.nombreTarea.trim()}
                  className="bg-indigo-600 text-white rounded-lg px-4 py-2.5 text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                >
                  Guardar Tarea
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="divide-y divide-slate-100">
        {sections.map(section => {
          if (section.tasks.length === 0) return null;
          const SectionIcon = section.icon;

          return (
            <div key={section.id} className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-1.5 bg-slate-100 rounded text-slate-500">
                  <SectionIcon size={16} />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-900">{section.title}</h4>
                  <p className="text-xs text-slate-500">{section.description}</p>
                </div>
              </div>

              <div className="space-y-2">
                {section.tasks.map(t => {
                  const completada = t.estado === 'Completada';
                  const isEditing = editingId === t.id;

                  return (
                    <div key={t.id} className={`flex flex-col md:flex-row md:items-center gap-4 p-4 rounded-lg border transition-all ${
                      completada ? 'bg-slate-50/50 border-slate-200 opacity-75' : 'bg-white border-slate-200 hover:border-indigo-200'
                    }`}>
                      {/* Checkbox */}
                      <button
                        onClick={() => {
                          if (completada) {
                            if (!window.confirm('Esta tarea pasará a no hecha. ¿Deseas continuar?')) return;
                          }
                          onComplete(t.id);
                        }}
                        className={`w-6 h-6 rounded flex items-center justify-center shrink-0 border transition-all ${
                          completada ? 'bg-indigo-600 border-indigo-600' : 'bg-white border-slate-300 hover:border-indigo-400'
                        }`}
                      >
                        {completada && <svg className="w-4 h-4 text-white" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>}
                      </button>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        {isEditing ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              className="flex-1 border border-slate-200 rounded px-3 py-1.5 text-sm outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-100"
                              value={editTarea.nombreTarea}
                              onChange={e => setEditTarea({ ...editTarea, nombreTarea: e.target.value })}
                            />
                            <button onClick={() => saveEdit(t.id)} className="p-1.5 bg-indigo-50 text-indigo-600 rounded hover:bg-indigo-100"><Save size={14} /></button>
                            <button onClick={() => setEditingId(null)} className="p-1.5 bg-slate-50 text-slate-500 rounded hover:bg-slate-100"><X size={14} /></button>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-center gap-2">
                              <p className={`text-sm font-semibold ${completada ? 'text-slate-500 line-through' : 'text-slate-800'}`}>{t.nombre}</p>
                              {section.id === 'inventario' && t.stockActual < t.cantidadRequerida && !t.stockDescontado && (
                                <span className="px-2 py-0.5 rounded bg-rose-50 border border-rose-100 text-rose-600 text-[9px] font-bold uppercase tracking-wider">Sin Stock</span>
                              )}
                            </div>
                            {t.descripcion && <p className="text-xs text-slate-500 mt-0.5">{t.descripcion}</p>}
                            {section.id === 'inventario' && (
                              <p className="text-[10px] text-slate-400 mt-1 font-medium">Req: {t.cantidadRequerida} | Stock: {t.stockActual}</p>
                            )}
                          </>
                        )}
                      </div>

                      {/* Asignación y acciones */}
                      <div className="flex items-center justify-between md:justify-end gap-3 shrink-0">
                        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5">
                          <Users size={14} className="text-slate-400" />
                          <select
                            className={`bg-transparent text-xs outline-none cursor-pointer ${t.asignadoA ? 'font-semibold text-indigo-700' : 'text-slate-500 font-medium'}`}
                            value={allEmpleados.find(e => e.nombreCompleto === t.asignadoA)?.id || ''}
                            onChange={e => onAssign(t.id, parseInt(e.target.value))}
                          >
                            <option value="">Sin asignar</option>
                            {assignedStaffList.length > 0 && (
                              <optgroup label="Staff Asignado al Evento">
                                {assignedStaffList.map(e => (
                                  <option key={e.id} value={e.id}>{e.nombreCompleto} (Asignado)</option>
                                ))}
                              </optgroup>
                            )}
                            {otherStaffList.length > 0 && (
                              <optgroup label="Resto del Personal">
                                {otherStaffList.map(e => (
                                  <option key={e.id} value={e.id}>{e.nombreCompleto}</option>
                                ))}
                              </optgroup>
                            )}
                            {assignedStaffList.length === 0 && otherStaffList.length === 0 && allEmpleados.map(e => (
                              <option key={e.id} value={e.id}>{e.nombreCompleto}</option>
                            ))}
                          </select>
                        </div>
                        
                        {section.id === 'manual' && !isEditing && (
                          <div className="flex items-center gap-1 border-l border-slate-200 pl-3">
                            <button onClick={() => startEdit(t)} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors" title="Editar"><PenTool size={14} /></button>
                            <button onClick={() => onDelete(t.id)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors" title="Eliminar"><Trash2 size={14} /></button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {activeTareas.length === 0 && (
          <div className="p-12 text-center flex flex-col items-center">
            <div className="w-12 h-12 bg-slate-50 border border-slate-100 rounded-full flex items-center justify-center mb-3">
              <PackageSearch size={24} className="text-slate-300" />
            </div>
            <h4 className="text-sm font-semibold text-slate-700">Sin tareas operativas</h4>
            <p className="text-xs text-slate-500 mt-1 max-w-sm">No se han generado requerimientos de inventario ni tareas manuales para esta fiesta.</p>
          </div>
        )}
      </div>
    </div>
  );
}

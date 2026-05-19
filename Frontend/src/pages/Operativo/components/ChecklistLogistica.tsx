import { useState } from 'react';
import type { ComponentType } from 'react';
import { CheckCircle2, Plus, Trash2, Edit3, Save, X, Users, PackageCheck, Boxes, ClipboardList } from 'lucide-react';
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
  if (tipo === 'servicio') return 'servicio';
  if (tipo === 'inventario' || tarea.articuloId) return 'inventario';
  return 'manual';
};

export default function ChecklistLogistica({ tareas, allEmpleados, onComplete, onAssign, onCreate, onUpdate, onDelete }: Props) {
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

  const handleUpdate = async () => {
    if (!editingId || !editTarea.nombreTarea.trim()) return;
    await onUpdate({ tareaId: editingId, ...editTarea });
    setEditingId(null);
  };

  const sections: TaskSection[] = [
    {
      id: 'servicios',
      title: 'Servicios por entregar',
      description: 'Servicios contratados por paquete o como extra. Marca cada uno cuando esté listo para entregarse al cliente.',
      icon: PackageCheck,
      tasks: tareas.filter(t => normalizeTipoTarea(t) === 'servicio')
    },
    {
      id: 'insumos',
      title: 'Insumos por preparar',
      description: 'Productos o materiales que deben salir de inventario. Al completar una tarea se descuenta el stock.',
      icon: Boxes,
      tasks: tareas.filter(t => normalizeTipoTarea(t) === 'inventario')
    },
    {
      id: 'manuales',
      title: 'Tareas manuales',
      description: 'Trabajo operativo del salón: montaje, limpieza, decoración, pruebas y pendientes internos.',
      icon: ClipboardList,
      tasks: tareas.filter(t => normalizeTipoTarea(t) === 'manual')
    }
  ];

  const renderTask = (tarea: TareaOperativa) => {
    const isDone = tarea.estado === 'Completada';
    const tipo = normalizeTipoTarea(tarea);

    return (
      <div key={tarea.id} className="px-5 py-4 flex items-start gap-4 hover:bg-slate-50 transition-colors group">
        <button
          disabled={isDone}
          onClick={() => onComplete(tarea.id)}
          className={`mt-1 w-8 h-8 rounded-lg border-2 flex items-center justify-center transition-all shrink-0 ${
            isDone ? 'bg-emerald-500 border-emerald-500 text-white shadow-sm' : 'border-slate-200 text-transparent hover:border-blue-500 hover:text-blue-500'
          }`}
          title={isDone ? 'Tarea completada' : 'Marcar como completada'}
        >
          <CheckCircle2 size={18} strokeWidth={3} />
        </button>

        <div className="flex-1 min-w-0 space-y-3">
          {editingId === tarea.id ? (
            <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_180px] gap-3">
              <input
                type="text"
                className="bg-white border border-blue-200 rounded-lg px-3 py-2 text-sm font-bold text-slate-700 outline-none"
                value={editTarea.nombreTarea}
                onChange={e => setEditTarea({ ...editTarea, nombreTarea: e.target.value })}
              />
              <input
                type="text"
                className="bg-white border border-blue-200 rounded-lg px-3 py-2 text-sm text-slate-600 outline-none"
                value={editTarea.descripcion}
                onChange={e => setEditTarea({ ...editTarea, descripcion: e.target.value })}
              />
              <div className="flex gap-2">
                <input
                  type="number"
                  className="bg-white border border-blue-200 rounded-lg px-3 py-2 text-sm font-bold text-slate-700 outline-none w-20"
                  value={editTarea.cantidadRequerida}
                  onChange={e => setEditTarea({ ...editTarea, cantidadRequerida: parseInt(e.target.value) || 0 })}
                />
                <button onClick={handleUpdate} className="bg-emerald-600 text-white px-3 rounded-lg hover:bg-emerald-700" title="Guardar"><Save size={14} /></button>
                <button onClick={() => setEditingId(null)} className="bg-slate-200 text-slate-600 px-3 rounded-lg hover:bg-slate-300" title="Cancelar"><X size={14} /></button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-2">
                <p className={`text-sm font-bold tracking-tight ${isDone ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
                  {tarea.nombre}
                </p>
                <span className={`px-2 py-1 text-xs font-bold rounded-lg border ${
                  isDone ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-slate-50 text-slate-600 border-slate-200'
                }`}>
                  {isDone ? 'Listo' : 'Pendiente'}
                </span>
                {tipo === 'servicio' && (
                  <span className="px-2 py-1 text-xs font-bold rounded-lg border bg-blue-50 text-blue-700 border-blue-100">
                    Servicio contratado
                  </span>
                )}
                {tipo === 'inventario' && (
                  <span className={`px-2 py-1 text-xs font-bold rounded-lg border ${
                    tarea.stockDescontado ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-amber-50 text-amber-700 border-amber-100'
                  }`}>
                    {tarea.stockDescontado ? 'Inventario descontado' : `Preparar ${tarea.cantidadRequerida} unidad${tarea.cantidadRequerida === 1 ? '' : 'es'}`}
                  </span>
                )}
                {tipo === 'manual' && (
                  <span className="px-2 py-1 text-xs font-bold rounded-lg border bg-violet-50 text-violet-700 border-violet-100">
                    Tarea interna
                  </span>
                )}
              </div>

              {tarea.descripcion && <p className="text-xs text-slate-500 leading-relaxed">{tarea.descripcion}</p>}

              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                {tarea.asignadoA ? (
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">
                      {tarea.asignadoA.charAt(0)}
                    </div>
                    <p className="text-xs text-blue-700 font-bold">{tarea.asignadoA}</p>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Users size={13} className="text-slate-300" />
                    <select
                      className="text-xs font-bold text-slate-500 bg-transparent border-b border-slate-200 outline-none cursor-pointer hover:text-blue-600 transition-colors"
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        if (val) onAssign(tarea.id, val);
                        e.target.value = '';
                      }}
                    >
                      <option value="">Asignar responsable...</option>
                      {allEmpleados.map(e => <option key={e.id} value={e.id}>{e.nombreCompleto}</option>)}
                    </select>
                  </div>
                )}

                <div className="flex items-center gap-2 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                  <button onClick={() => startEdit(tarea)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all" title="Editar tarea">
                    <Edit3 size={14} />
                  </button>
                  <button onClick={() => onDelete(tarea.id)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all" title="Eliminar tarea">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-slate-50/40 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <CheckCircle2 size={16} className="text-blue-500" /> Tareas de preparación
            </h3>
            <p className="text-xs text-slate-500 mt-1">Usa esta lista para confirmar que cada servicio, insumo y pendiente interno está listo antes de iniciar.</p>
          </div>
          <button
            onClick={() => setIsAdding(!isAdding)}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition-all shadow-sm"
          >
            {isAdding ? <X size={14} /> : <Plus size={14} />}
            {isAdding ? 'Cancelar' : 'Nueva tarea'}
          </button>
        </div>

        <AnimatePresence>
          {isAdding && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden border-b border-slate-100 bg-blue-50/30"
            >
              <div className="p-5 grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_160px] gap-3">
                <input
                  type="text"
                  placeholder="Nombre de la tarea..."
                  className="bg-white border border-slate-200 rounded-lg px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:border-blue-300"
                  value={newTarea.nombreTarea}
                  onChange={e => setNewTarea({ ...newTarea, nombreTarea: e.target.value })}
                />
                <input
                  type="text"
                  placeholder="Notas o detalle..."
                  className="bg-white border border-slate-200 rounded-lg px-4 py-3 text-sm text-slate-600 outline-none focus:border-blue-300"
                  value={newTarea.descripcion}
                  onChange={e => setNewTarea({ ...newTarea, descripcion: e.target.value })}
                />
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="Cantidad"
                    className="bg-white border border-slate-200 rounded-lg px-3 py-3 text-sm font-bold text-slate-700 outline-none focus:border-blue-300 w-20"
                    value={newTarea.cantidadRequerida}
                    onChange={e => setNewTarea({ ...newTarea, cantidadRequerida: parseInt(e.target.value) || 0 })}
                  />
                  <button
                    onClick={handleCreate}
                    className="flex-1 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 transition-all flex items-center justify-center gap-2"
                  >
                    <Save size={14} /> Guardar
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {sections.map(section => {
        const Icon = section.icon;
        return (
          <section key={section.id} className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 bg-white border-b border-slate-100 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
              <div>
                <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <Icon size={16} className="text-blue-500" /> {section.title}
                </h4>
                <p className="text-xs text-slate-500 mt-1">{section.description}</p>
              </div>
              <span className="text-xs font-bold text-slate-500 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1">
                {section.tasks.filter(t => t.estado === 'Completada').length}/{section.tasks.length} listas
              </span>
            </div>
            <div className="divide-y divide-slate-100">
              {section.tasks.length > 0 ? section.tasks.map(renderTask) : (
                <div className="py-8 px-5 text-sm text-slate-400">
                  No hay elementos en esta sección.
                </div>
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}

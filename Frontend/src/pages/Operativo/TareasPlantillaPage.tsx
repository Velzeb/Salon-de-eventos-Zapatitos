import { useEffect, useState, useMemo } from 'react';
import { 
  ClipboardList, 
  Plus, 
  RefreshCw, 
  ArrowUp, 
  ArrowDown, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff, 
  Sparkles,
  Settings,
  X
} from 'lucide-react';
import { toast } from 'sonner';
import { plantillasService, type TareaPlantilla } from '../../services/operativoService';

export default function TareasPlantillaPage() {
  const [plantillas, setPlantillas] = useState<TareaPlantilla[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlantilla, setEditingPlantilla] = useState<TareaPlantilla | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    faseAplicacion: 'Preparacion' as 'Preparacion' | 'EnVivo',
    activa: true
  });

  const loadPlantillas = async () => {
    setLoading(true);
    try {
      const data = await plantillasService.getAll();
      setPlantillas(data);
    } catch {
      toast.error('Error al cargar las tareas generales');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlantillas();
  }, []);

  const openCreateModal = () => {
    setEditingPlantilla(null);
    setFormData({
      nombre: '',
      descripcion: '',
      faseAplicacion: 'Preparacion',
      activa: true
    });
    setIsModalOpen(true);
  };

  const openEditModal = (p: TareaPlantilla) => {
    setEditingPlantilla(p);
    setFormData({
      nombre: p.nombre,
      descripcion: p.descripcion || '',
      faseAplicacion: p.faseAplicacion,
      activa: p.activa
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nombre.trim()) {
      toast.error('El nombre de la tarea es requerido');
      return;
    }

    try {
      if (editingPlantilla) {
        await plantillasService.update(editingPlantilla.id, formData);
        toast.success('Tarea general actualizada');
      } else {
        await plantillasService.create(formData);
        toast.success('Tarea general creada');
      }
      setIsModalOpen(false);
      loadPlantillas();
    } catch {
      toast.error('Ocurrió un error al guardar la tarea');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('¿Seguro que deseas eliminar esta plantilla de tarea? No afectará a eventos en curso, pero no se agregará a nuevos eventos.')) return;
    try {
      await plantillasService.delete(id);
      toast.success('Tarea general eliminada');
      loadPlantillas();
    } catch {
      toast.error('Error al eliminar la tarea');
    }
  };

  const handleToggleActiva = async (p: TareaPlantilla) => {
    try {
      await plantillasService.update(p.id, {
        nombre: p.nombre,
        descripcion: p.descripcion || '',
        faseAplicacion: p.faseAplicacion,
        activa: !p.activa
      });
      toast.success(p.activa ? 'Tarea desactivada' : 'Tarea activada');
      loadPlantillas();
    } catch {
      toast.error('Error al cambiar el estado');
    }
  };

  const handleReorder = async (id: number, direccion: 'up' | 'down') => {
    try {
      await plantillasService.reorder(id, direccion);
      loadPlantillas();
    } catch {
      toast.error('Error al reordenar la tarea');
    }
  };

  // Clasificar
  const preparacionTareas = useMemo(() => 
    plantillas.filter(p => p.faseAplicacion === 'Preparacion'), 
    [plantillas]
  );
  
  const enVivoTareas = useMemo(() => 
    plantillas.filter(p => p.faseAplicacion === 'EnVivo'), 
    [plantillas]
  );

  return (
    <div className="space-y-8 pb-16 font-sans">
      {/* HEADER */}
      <div className="flex flex-col gap-5 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-5">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
            <ClipboardList size={26} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900">Tareas Generales</h1>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              Configura las tareas base que siempre se agregan a todas las fiestas.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={loadPlantillas}
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50"
            title="Refrescar"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={openCreateModal}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-xs font-black text-white shadow-lg shadow-indigo-600/20 transition hover:bg-indigo-700"
          >
            <Plus size={17} />
            Nueva Tarea General
          </button>
        </div>
      </div>

      {/* METRICS */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-400">Total Plantillas</p>
              <p className="mt-2 text-2xl font-black text-slate-900">{plantillas.length}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-50 text-indigo-600">
              <ClipboardList size={22} />
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-400">Fase Preparación</p>
              <p className="mt-2 text-2xl font-black text-slate-900">{preparacionTareas.length}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-50 text-amber-600">
              <Settings size={22} />
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-400">Fase En Vivo</p>
              <p className="mt-2 text-2xl font-black text-slate-900">{enVivoTareas.length}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-50 text-emerald-600">
              <Sparkles size={22} />
            </div>
          </div>
        </div>
      </div>

      {/* COLUMNS */}
      {loading ? (
        <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-slate-200 bg-white py-24 shadow-sm">
          <RefreshCw className="animate-spin text-indigo-500" size={32} />
          <p className="text-sm font-semibold text-slate-400">Cargando tareas generales...</p>
        </div>
      ) : (
        <div className="grid gap-8 lg:grid-cols-2">
          {/* COL: PREPARACION */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="bg-slate-50/50 px-6 py-5 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-amber-500 animate-pulse" />
                Fase de Preparación
              </h2>
              <p className="text-xs text-slate-500 mt-1">Se agregan al Checklist Logístico inicial.</p>
            </div>
            
            <div className="divide-y divide-slate-100 p-2">
              {preparacionTareas.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-10 font-medium">No hay tareas generales para la fase de preparación.</p>
              ) : (
                preparacionTareas.map((p, idx) => (
                  <TaskRow 
                    key={p.id}
                    task={p}
                    onEdit={() => openEditModal(p)}
                    onDelete={() => handleDelete(p.id)}
                    onToggle={() => handleToggleActiva(p)}
                    onMoveUp={idx > 0 ? () => handleReorder(p.id, 'up') : undefined}
                    onMoveDown={idx < preparacionTareas.length - 1 ? () => handleReorder(p.id, 'down') : undefined}
                  />
                ))
              )}
            </div>
          </div>

          {/* COL: EN VIVO */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="bg-slate-50/50 px-6 py-5 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
                Fase En Vivo (Entrega)
              </h2>
              <p className="text-xs text-slate-500 mt-1">Se agregan al checklist de Entregas durante la fiesta.</p>
            </div>
            
            <div className="divide-y divide-slate-100 p-2">
              {enVivoTareas.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-10 font-medium">No hay tareas generales para la fase en vivo.</p>
              ) : (
                enVivoTareas.map((p, idx) => (
                  <TaskRow 
                    key={p.id}
                    task={p}
                    onEdit={() => openEditModal(p)}
                    onDelete={() => handleDelete(p.id)}
                    onToggle={() => handleToggleActiva(p)}
                    onMoveUp={idx > 0 ? () => handleReorder(p.id, 'up') : undefined}
                    onMoveDown={idx < enVivoTareas.length - 1 ? () => handleReorder(p.id, 'down') : undefined}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-250">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <ClipboardList className="text-indigo-500" size={18} />
                {editingPlantilla ? 'Editar Tarea General' : 'Crear Tarea General'}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 rounded-lg p-1 transition"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-2">Nombre de la Tarea</label>
                <input 
                  type="text"
                  placeholder="Ej. Limpieza profunda del salón"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
                  value={formData.nombre}
                  onChange={e => setFormData({ ...formData, nombre: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-2">Descripción (opcional)</label>
                <textarea 
                  placeholder="Instrucciones adicionales para el staff..."
                  rows={3}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 resize-none"
                  value={formData.descripcion}
                  onChange={e => setFormData({ ...formData, descripcion: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-2">Fase de Aplicación</label>
                  <select
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
                    value={formData.faseAplicacion}
                    onChange={e => setFormData({ ...formData, faseAplicacion: e.target.value as 'Preparacion' | 'EnVivo' })}
                  >
                    <option value="Preparacion">Preparación</option>
                    <option value="EnVivo">En Vivo</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-2">Visibilidad / Estado</label>
                  <select
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
                    value={formData.activa ? 'true' : 'false'}
                    onChange={e => setFormData({ ...formData, activa: e.target.value === 'true' })}
                  >
                    <option value="true">Activa (visible)</option>
                    <option value="false">Inactiva (pausada)</option>
                  </select>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-5 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-3 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-black transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black transition shadow-lg shadow-indigo-600/10"
                >
                  Guardar Tarea
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

interface TaskRowProps {
  task: TareaPlantilla;
  onEdit: () => void;
  onDelete: () => void;
  onToggle: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
}

function TaskRow({ task, onEdit, onDelete, onToggle, onMoveUp, onMoveDown }: TaskRowProps) {
  return (
    <div className={`flex items-center gap-4 p-4 rounded-xl border border-transparent transition hover:border-slate-150 hover:bg-slate-50/50 group ${
      !task.activa ? 'opacity-60 bg-slate-50/20' : 'bg-white'
    }`}>
      {/* Active Indicator / Toggle */}
      <button 
        onClick={onToggle}
        className={`p-1.5 rounded-lg border transition ${
          task.activa 
            ? 'bg-indigo-50 text-indigo-600 border-indigo-100 hover:bg-indigo-100' 
            : 'bg-slate-50 text-slate-400 border-slate-200 hover:bg-slate-100'
        }`}
        title={task.activa ? 'Desactivar tarea' : 'Activar tarea'}
      >
        {task.activa ? <Eye size={15} /> : <EyeOff size={15} />}
      </button>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className={`text-sm font-bold text-slate-800`}>{task.nombre}</p>
          {!task.activa && (
            <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 border border-slate-200 text-[8px] font-black uppercase">Pausada</span>
          )}
        </div>
        {task.descripcion && (
          <p className="text-xs text-slate-500 mt-0.5 truncate max-w-md">{task.descripcion}</p>
        )}
      </div>

      {/* Reorder Buttons */}
      <div className="flex items-center gap-1">
        <button 
          onClick={onMoveUp}
          disabled={!onMoveUp}
          className={`p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-150 transition disabled:opacity-30 disabled:hover:bg-transparent`}
        >
          <ArrowUp size={14} />
        </button>
        <button 
          onClick={onMoveDown}
          disabled={!onMoveDown}
          className={`p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-150 transition disabled:opacity-30 disabled:hover:bg-transparent`}
        >
          <ArrowDown size={14} />
        </button>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 border-l border-slate-200 pl-3">
        <button 
          onClick={onEdit} 
          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition" 
          title="Editar"
        >
          <Edit size={14} />
        </button>
        <button 
          onClick={onDelete} 
          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition" 
          title="Eliminar"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}

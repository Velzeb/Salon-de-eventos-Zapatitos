import { useState, useEffect } from 'react';
import { Clock, Zap, Users, QrCode, Plus, RefreshCw, CheckCircle2, ArrowUp, ArrowDown, Trash2, Save, Play, Square, ListOrdered } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { operativoService, type EventoOperativo, type ActividadCronogramaDto } from '../../../services/operativoService';
import { toast } from 'sonner';

interface Props {
  data: EventoOperativo;
  runningTimers: Record<number, { startTime: number; duration: number; isActive: boolean }>;
  savingCronograma: boolean;
  onToggleTimer: (itemId: number, durationMinutes: number) => void;
  onSaveCronograma: (actividades: Partial<ActividadCronogramaDto>[], msg?: string) => Promise<void>;
  onAutoCronograma: () => void;
  onReload: () => Promise<void>;
  eventoId: number;
}

const formatTimerRemaining = (ms: number) => {
  const totalSecs = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(totalSecs / 60).toString().padStart(2, '0');
  const s = (totalSecs % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
};

const normalizeTime = (time: string) => {
  const [h = '00', m = '00', s = '00'] = time.split(':');
  return `${h.padStart(2, '0')}:${m.padStart(2, '0')}:${s.padStart(2, '00')}`;
};

const getDuracion = (ini: string, fin: string) => {
  const [h1, m1] = ini.split(':').map(Number);
  const [h2, m2] = fin.split(':').map(Number);
  const diff = Math.max(0, (h2 * 60 + m2) - (h1 * 60 + m1));
  return diff ? `${diff} min` : '';
};

export default function DuranteFiestaTab({
  data, runningTimers, savingCronograma, onToggleTimer, onSaveCronograma, onAutoCronograma, onReload, eventoId
}: Props) {
  const [, setTick] = useState(0);
  const [isScanning, setIsScanning] = useState(false);
  const [showManualActivity, setShowManualActivity] = useState(false);
  const [newInvitadoNombre, setNewInvitadoNombre] = useState('');
  const [addingInvitado, setAddingInvitado] = useState(false);
  const [newActividad, setNewActividad] = useState({ nombre: '', descripcion: '', horaInicio: '', horaFin: '' });

  const getEstadoPreparacion = (tareaEntrega: any) => {
    const prep = data.tareas.find(t => 
      t.tipoTarea?.toLowerCase() !== 'entrega' && 
      ((tareaEntrega.articuloId && t.articuloId === tareaEntrega.articuloId) ||
       (tareaEntrega.eventoItemId && t.eventoItemId === tareaEntrega.eventoItemId))
    );

    if (!prep) return 'listo';
    return prep.estado === 'Completada' ? 'listo' : 'pendiente';
  };

  const handleCompleteTarea = async (tareaId: number) => {
    try {
      await operativoService.completeTarea(tareaId);
      toast.success('Estado de entrega actualizado');
      await onReload();
    } catch {
      toast.error('Error al actualizar la entrega');
    }
  };

  // Tick para actualizar timers cada segundo
  useEffect(() => {
    const hasActive = Object.values(runningTimers).some(t => t.isActive);
    if (!hasActive) return;
    const interval = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(interval);
  }, [runningTimers]);

  // QR Scanner
  useEffect(() => {
    let scanner: Html5QrcodeScanner | null = null;
    if (isScanning) {
      scanner = new Html5QrcodeScanner('qr-reader-durante', { fps: 10, qrbox: 250 }, false);
      scanner.render(async (decodedText) => {
        try {
          const msg = await operativoService.registrarIngreso(decodedText);
          toast.success(msg);
          setIsScanning(false);
          await onReload();
        } catch (err: any) {
          toast.error(err.response?.data?.Errors?.[0] || 'QR inválido o ya usado');
        }
      }, () => {});
    }
    return () => { scanner?.clear().catch(() => {}); };
  }, [isScanning]);

  const serviciosConTiempo = data.items.filter(i => i.tipo === 'Servicio' && i.requiereTemporizador);
  const invitadosEnSalon = data.invitados.filter(i => i.ingreso).length;
  const actividadesOrdenadas = [...data.cronograma].sort((a, b) => a.orden - b.orden);
  const actividadesCompletadas = actividadesOrdenadas.filter(a => a.completada).length;
  const progresoAgenda = actividadesOrdenadas.length > 0 ? Math.round((actividadesCompletadas / actividadesOrdenadas.length) * 100) : 0;
  const siguienteActividad = actividadesOrdenadas.find(a => !a.completada);
  const serviciosActivos = serviciosConTiempo.filter(i => runningTimers[i.id]?.isActive).length;

  const handleAddInvitado = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInvitadoNombre.trim()) return;
    setAddingInvitado(true);
    try {
      await operativoService.addInvitados(eventoId, [newInvitadoNombre.trim()]);
      toast.success('Invitado añadido');
      setNewInvitadoNombre('');
      await onReload();
    } catch { toast.error('Error al añadir invitado'); }
    finally { setAddingInvitado(false); }
  };

  const handleManualCheckIn = async (codigoQr: string) => {
    try {
      const msg = await operativoService.registrarIngreso(codigoQr);
      toast.success(msg);
      await onReload();
    } catch (err: any) {
      toast.error(err.response?.data?.Errors?.[0] || 'Error en check-in');
    }
  };

  const handleToggleActividad = async (actId: number) => {
    const actividades = actividadesOrdenadas.map(act => ({
      id: act.id, nombre: act.nombre, descripcion: act.descripcion,
      horaInicio: act.horaInicio, horaFin: act.horaFin, orden: act.orden,
      completada: act.id === actId ? !act.completada : act.completada
    }));
    await onSaveCronograma(actividades);
  };

  const handleAddActividad = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newActividad.nombre.trim() || !newActividad.horaInicio || !newActividad.horaFin) {
      toast.error('Completa nombre, hora de inicio y fin');
      return;
    }
    const actividades = [
      ...actividadesOrdenadas.map(act => ({
        id: act.id, nombre: act.nombre, descripcion: act.descripcion,
        horaInicio: act.horaInicio, horaFin: act.horaFin, orden: act.orden, completada: act.completada
      })),
      {
        nombre: newActividad.nombre.trim(), descripcion: newActividad.descripcion.trim() || undefined,
        horaInicio: newActividad.horaInicio, horaFin: newActividad.horaFin,
        orden: actividadesOrdenadas.length + 1, completada: false
      }
    ].sort((a, b) => normalizeTime(a.horaInicio).localeCompare(normalizeTime(b.horaInicio)));
    await onSaveCronograma(actividades, 'Actividad agregada');
    setNewActividad({ nombre: '', descripcion: '', horaInicio: '', horaFin: '' });
    setShowManualActivity(false);
  };

  const handleMoveActividad = async (actId: number, dir: 'up' | 'down') => {
    const acts = [...actividadesOrdenadas.map(a => ({
      id: a.id, nombre: a.nombre, descripcion: a.descripcion,
      horaInicio: a.horaInicio, horaFin: a.horaFin, orden: a.orden, completada: a.completada
    }))];
    const idx = acts.findIndex(a => a.id === actId);
    const to = dir === 'up' ? idx - 1 : idx + 1;
    if (idx < 0 || to < 0 || to >= acts.length) return;
    [acts[idx], acts[to]] = [acts[to], acts[idx]];
    await onSaveCronograma(acts, 'Orden actualizado');
  };

  const handleDeleteActividad = async (actId: number) => {
    if (!confirm('¿Eliminar esta actividad?')) return;
    const acts = actividadesOrdenadas
      .filter(a => a.id !== actId)
      .map(a => ({ id: a.id, nombre: a.nombre, descripcion: a.descripcion, horaInicio: a.horaInicio, horaFin: a.horaFin, orden: a.orden, completada: a.completada }));
    await onSaveCronograma(acts, 'Actividad eliminada');
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Dashboard counters */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Servicios activos', value: `${serviciosActivos}/${serviciosConTiempo.length}`, color: 'text-indigo-600', icon: Play },
          { label: 'Progreso agenda', value: `${progresoAgenda}%`, color: progresoAgenda === 100 ? 'text-emerald-600' : 'text-slate-800', icon: ListOrdered },
          { label: 'En salón', value: `${invitadosEnSalon}/${data.invitados.length}`, color: 'text-amber-600', icon: Users },
          { label: 'Siguiente', value: siguienteActividad?.nombre || 'Todo listo', color: 'text-slate-700', icon: Clock },
        ].map(stat => (
          <div key={stat.label} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <stat.icon size={14} className="text-slate-400" />
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{stat.label}</p>
            </div>
            <p className={`text-base font-bold truncate ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] gap-6">
        {/* Servicios con temporizador */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm flex flex-col">
          <div className="p-5 border-b border-slate-100 bg-slate-50/50">
            <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
              <Clock size={16} className="text-indigo-500" /> Control de Tiempos
            </h3>
            <p className="text-xs text-slate-500 mt-1">Inicia el cronómetro cuando empiece a correr el tiempo del servicio.</p>
          </div>
          <div className="p-5 space-y-4">
            {serviciosConTiempo.length > 0 ? serviciosConTiempo.map(item => {
              const timer = runningTimers[item.id];
              const isActive = Boolean(timer?.isActive);
              const remaining = timer ? Math.max(0, timer.startTime + timer.duration - Date.now()) : item.duracionMinutos * 60 * 1000;
              const progress = timer ? Math.min(100, Math.max(0, ((timer.duration - remaining) / timer.duration) * 100)) : 0;
              return (
                <div key={item.id} className={`rounded-lg border p-4 transition-colors ${isActive ? 'border-indigo-300 bg-indigo-50/30 shadow-sm' : 'border-slate-200 bg-white'}`}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 shrink-0 overflow-hidden shadow-sm">
                      {item.imagenUrl ? (
                        <img src={item.imagenUrl} alt={item.nombre} className="w-full h-full object-cover" />
                      ) : <Clock size={18} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-900 truncate">{item.nombre}</p>
                      <p className="text-xs text-slate-500">{item.duracionMinutos} minutos asignados</p>
                    </div>
                    <span className={`px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded shrink-0 border ${isActive ? 'bg-indigo-600 text-white border-indigo-700' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                      {isActive ? 'Activo' : 'Pausado'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs font-bold mb-1.5">
                    <span className={`text-xl ${isActive ? 'text-indigo-600' : 'text-slate-500'} font-mono tracking-tight`}>{formatTimerRemaining(remaining)}</span>
                    <span className="text-slate-400">{Math.round(progress)}%</span>
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden mb-4">
                    <div className={`h-full transition-all ${isActive ? 'bg-indigo-500' : 'bg-slate-300'}`} style={{ width: `${progress}%` }} />
                  </div>
                  <button
                    onClick={() => onToggleTimer(item.id, item.duracionMinutos)}
                    className={`w-full py-2.5 rounded text-xs font-bold transition-colors flex items-center justify-center gap-2 border ${
                      isActive 
                        ? 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50' 
                        : 'bg-indigo-600 border-indigo-700 text-white hover:bg-indigo-700 shadow-sm'
                    }`}
                  >
                    {isActive ? <><Square size={14} className="fill-current" /> Detener Tiempo</> : <><Play size={14} className="fill-current" /> Iniciar Tiempo</>}
                  </button>
                </div>
              );
            }) : (
              <div className="py-12 text-center border border-dashed border-slate-200 rounded-lg bg-slate-50">
                <Clock size={24} className="mx-auto text-slate-300 mb-2" />
                <p className="text-sm font-medium text-slate-600">No hay servicios cronometrados</p>
                <p className="text-xs text-slate-400">Los servicios que requieran temporizador aparecerán aquí.</p>
              </div>
            )}
          </div>
        </div>

        {/* Agenda */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm flex flex-col">
          <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                <ListOrdered size={16} className="text-slate-400" /> Agenda del Evento
              </h3>
            </div>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => setShowManualActivity(v => !v)} className="bg-white border border-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 px-3 py-1.5 rounded hover:bg-slate-50 transition-colors shadow-sm">
                <Plus size={14} /> Tarea Manual
              </button>
              <button onClick={onAutoCronograma} disabled={savingCronograma} className="bg-slate-900 text-white border border-slate-800 text-xs font-semibold flex items-center gap-1.5 px-3 py-1.5 rounded hover:bg-slate-800 transition-colors disabled:opacity-60 shadow-sm">
                {savingCronograma ? <RefreshCw size={14} className="animate-spin" /> : <Zap size={14} />} Auto-generar
              </button>
            </div>
          </div>

          <AnimatePresence>
            {showManualActivity && (
              <motion.form
                initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }} className="overflow-hidden border-b border-slate-100 bg-slate-50"
                onSubmit={handleAddActividad}
              >
                <div className="p-4 grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_100px_100px_80px] gap-3">
                  <input type="text" className="bg-white border border-slate-200 rounded px-3 py-2 text-sm font-medium text-slate-800 outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-100" placeholder="Nombre de la actividad" value={newActividad.nombre} onChange={e => setNewActividad({ ...newActividad, nombre: e.target.value })} />
                  <input type="time" className="bg-white border border-slate-200 rounded px-3 py-2 text-sm font-bold text-slate-700 outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-100" value={newActividad.horaInicio} onChange={e => setNewActividad({ ...newActividad, horaInicio: e.target.value })} />
                  <input type="time" className="bg-white border border-slate-200 rounded px-3 py-2 text-sm font-bold text-slate-700 outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-100" value={newActividad.horaFin} onChange={e => setNewActividad({ ...newActividad, horaFin: e.target.value })} />
                  <button type="submit" disabled={savingCronograma} className="bg-indigo-600 text-white rounded text-xs font-bold flex items-center justify-center gap-1 hover:bg-indigo-700 disabled:opacity-60 shadow-sm">
                    <Save size={14} />
                  </button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>

          {actividadesOrdenadas.length > 0 ? (
            <div className="flex-1 flex flex-col min-h-0">
              <div className="px-5 py-4 border-b border-slate-100">
                <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">
                  <span>Progreso de la agenda</span>
                  <span className="text-indigo-600">{progresoAgenda}%</span>
                </div>
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-500 rounded-full transition-all duration-500" style={{ width: `${progresoAgenda}%` }} />
                </div>
              </div>
              <div className="flex-1 overflow-y-auto min-h-[300px] p-2">
                <div className="relative border-l-2 border-slate-100 ml-4 py-2 space-y-4">
                  {actividadesOrdenadas.map((act, index) => (
                    <div key={act.id} className="relative pl-6 pr-2 group">
                      {/* Timeline dot/checkbox */}
                      <div className="absolute left-[-11px] top-1.5 bg-white p-0.5">
                        <button
                          onClick={() => handleToggleActividad(act.id!)}
                          disabled={savingCronograma}
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                            act.completada ? 'bg-indigo-500 border-indigo-500 text-white' : 'border-slate-300 text-transparent hover:border-indigo-400'
                          }`}
                        >
                          <CheckCircle2 size={12} strokeWidth={3} />
                        </button>
                      </div>

                      <div className={`p-3 rounded-lg border transition-all ${act.completada ? 'bg-slate-50 border-slate-100 opacity-60' : 'bg-white border-slate-200 shadow-sm hover:border-indigo-200'}`}>
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-bold text-slate-700 font-mono tracking-tight">{act.horaInicio}</span>
                              <span className="text-slate-300">-</span>
                              <span className="text-xs font-bold text-slate-500 font-mono tracking-tight">{act.horaFin}</span>
                              {getDuracion(act.horaInicio, act.horaFin) && (
                                <span className="text-[10px] text-slate-400 ml-1">({getDuracion(act.horaInicio, act.horaFin)})</span>
                              )}
                            </div>
                            <p className={`text-sm font-bold ${act.completada ? 'text-slate-500 line-through' : 'text-slate-900'}`}>{act.nombre}</p>
                            {act.descripcion && <p className="text-xs text-slate-500 mt-1">{act.descripcion}</p>}
                          </div>
                          
                          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => handleMoveActividad(act.id!, 'up')} disabled={savingCronograma || index === 0} className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded" title="Subir"><ArrowUp size={14} /></button>
                            <button onClick={() => handleMoveActividad(act.id!, 'down')} disabled={savingCronograma || index === actividadesOrdenadas.length - 1} className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded" title="Bajar"><ArrowDown size={14} /></button>
                            <button onClick={() => handleDeleteActividad(act.id!)} disabled={savingCronograma} className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded ml-1" title="Eliminar"><Trash2 size={14} /></button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center border-t border-slate-100">
              <ListOrdered size={24} className="mx-auto text-slate-300 mb-3" />
              <h4 className="text-sm font-semibold text-slate-700">Sin actividades en la agenda</h4>
              <p className="text-xs text-slate-500 mt-1 mb-4">La línea de tiempo del evento está vacía.</p>
              <button onClick={onAutoCronograma} disabled={savingCronograma} className="bg-slate-900 text-white text-xs font-semibold px-4 py-2 rounded hover:bg-slate-800 disabled:opacity-60 transition-colors shadow-sm">
                {savingCronograma ? 'Generando...' : 'Generar agenda estándar'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Control de Entrega de Insumos y Servicios */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
              <Zap size={16} className="text-indigo-500" /> Control de Entrega de Insumos y Servicios
            </h3>
            <p className="text-xs text-slate-500 mt-1">Lleva el control de qué productos y servicios han sido entregados a la mesa o cliente durante el evento.</p>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 border border-slate-200 rounded px-2.5 py-1 text-slate-500">
            {data.tareas.filter(t => t.tipoTarea?.toLowerCase() === 'entrega' && t.estado === 'Completada').length} / {data.tareas.filter(t => t.tipoTarea?.toLowerCase() === 'entrega').length} Entregados
          </span>
        </div>

        <div className="p-5 font-sans">
          {data.tareas.filter(t => t.tipoTarea?.toLowerCase() === 'entrega').length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data.tareas.filter(t => t.tipoTarea?.toLowerCase() === 'entrega').map(t => {
                const completada = t.estado === 'Completada';
                const estadoPrep = getEstadoPreparacion(t);
                
                return (
                  <div 
                    key={t.id} 
                    className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${
                      completada 
                        ? 'bg-emerald-50/30 border-emerald-100 opacity-85' 
                        : estadoPrep === 'pendiente'
                        ? 'bg-amber-50/10 border-slate-200 hover:border-amber-200'
                        : 'bg-white border-slate-200 hover:border-indigo-200 hover:shadow-sm'
                    }`}
                  >
                    {/* Checkbox */}
                    <button
                      onClick={() => {
                        if (completada) {
                          if (!window.confirm('Esta tarea pasará a no hecha. ¿Deseas continuar?')) return;
                        }
                        handleCompleteTarea(t.id);
                      }}
                      className={`w-6 h-6 rounded flex items-center justify-center shrink-0 border transition-all ${
                        completada 
                          ? 'bg-emerald-600 border-emerald-600 text-white' 
                          : 'bg-white border-slate-300 hover:border-indigo-400'
                      }`}
                    >
                      {completada && (
                        <svg className="w-4 h-4 text-white" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </button>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-bold ${completada ? 'text-slate-500 line-through' : 'text-slate-800'}`}>
                        {t.nombre}
                      </p>
                      {t.descripcion && <p className="text-xs text-slate-500 mt-0.5">{t.descripcion}</p>}
                      <p className="text-[10px] text-slate-400 mt-1 font-semibold">Cantidad Requerida: {t.cantidadRequerida}</p>
                    </div>

                    {/* Estado Badge */}
                    <div className="shrink-0">
                      {completada ? (
                        <span className="inline-flex px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Entregado
                        </span>
                      ) : estadoPrep === 'pendiente' ? (
                        <span className="inline-flex px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200 animate-pulse">
                          Prep. Pendiente
                        </span>
                      ) : (
                        <span className="inline-flex px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200">
                          Listo p/ Entregar
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-8 text-center text-sm text-slate-500 border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
              No hay insumos ni servicios configurados para entrega.
            </div>
          )}
        </div>
      </div>

      {/* Invitados */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
              <Users size={16} className="text-slate-400" /> Control de Accesos
            </h3>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-slate-100 border border-slate-200 px-3 py-1.5 rounded flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-600">En salón:</span>
              <span className="text-sm font-bold text-slate-900">{invitadosEnSalon} / {data.invitados.length}</span>
            </div>
            {!isScanning && (
              <button onClick={() => setIsScanning(true)} className="bg-indigo-600 text-white px-3 py-1.5 rounded text-xs font-semibold hover:bg-indigo-700 transition-colors shadow-sm flex items-center gap-1.5" title="Escanear QR">
                <QrCode size={14} /> Escanear QR
              </button>
            )}
          </div>
        </div>

        {isScanning && (
          <div className="bg-slate-900 p-6">
            <div className="flex justify-between items-center mb-4 max-w-sm mx-auto">
              <h4 className="text-sm font-bold text-white flex items-center gap-2"><QrCode size={16} className="text-indigo-400" /> Escáner Activo</h4>
              <button onClick={() => setIsScanning(false)} className="text-slate-400 hover:text-white text-xs font-semibold transition-colors">Cerrar</button>
            </div>
            <div id="qr-reader-durante" className="mx-auto max-w-sm rounded-lg overflow-hidden bg-black border border-slate-800" />
          </div>
        )}

        <div className="p-4 border-b border-slate-100 bg-white">
          <form className="flex gap-3 max-w-xl" onSubmit={handleAddInvitado}>
            <input type="text" className="flex-1 bg-white border border-slate-200 rounded px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-100 shadow-sm" placeholder="Nombre completo del invitado a agregar..." value={newInvitadoNombre} onChange={e => setNewInvitadoNombre(e.target.value)} />
            <button type="submit" disabled={addingInvitado || !newInvitadoNombre.trim()} className="bg-slate-900 text-white px-4 py-2 rounded text-xs font-semibold hover:bg-slate-800 disabled:opacity-50 transition-colors shadow-sm">
              {addingInvitado ? <RefreshCw className="animate-spin" size={14} /> : 'Añadir a lista'}
            </button>
          </form>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-5 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest w-1/2">Nombre</th>
                <th className="px-5 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center w-1/4">Estado</th>
                <th className="px-5 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right w-1/4">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.invitados.map(inv => (
                <tr key={inv.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => window.open(`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${inv.codigoQr}`, '_blank')}
                        className="w-7 h-7 bg-white border border-slate-200 rounded flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:border-indigo-300 transition-colors shadow-sm"
                        title="Ver QR de acceso"
                      >
                        <QrCode size={12} />
                      </button>
                      <p className="font-semibold text-slate-800">{inv.nombre}</p>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-center">
                    <span className={`inline-flex px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded border ${inv.ingreso ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-50 text-slate-500 border-slate-200'}`}>
                      {inv.ingreso ? 'En salón' : 'Por llegar'}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    {!inv.ingreso ? (
                      <button onClick={() => handleManualCheckIn(inv.codigoQr)} className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 rounded text-xs font-semibold hover:bg-slate-50 hover:border-indigo-300 hover:text-indigo-700 transition-all shadow-sm">
                        Dar Ingreso Manual
                      </button>
                    ) : (
                      <div className="text-right">
                        <p className="text-xs font-semibold text-slate-700">{inv.fechaIngreso ? new Date(inv.fechaIngreso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}</p>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {data.invitados.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-5 py-12 text-center">
                    <Users size={20} className="mx-auto text-slate-300 mb-2" />
                    <p className="text-sm text-slate-500">No hay invitados registrados en la lista.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, 
  Trash2, 
  Save, 
  Clock, 
  Copy, 
  ChevronRight, 
  AlertTriangle,
  History,
  Check,
  LayoutGrid,
  Calendar,
  Sun,
  Sunset,
  Moon,
  Timer
} from 'lucide-react';
import { disponibilidadService } from '../../../services/disponibilidadService';
import type { DisponibilidadConfig } from '../../../services/disponibilidadService';
import { toast } from 'sonner';

const ConfiguracionHorarios: React.FC = () => {
  const [configs, setConfigs] = useState<DisponibilidadConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeDay, setActiveDay] = useState<number>(1);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    loadConfigs();
  }, []);

  const loadConfigs = async () => {
    setLoading(true);
    try {
      const data = await disponibilidadService.getConfigs();
      setConfigs(data);
      setHasChanges(false);
    } catch (e) {
      toast.error('Error al cargar configuraciones');
    } finally {
      setLoading(false);
    }
  };

  const handleAddShift = (diaId: number, preset?: { start: string, end: string, name: string }) => {
    const newShift: DisponibilidadConfig = {
      id: Math.random() * -1,
      diaSemana: diaId,
      horaInicio: preset?.start || '09:00:00',
      horaFin: preset?.end || '13:00:00',
      nombreBloque: preset?.name || `Turno ${configs.filter(c => c.diaSemana === diaId).length + 1}`,
      activo: true
    };
    setConfigs([...configs, newShift]);
    setHasChanges(true);
  };

  const handleRemoveShift = (id: number) => {
    setConfigs(configs.filter(c => c.id !== id));
    setHasChanges(true);
  };

  const handleUpdateField = (id: number, field: keyof DisponibilidadConfig, value: any) => {
    setConfigs(configs.map(c => c.id === id ? { ...c, [field]: value } : c));
    setHasChanges(true);
  };

  const calculateDuration = (start: string, end: string) => {
    const [h1, m1] = start.split(':').map(Number);
    const [h2, m2] = end.split(':').map(Number);
    const totalMinutes = (h2 * 60 + m2) - (h1 * 60 + m1);
    if (totalMinutes <= 0) return 'Horario inválido';
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    return `${h}h ${m > 0 ? m + 'm' : ''}`;
  };

  const handleSaveDay = async () => {
    setSaving(true);
    try {
      const dayTurnos = configs.filter(c => c.diaSemana === activeDay);
      await disponibilidadService.saveBulkDay(activeDay, dayTurnos);
      toast.success(`Horarios de ${getDiaName(activeDay)} actualizados`);
      await loadConfigs();
    } catch (e) {
      toast.error('Error al guardar horarios');
    } finally {
      setSaving(false);
    }
  };

  const copyDayToAll = async () => {
    const currentDayConfigs = configs.filter(c => c.diaSemana === activeDay);
    if (currentDayConfigs.length === 0) return;

    setSaving(true);
    try {
      for (let day of [1, 2, 3, 4, 5, 6, 0]) {
        if (day === activeDay) continue;
        await disponibilidadService.saveBulkDay(day, currentDayConfigs.map(c => ({ ...c, id: 0, diaSemana: day })));
      }
      toast.success('Horarios replicados a toda la semana');
      await loadConfigs();
    } catch (e) {
      toast.error('Error al replicar horarios');
    } finally {
      setSaving(false);
    }
  };

  const getDiaName = (id: number) => ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'][id];

  const conflicts = useMemo(() => {
    const dayConfigs = configs.filter(c => c.diaSemana === activeDay);
    const conflictIds: number[] = [];

    for (let i = 0; i < dayConfigs.length; i++) {
      for (let j = i + 1; j < dayConfigs.length; j++) {
        const a = dayConfigs[i];
        const b = dayConfigs[j];
        if (a.horaInicio < b.horaFin && a.horaFin > b.horaInicio) {
          conflictIds.push(a.id, b.id);
        }
      }
    }
    return new Set(conflictIds);
  }, [configs, activeDay]);

  const timelinePercentage = (time: string) => {
    const [h, m] = time.split(':').map(Number);
    return ((h * 60 + m) / (24 * 60)) * 100;
  };

  if (loading) {
    return (
      <div className="py-40 flex flex-col items-center justify-center space-y-6 bg-white rounded-2xl border border-slate-100">
        <div className="w-12 h-12 border-4 border-slate-100 border-t-slate-900 rounded-full animate-spin" />
        <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Cargando Mapa de Tiempo...</p>
      </div>
    );
  }

  const activeDayConfigs = configs.filter(c => c.diaSemana === activeDay);

  return (
    <div className="flex flex-col h-[720px] bg-white border border-slate-200 rounded-2xl overflow-hidden font-sans">
      {/* HEADER: DISEÑO MÁS INTUITIVO */}
      <div className="px-8 py-6 border-b border-slate-100 bg-slate-50/50 flex flex-col lg:flex-row lg:items-center justify-between gap-6 shrink-0">
        <div className="flex items-center gap-5">
          <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
            <Clock size={24} />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">Agenda Maestra</h2>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider flex items-center gap-2">
              {getDiaName(activeDay)} 
              <span className="w-1 h-1 bg-slate-300 rounded-full" /> 
              {activeDayConfigs.length} Turnos definidos
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {hasChanges && (
            <button 
              onClick={loadConfigs}
              className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-200 transition-all"
            >
              Cancelar
            </button>
          )}
          <button 
            onClick={copyDayToAll}
            disabled={saving || activeDayConfigs.length === 0}
            className="px-5 py-2.5 bg-indigo-50 text-indigo-600 rounded-xl text-xs font-bold hover:bg-indigo-600 hover:text-white transition-all flex items-center gap-2 disabled:opacity-50"
          >
            <Copy size={16} /> Replicar en Semana
          </button>
          <button 
            onClick={handleSaveDay}
            disabled={saving || !hasChanges || conflicts.size > 0}
            className={`px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-xl flex items-center gap-2 ${
              hasChanges && conflicts.size === 0 ? 'bg-slate-900 text-white hover:scale-105 active:scale-95 shadow-slate-900/20' : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
            }`}
          >
            <Save size={16} /> Guardar Cambios
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* SIDEBAR: SELECTOR GRÁFICO */}
        <div className="w-64 border-r border-slate-100 p-6 space-y-2 bg-slate-50/20 overflow-y-auto shrink-0">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-2 mb-4">Selector de Día</p>
          {[1, 2, 3, 4, 5, 6, 0].map((id) => {
            const name = getDiaName(id);
            const count = configs.filter(c => c.diaSemana === id).length;
            const isActive = activeDay === id;
            
            return (
              <button
                key={id}
                onClick={() => setActiveDay(id)}
                className={`w-full flex items-center justify-between px-5 py-4 rounded-2xl transition-all ${
                  isActive ? 'bg-slate-900 text-white shadow-xl shadow-slate-900/10' : 'text-slate-500 hover:bg-white hover:text-slate-900 hover:shadow-sm'
                }`}
              >
                <span className="font-bold text-sm">{name}</span>
                {count > 0 && (
                  <div className={`w-6 h-6 flex items-center justify-center rounded-lg text-[10px] font-black ${isActive ? 'bg-indigo-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
                    {count}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* ÁREA DE TRABAJO: MÁS VISUAL Y AMIGABLE */}
        <div className="flex-1 p-8 overflow-y-auto bg-white">
          <div className="max-w-4xl mx-auto space-y-10">
            
            {/* PANEL DE ACCIONES RÁPIDAS (PRESETS) */}
            <div className="bg-slate-50/50 rounded-3xl p-6 border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-1">Añadir con un clic</h3>
                <p className="text-xs text-slate-400 font-medium tracking-tight">Usa presets para configurar turnos estándar rápidamente</p>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => handleAddShift(activeDay, { start: '09:00:00', end: '13:00:00', name: 'Turno Mañana' })}
                  className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-black text-slate-600 hover:border-indigo-500 hover:text-indigo-600 transition-all flex items-center gap-2 shadow-sm"
                >
                  <Sun size={14} /> Mañana
                </button>
                <button 
                  onClick={() => handleAddShift(activeDay, { start: '14:00:00', end: '18:00:00', name: 'Turno Tarde' })}
                  className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-black text-slate-600 hover:border-indigo-500 hover:text-indigo-600 transition-all flex items-center gap-2 shadow-sm"
                >
                  <Sunset size={14} /> Tarde
                </button>
                <button 
                  onClick={() => handleAddShift(activeDay, { start: '18:30:00', end: '22:30:00', name: 'Turno Noche' })}
                  className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-black text-slate-600 hover:border-indigo-500 hover:text-indigo-600 transition-all flex items-center gap-2 shadow-sm"
                >
                  <Moon size={14} /> Noche
                </button>
                <div className="w-px h-8 bg-slate-200 mx-2" />
                <button 
                  onClick={() => handleAddShift(activeDay)}
                  className="px-5 py-2.5 bg-slate-900 text-white rounded-xl text-[10px] font-black hover:bg-indigo-600 transition-all flex items-center gap-2 shadow-lg shadow-slate-900/10"
                >
                  <Plus size={16} /> Personalizado
                </button>
              </div>
            </div>

            {/* LISTA DE TURNOS: GRID CON MAPA VISUAL */}
            <div className="space-y-6">
              {activeDayConfigs.length === 0 ? (
                <div className="py-24 flex flex-col items-center text-center space-y-6 opacity-30">
                  <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center text-slate-300">
                    <Clock size={48} />
                  </div>
                  <p className="text-lg font-bold text-slate-400">El local está cerrado este día</p>
                </div>
              ) : (
                activeDayConfigs.map((config) => {
                  const isConflict = conflicts.has(config.id);
                  const startPos = timelinePercentage(config.horaInicio);
                  const endPos = timelinePercentage(config.horaFin);
                  const duration = calculateDuration(config.horaInicio, config.horaFin);
                  
                  return (
                    <div 
                      key={config.id} 
                      className={`relative group rounded-3xl border-2 p-8 transition-all duration-500 ${
                        isConflict ? 'border-rose-400 bg-rose-50/30' : 'border-slate-100 bg-white hover:border-slate-200 shadow-sm hover:shadow-xl'
                      }`}
                    >
                      {/* MAPA VISUAL DE TIEMPO (AHORA INTERACTIVO) */}
                      <div className="mb-8 space-y-3">
                        <div className="flex items-center justify-between text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">
                          <span>00:00</span>
                          <span>06:00</span>
                          <span>12:00</span>
                          <span>18:00</span>
                          <span>23:59</span>
                        </div>
                        <div className="relative h-4 bg-slate-100 rounded-full border border-slate-200 shadow-inner overflow-hidden">
                          {/* GRID DE REFERENCIA */}
                          <div className="absolute inset-0 flex justify-between px-[25%] opacity-10 pointer-events-none">
                            <div className="w-px h-full bg-slate-900" />
                            <div className="w-px h-full bg-slate-900" />
                          </div>
                          {/* BLOQUE ACTIVO */}
                          <div 
                            className={`h-full transition-all duration-700 shadow-lg ${isConflict ? 'bg-gradient-to-r from-rose-500 to-rose-600' : 'bg-gradient-to-r from-indigo-500 to-indigo-600'}`}
                            style={{ left: `${startPos}%`, width: `${endPos - startPos}%`, position: 'absolute' }}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] items-end gap-10">
                        <div className="space-y-6">
                          <div className="flex items-center gap-4">
                            <input 
                              value={config.nombreBloque}
                              onChange={e => handleUpdateField(config.id, 'nombreBloque', e.target.value)}
                              className="flex-1 bg-transparent text-2xl font-black text-slate-900 outline-none border-b-2 border-transparent focus:border-indigo-500 transition-all placeholder:text-slate-200 uppercase tracking-tighter"
                              placeholder="NOMBRE DEL BLOQUE"
                            />
                            {isConflict && (
                              <div className="flex items-center gap-2 px-4 py-2 bg-rose-500 text-white rounded-xl animate-pulse">
                                <AlertTriangle size={14} />
                                <span className="text-[10px] font-black uppercase tracking-tight">Solapado</span>
                              </div>
                            )}
                          </div>
                          
                          <div className="flex flex-wrap items-center gap-10">
                            <div className="space-y-3">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Hora Inicio</label>
                              <div className="flex items-center gap-3 bg-slate-50 px-4 py-3 rounded-2xl border border-slate-200 focus-within:border-indigo-500 transition-all shadow-sm">
                                <Clock size={16} className="text-slate-400" />
                                <input 
                                  type="time" 
                                  value={config.horaInicio.substring(0, 5)} 
                                  onChange={e => handleUpdateField(config.id, 'horaInicio', e.target.value + ':00')}
                                  className="bg-transparent text-sm font-black text-slate-700 outline-none w-[70px]"
                                />
                              </div>
                            </div>

                            <div className="space-y-3">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Hora Fin</label>
                              <div className="flex items-center gap-3 bg-slate-50 px-4 py-3 rounded-2xl border border-slate-200 focus-within:border-indigo-500 transition-all shadow-sm">
                                <Clock size={16} className="text-slate-400" />
                                <input 
                                  type="time" 
                                  value={config.horaFin.substring(0, 5)} 
                                  onChange={e => handleUpdateField(config.id, 'horaFin', e.target.value + ':00')}
                                  className="bg-transparent text-sm font-black text-slate-700 outline-none w-[70px]"
                                />
                              </div>
                            </div>

                            <div className="space-y-3">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Duración Total</label>
                              <div className="flex items-center gap-3 px-6 py-3 bg-indigo-50 text-indigo-600 rounded-2xl border border-indigo-100 font-black text-sm">
                                <Timer size={16} />
                                {duration}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 pb-1">
                          <button
                            onClick={() => handleUpdateField(config.id, 'activo', !config.activo)}
                            className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border-2 shadow-sm ${
                              config.activo ? 'bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-100' : 'bg-slate-100 text-slate-400 border-slate-200 hover:bg-slate-200'
                            }`}
                          >
                            {config.activo ? 'Activo' : 'Desactivado'}
                          </button>
                          <button 
                            onClick={() => handleRemoveShift(config.id)}
                            className="w-12 h-12 bg-rose-50 text-rose-400 rounded-2xl flex items-center justify-center hover:bg-rose-600 hover:text-white transition-all active:scale-95 shadow-sm"
                            title="Eliminar Bloque"
                          >
                            <Trash2 size={20} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* FOOTER DE ESTADO OPERATIVO */}
            <div className="p-10 bg-slate-900 rounded-[3rem] text-white flex flex-col md:flex-row items-center justify-between gap-10 overflow-hidden relative shadow-2xl">
              <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
              <div className="flex items-center gap-6 relative z-10">
                <div className="w-16 h-16 bg-white/10 backdrop-blur-xl rounded-3xl flex items-center justify-center text-indigo-400 border border-white/10">
                  <Check size={32} />
                </div>
                <div>
                  <h4 className="text-xl font-black tracking-tight uppercase italic">Configuración Validada</h4>
                  <p className="text-[11px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-1">
                    {activeDayConfigs.filter(c => c.activo).length} Bloques activos para este día
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-12 relative z-10">
                <div className="text-center">
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">Estado General</p>
                  <p className={`text-sm font-black uppercase px-4 py-1.5 rounded-full ${conflicts.size > 0 ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'}`}>
                    {conflicts.size > 0 ? 'Conflictos Detectados' : 'Optimizado'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfiguracionHorarios;

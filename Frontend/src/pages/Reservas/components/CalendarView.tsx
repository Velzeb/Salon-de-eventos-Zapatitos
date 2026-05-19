import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Plus, ArrowRight, X, Clock, CalendarDays, Globe } from 'lucide-react';
import type { Evento } from '../../../services/eventosService';
import { motion, AnimatePresence } from 'framer-motion';
import { getEstadoEventoBadgeClasses, normalizeEstadoEvento } from '../../../utils/estadoEvento';

interface CalendarViewProps {
  eventos: Evento[];
  onDateSelect: (date: Date) => void;
}

const CalendarView = ({ eventos, onDateSelect }: CalendarViewProps) => {
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // MODAL STATE
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [showDayModal, setShowDayModal] = useState(false);

  const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const totalDays = daysInMonth(year, month);
  const startDay = firstDayOfMonth(year, month);

  const monthNames = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ];

  const getEventsForDay = (day: number) => {
    return eventos.filter(e => {
      const eDate = new Date(e.fechaEvento);
      return eDate.getDate() === day && 
             eDate.getMonth() === month && 
             eDate.getFullYear() === year;
    });
  };

  const handleDayClick = (day: number) => {
    const date = new Date(year, month, day);
    setSelectedDay(date);
    setShowDayModal(true);
  };

  const renderDays = () => {
    const days = [];
    for (let i = 0; i < startDay; i++) {
      days.push(<div key={`empty-${i}`} className="aspect-square bg-slate-50/20 border-l border-t border-slate-100/50"></div>);
    }

    for (let day = 1; day <= totalDays; day++) {
      const dayEvents = getEventsForDay(day);
      const isToday = new Date().toDateString() === new Date(year, month, day).toDateString();

      days.push(
        <div 
          key={day} 
          className={`aspect-square p-4 border-l border-t border-slate-100/50 cursor-pointer transition-all hover:bg-primary/5 group relative overflow-hidden ${isToday ? 'bg-primary/5' : 'bg-white'}`}
          onClick={() => handleDayClick(day)}
        >
          <div className="flex flex-col h-full justify-between relative z-10">
            <span className={`text-xs font-bold ${isToday ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-800'} transition-colors`}>
              {day.toString().padStart(2, '0')}
            </span>
            <div className="flex flex-col gap-1.5 overflow-hidden">
              {dayEvents.slice(0, 3).map(e => {
                const estadoKey = normalizeEstadoEvento(e.estado);
                const isNewOnline = e.origen.toLowerCase() === 'online' && estadoKey === 'provisional';
                
                return (
                  <div 
                    key={e.id} 
                    onClick={(ev) => {
                      ev.stopPropagation();
                      navigate(`/admin/operativo/${e.id}`);
                    }}
                    className={`px-2 py-1 rounded text-xs font-bold truncate transition-all active:scale-95 flex items-center justify-between group/event relative border ${getEstadoEventoBadgeClasses(estadoKey)} ${isNewOnline ? 'ring-2 ring-blue-500 ring-offset-1' : ''}`}
                    title={`${e.cumpleaneros.join(', ')} - ${e.estado} (${e.origen})`}
                  >
                    <span className="truncate">{e.cumpleaneros.join(', ')}</span>
                    {isNewOnline && (
                      <span className="flex h-2 w-2 relative shrink-0 ml-1">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                      </span>
                    )}
                  </div>
                );
              })}
              {dayEvents.length > 3 && (
                <div className="text-xs font-bold text-slate-400 mt-1">
                  + {dayEvents.length - 3} más
                </div>
              )}
            </div>
          </div>
          
          {/* HOVER GLOW EFFECT */}
          <div className="absolute inset-0 bg-slate-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10" />
        </div>
      );
    }
    return days;
  };

  const selectedDayEvents = selectedDay ? getEventsForDay(selectedDay.getDate()) : [];

  return (
    <div className="bg-white">
      <div className="flex items-center justify-between p-6 border-b border-slate-200">
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-slate-800 capitalize">
            {monthNames[month]} <span className="text-indigo-600 ml-1">{year}</span>
          </h2>
          <p className="text-xs text-slate-500">Agenda Mensual</p>
        </div>
        <div className="flex gap-2">
          <button onClick={prevMonth} className="w-10 h-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 transition-colors">
            <ChevronLeft size={20} />
          </button>
          <button onClick={nextMonth} className="w-10 h-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 transition-colors">
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 text-center border-b border-slate-200 bg-slate-50">
        {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(d => (
          <div key={d} className="py-3 text-xs font-bold text-slate-500 uppercase">{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 border-r border-b border-slate-200 overflow-hidden bg-white">
        {renderDays()}
      </div>

      <div className="p-6 bg-slate-50 flex flex-wrap items-center gap-6">
        <div className="text-xs font-bold text-slate-500 uppercase mr-2">Estatus:</div>
        {[
          { color: 'bg-amber-500', label: 'Provisional' },
          { color: 'bg-blue-500', label: 'Reservado / Planificación' },
          { color: 'bg-indigo-500', label: 'Planificado' },
          { color: 'bg-emerald-500', label: 'En curso / Liquidado' },
          { color: 'bg-purple-500', label: 'Finalizada / Post-fiesta' },
          { color: 'bg-slate-500', label: 'Terminada' },
          { color: 'bg-rose-500', label: 'Cancelado' }
        ].map(l => (
          <div key={l.label} className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${l.color}`} />
            <span className="text-xs font-medium text-slate-600">{l.label}</span>
          </div>
        ))}
        <div className="flex items-center gap-2 ml-auto">
          <div className="flex h-3 w-3 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
          </div>
          <span className="text-xs font-bold text-blue-600 ">Reserva Online Nueva</span>
        </div>
      </div>

      {/* DAY DETAILS MODAL */}
      <AnimatePresence>
        {showDayModal && selectedDay && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowDayModal(false)}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden"
            >
              <div className="bg-slate-900 p-8 text-white flex justify-between items-center relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-3xl -mr-16 -mt-16" />
                <div className="relative z-10 space-y-1">
                  <h3 className="text-2xl font-bold italic tracking-tight">
                    {selectedDay.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </h3>
                  <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Resumen de Agenda Diaria</p>
                </div>
                <button 
                  onClick={() => setShowDayModal(false)}
                  className="relative z-10 w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-8 space-y-6 max-h-[60vh] overflow-y-auto">
                {selectedDayEvents.length > 0 ? (
                  <div className="space-y-4">
                    {selectedDayEvents.map(e => (
                      <div 
                        key={e.id}
                        onClick={() => navigate(`/admin/operativo/${e.id}`)}
                        className="p-5 bg-slate-50 hover:bg-slate-100 rounded-3xl border border-slate-100 transition-all cursor-pointer group flex items-center justify-between"
                      >
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${getEstadoEventoBadgeClasses(normalizeEstadoEvento(e.estado))}`}>
                            <Clock size={20} />
                          </div>
                          <div>
                            <p className="font-bold text-slate-800 leading-tight truncate max-w-[200px]">{e.cumpleaneros.join(', ')}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs font-bold text-slate-400 ">
                                {e.horaInicio.substring(0,5)} - {e.horaFin.substring(0,5)}
                              </span>
                              {e.origen.toLowerCase() === 'online' && (
                                <span className="flex items-center gap-1 text-xs font-bold text-blue-500  bg-blue-50 px-1.5 py-0.5 rounded">
                                  <Globe size={8} /> Online
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <ArrowRight size={18} className="text-slate-300 group-hover:text-primary transition-colors" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-12 text-center space-y-4">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-200 mx-auto">
                      <CalendarDays size={32} />
                    </div>
                    <p className="text-slate-400 font-bold italic">No hay reservas programadas para este día.</p>
                  </div>
                )}
              </div>

              <div className="p-8 bg-slate-50 border-t border-slate-100">
                <button 
                  onClick={() => {
                    setShowDayModal(false);
                    onDateSelect(selectedDay);
                  }}
                  className="w-full py-5 bg-primary text-white rounded-2xl font-bold text-xs  shadow-2xl shadow-primary/30 hover:bg-secondary hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3"
                >
                  <Plus size={20} strokeWidth={3} /> Crear Nueva Reserva
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CalendarView;





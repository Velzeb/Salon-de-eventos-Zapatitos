import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, ChevronLeft, ChevronRight, Sun, Sparkles, Moon, Ticket, Lock, Calendar as CalendarIcon } from 'lucide-react';
import { disponibilidadService } from '../../../services/disponibilidadService';
import type { AvailableSlot } from '../../../services/disponibilidadService';
import { authService } from '../../../services/authService';
import { motion, AnimatePresence } from 'framer-motion';

const AvailabilityCalendar: React.FC = () => {
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [slots, setSlots] = useState<AvailableSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  // Month-wide availability status cache
  const [monthStatus, setMonthStatus] = useState<Record<number, { status: 'free' | 'partial' | 'full' | 'closed', availableCount: number, slotsCount: number }>>({});
  const [loadingMonth, setLoadingMonth] = useState(false);
  const [slideDirection, setSlideDirection] = useState(0); // -1 for left, 1 for right

  useEffect(() => {
    loadMonthAvailability(currentDate);
    // Auto select today if in the current month
    const today = new Date();
    if (today.getMonth() === currentDate.getMonth() && today.getFullYear() === currentDate.getFullYear()) {
      handleDateClick(today.getDate(), today);
    } else {
      setSelectedDate(null);
      setSlots([]);
    }
  }, [currentDate]);

  const loadMonthAvailability = async (date: Date) => {
    setLoadingMonth(true);
    try {
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const data = await disponibilidadService.getMonthAvailable(year, month);
      
      const statusMap: Record<number, any> = {};
      data.forEach(d => {
        statusMap[d.day] = d;
      });
      setMonthStatus(statusMap);
    } catch (e) {
      console.error("Error al cargar disponibilidad mensual:", e);
      setMonthStatus({});
    } finally {
      setLoadingMonth(false);
    }
  };

  const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const monthNames = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ];

  const handlePrevMonth = () => {
    setSlideDirection(-1);
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setSlideDirection(1);
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleDateClick = async (day: number, overrideDate?: Date) => {
    const clickedDate = overrideDate || new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    
    // Prevent selecting past dates
    const todayZero = new Date();
    todayZero.setHours(0,0,0,0);
    if (clickedDate < todayZero) return;

    // Check if the day is closed
    const dayInfo = monthStatus[day];
    if (dayInfo && dayInfo.status === 'closed') return;

    setSelectedDate(clickedDate);
    
    setLoadingSlots(true);
    try {
      const y = clickedDate.getFullYear();
      const m = String(clickedDate.getMonth() + 1).padStart(2, '0');
      const d = String(clickedDate.getDate()).padStart(2, '0');
      const dateStr = `${y}-${m}-${d}`;
      const data = await disponibilidadService.getAvailableSlots(dateStr);
      setSlots(data || []);
    } catch (e) {
      console.error("Error al cargar disponibilidad de turnos:", e);
      setSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  const getSlotIcon = (horaInicio: string) => {
    const hour = parseInt(horaInicio.split(':')[0], 10);
    if (hour < 13) return <Sun size={20} className="text-amber-500" />;
    if (hour < 17) return <Sparkles size={20} className="text-purple-500" />;
    return <Moon size={20} className="text-indigo-500" />;
  };

  const renderCalendar = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const totalDays = daysInMonth(year, month);
    const startDay = firstDayOfMonth(year, month);
    
    const calendarDays = [];
    for (let i = 0; i < startDay; i++) {
      calendarDays.push(<div key={`empty-${i}`} className="bg-transparent"></div>);
    }

    const today = new Date();
    today.setHours(0,0,0,0);

    for (let day = 1; day <= totalDays; day++) {
      const dateToCheck = new Date(year, month, day);
      const isPast = dateToCheck < today;
      const isSelected = selectedDate?.getDate() === day && selectedDate?.getMonth() === month && selectedDate?.getFullYear() === year;
      const isToday = today.getDate() === day && today.getMonth() === month && today.getFullYear() === year;
      
      const dayInfo = monthStatus[day];

      let dayBgClass = 'bg-slate-50 border-purple-50 hover:bg-purple-100 hover:border-purple-200 text-slate-700';

      if (isPast) {
        dayBgClass = 'bg-slate-50/40 text-slate-300 border-transparent opacity-40 cursor-not-allowed';
      } else if (dayInfo) {
        if (dayInfo.status === 'closed') {
          dayBgClass = 'bg-slate-100/40 text-slate-400 border-slate-100 cursor-not-allowed';
        } else if (dayInfo.status === 'full') {
          dayBgClass = 'bg-rose-50/70 text-rose-600 border-rose-100 cursor-not-allowed';
        } else if (dayInfo.status === 'partial') {
          dayBgClass = 'bg-amber-50/70 text-amber-800 border-amber-100 hover:bg-amber-100/40';
        } else {
          dayBgClass = 'bg-emerald-50/60 text-emerald-800 border-emerald-100 hover:bg-emerald-100/40';
        }
      }

      const canSelect = !isPast && (!dayInfo || dayInfo.status !== 'closed');

      calendarDays.push(
        <motion.div 
          key={day} 
          whileHover={canSelect ? { scale: 1.06, y: -2 } : {}}
          whileTap={canSelect ? { scale: 0.96 } : {}}
          className={`aspect-square flex flex-col items-center justify-center rounded-3xl cursor-pointer transition-all border relative ${
            isSelected 
              ? '!bg-gradient-to-tr !from-primary !via-purple-600 !to-pink-500 !text-white !border-transparent shadow-lg shadow-primary/30 scale-105 z-10 font-bold' 
              : isToday 
                ? 'border-2 border-primary-light text-slate-800 font-extrabold shadow-sm' 
                : dayBgClass
          }`}
          onClick={() => canSelect && handleDateClick(day)}
        >
          <span className="text-base lg:text-lg font-display font-black leading-none">{day}</span>
          
          {/* Availability Status Indicator Dot */}
          {!isPast && (!dayInfo || dayInfo.status !== 'closed') && (
            <span className={`w-2 h-2 rounded-full absolute bottom-2 left-1/2 -translate-x-1/2 ${
              isSelected 
                ? 'bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]' 
                : dayInfo?.status === 'full' 
                  ? 'bg-rose-500 shadow-[0_0_6px_rgba(239,68,68,0.4)]' 
                  : dayInfo?.status === 'partial' 
                    ? 'bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.4)]' 
                    : 'bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.4)]'
            }`} />
          )}
        </motion.div>
      );
    }

    return calendarDays;
  };

  const bubbleStyle = `
    @keyframes floatBubble {
      0%, 100% { transform: translateY(0px) scale(1); }
      50% { transform: translateY(-15px) scale(1.06); }
    }
    .floating-bubble-1 { animation: floatBubble 7s ease-in-out infinite; }
    .floating-bubble-2 { animation: floatBubble 9s ease-in-out infinite; }
    .floating-bubble-3 { animation: floatBubble 5s ease-in-out infinite; }
  `;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1.35fr_1fr] gap-10 bg-white rounded-[3.5rem] border border-purple-100 p-6 lg:p-12 shadow-premium relative overflow-hidden">
      <style dangerouslySetInnerHTML={{ __html: bubbleStyle }} />

      {/* Playful Floating Bubbles Background Decoration */}
      <div className="absolute top-10 left-10 w-28 h-28 bg-purple-100/40 rounded-full blur-2xl pointer-events-none floating-bubble-1 z-0" />
      <div className="absolute bottom-10 right-1/2 w-36 h-36 bg-pink-100/40 rounded-full blur-2xl pointer-events-none floating-bubble-2 z-0" />
      <div className="absolute top-1/2 right-12 w-20 h-20 bg-cyan-100/40 rounded-full blur-2xl pointer-events-none floating-bubble-3 z-0" />

      {/* CALENDAR COLUMN */}
      <div className="space-y-8 z-10">
        <div className="flex justify-between items-center bg-purple-50/40 p-4 rounded-[2rem] border border-purple-100/50">
          <button 
            type="button"
            onClick={handlePrevMonth} 
            className="w-12 h-12 rounded-2xl flex items-center justify-center bg-white border border-purple-100 text-slate-500 hover:bg-primary hover:text-white transition-all shadow-sm hover:scale-105 active:scale-95"
          >
            <ChevronLeft size={22} />
          </button>
          <div className="flex items-center gap-2">
            <CalendarIcon size={20} className="text-primary" />
            <h3 className="text-xl lg:text-2xl font-display font-black text-bg-dark tracking-tight">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h3>
          </div>
          <button 
            type="button"
            onClick={handleNextMonth} 
            className="w-12 h-12 rounded-2xl flex items-center justify-center bg-white border border-purple-100 text-slate-500 hover:bg-primary hover:text-white transition-all shadow-sm hover:scale-105 active:scale-95"
          >
            <ChevronRight size={22} />
          </button>
        </div>
        
        {loadingMonth ? (
          <div className="h-80 flex items-center justify-center text-slate-400 font-bold uppercase tracking-widest text-xs animate-pulse">
            Sincronizando Disponibilidad...
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-7 text-center font-black text-slate-400 text-[10px] uppercase tracking-wider">
              <span>Dom</span><span>Lun</span><span>Mar</span><span>Mié</span><span>Jue</span><span>Vie</span><span>Sáb</span>
            </div>
            
            <div className="overflow-hidden relative min-h-[350px]">
              <AnimatePresence initial={false} custom={slideDirection} mode="popLayout">
                <motion.div
                  key={currentDate.toISOString()}
                  custom={slideDirection}
                  variants={{
                    enter: (dir: number) => ({
                      x: dir > 0 ? 300 : -300,
                      opacity: 0
                    }),
                    center: {
                      x: 0,
                      opacity: 1
                    },
                    exit: (dir: number) => ({
                      x: dir < 0 ? 300 : -300,
                      opacity: 0
                    })
                  }}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ type: 'spring', stiffness: 260, damping: 26 }}
                  className="grid grid-cols-7 gap-2.5 lg:gap-3"
                >
                  {renderCalendar()}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        )}

        {/* LEGEND */}
        <div className="flex flex-wrap gap-4 pt-5 border-t border-purple-50/50 text-[9px] font-black text-slate-400 uppercase tracking-widest justify-center sm:justify-start">
          <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full inline-block bg-emerald-500 shadow-sm shadow-emerald-500/20"></span> Totalmente Libre</div>
          <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full inline-block bg-amber-400 shadow-sm shadow-amber-400/20"></span> Últimos Turnos</div>
          <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full inline-block bg-rose-400 shadow-sm shadow-rose-400/20"></span> Agotado</div>
          <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full inline-block bg-slate-200"></span> Cerrado</div>
        </div>
      </div>

      {/* DETALLES DE TURNOS COLUMN */}
      <div className="lg:border-l lg:border-purple-100 lg:pl-10 flex flex-col justify-between z-10">
        {selectedDate ? (
          <div className="space-y-6 flex-1 flex flex-col">
            <div className="flex items-center gap-3 text-slate-700 font-bold">
              <CalendarIcon size={22} className="text-primary animate-pulse" />
              <h4 className="text-lg lg:text-xl font-display font-black text-bg-dark">
                Horarios para el {selectedDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}
              </h4>
            </div>

            {loadingSlots ? (
              <div className="flex-1 flex items-center justify-center text-slate-400 font-bold uppercase tracking-widest text-[10px] animate-pulse py-20">
                Buscando turnos...
              </div>
            ) : slots.length > 0 ? (
              <div className="space-y-4 flex-1 overflow-y-auto max-h-[380px] pr-2 custom-scrollbar py-2">
                {slots.map((slot, idx) => (
                  <motion.div 
                    key={idx}
                    whileHover={slot.isAvailable ? { scale: 1.02, y: -2 } : {}}
                    whileTap={slot.isAvailable ? { scale: 0.98 } : {}}
                    className={`relative overflow-hidden p-6 rounded-3xl flex justify-between items-center border transition-all duration-300 ${
                      slot.isAvailable 
                        ? 'bg-gradient-to-r from-emerald-50/40 to-teal-50/30 border-emerald-100 border-l-4 border-l-emerald-500 shadow-sm hover:shadow-md' 
                        : 'bg-slate-50/60 border-purple-50/40 opacity-55 select-none'
                    }`}
                  >
                    {/* Ticket Notches */}
                    {slot.isAvailable && (
                      <>
                        <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-4 h-8 bg-white border-r border-emerald-100 rounded-r-full z-10"></div>
                        <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-8 bg-white border-l border-emerald-100 rounded-l-full z-10"></div>
                        {/* Dashed separator */}
                        <div className="absolute left-[72%] top-0 bottom-0 border-l border-dashed border-emerald-200/80 z-0"></div>
                      </>
                    )}

                    {/* Left Info Section */}
                    <div className="flex items-center gap-4 z-10 w-[65%]">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                        slot.isAvailable ? 'bg-emerald-50 border border-emerald-100/50' : 'bg-slate-100 text-slate-400'
                      }`}>
                        {getSlotIcon(slot.horaInicio)}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="font-extrabold text-bg-dark tracking-tight text-sm sm:text-base">
                          {(slot.horaInicio || '').substring(0, 5)} - {(slot.horaFin || '').substring(0, 5)}
                        </span>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5 truncate">
                          {slot.nombreBloque}
                        </span>
                      </div>
                    </div>

                    {/* Right Action Section (Ticket stub) */}
                    <div className="z-10 shrink-0 text-center pl-2 w-[30%] flex justify-center">
                      {slot.isAvailable ? (
                        <span className="px-2.5 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-emerald-100 text-emerald-700 flex items-center gap-1 shadow-sm border border-emerald-200/50">
                          <Ticket size={11} className="text-emerald-600 fill-emerald-600/30" /> Libre
                        </span>
                      ) : (
                        <span className="px-2.5 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-slate-200 text-slate-500 border border-slate-300/40 flex items-center gap-1">
                          <Lock size={11} className="text-slate-400" /> Ocupado
                        </span>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-amber-50/50 text-amber-700 rounded-[2rem] font-medium gap-3 border border-amber-100">
                <AlertTriangle size={32} />
                <p className="text-sm font-bold">No hay turnos configurados para este día o el salón está cerrado.</p>
              </div>
            )}
            
            {slots.some(s => s.isAvailable) && (
              <motion.button 
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => {
                  const y = selectedDate.getFullYear();
                  const m = String(selectedDate.getMonth() + 1).padStart(2, '0');
                  const d = String(selectedDate.getDate()).padStart(2, '0');
                  const targetPath = `/reservar?fecha=${y}-${m}-${d}`;
                  if (authService.isAuthenticated()) {
                    navigate(targetPath);
                  } else {
                    navigate(`/cliente/login?redirect=${encodeURIComponent(targetPath)}`);
                  }
                }}
                className="w-full py-5 bg-gradient-to-r from-primary to-pink-500 text-white border-none rounded-2xl font-black uppercase tracking-widest text-xs cursor-pointer shadow-lg shadow-primary/20 flex items-center justify-center gap-2 mt-auto"
              >
                <CalendarIcon size={14} /> Reservar este día
              </motion.button>
            )}
          </div>
        ) : (
          <div className="flex-grow flex flex-col items-center justify-center text-center text-slate-400 gap-4 opacity-80 border-2 border-dashed border-purple-200 rounded-[2.5rem] p-8 min-h-[300px] bg-slate-50/30">
            <CalendarIcon size={48} className="text-purple-300/80 animate-bounce" />
            <p className="max-w-[200px] text-xs font-bold leading-relaxed">Selecciona un día en el calendario para ver los horarios disponibles.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AvailabilityCalendar;

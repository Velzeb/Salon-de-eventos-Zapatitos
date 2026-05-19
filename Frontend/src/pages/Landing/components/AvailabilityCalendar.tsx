import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Clock, AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-react';
import { disponibilidadService } from '../../../services/disponibilidadService';
import type { AvailableSlot } from '../../../services/disponibilidadService';

const AvailabilityCalendar: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [slots, setSlots] = useState<AvailableSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  useEffect(() => {
    // Cargar horarios de hoy por defecto
    handleDateClick(new Date().getDate());
  }, []);

  const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const monthNames = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ];

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleDateClick = async (day: number) => {
    const clickedDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
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
      console.error("Error al cargar disponibilidad", e);
      setSlots([]);
    } finally {
      setLoadingSlots(false);
    }
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

    for (let day = 1; day <= totalDays; day++) {
      const isSelected = selectedDate?.getDate() === day && selectedDate?.getMonth() === month && selectedDate?.getFullYear() === year;
      const isToday = new Date().getDate() === day && new Date().getMonth() === month && new Date().getFullYear() === year;
      
      calendarDays.push(
        <div 
          key={day} 
          className={`aspect-square flex flex-col items-center justify-center rounded-xl cursor-pointer transition-all font-bold ${
            isSelected 
              ? '!bg-primary !text-white' 
              : isToday 
                ? 'border-2 border-primary-light text-slate-800' 
                : 'bg-slate-50 text-slate-800 hover:bg-indigo-50 hover:text-indigo-600'
          }`}
          onClick={() => handleDateClick(day)}
        >
          <span className="text-sm">{day}</span>
          <div className="mt-1">
            <span className={`w-1.5 h-1.5 rounded-full inline-block ${isSelected ? 'bg-white' : 'bg-emerald-400'}`}></span>
          </div>
        </div>
      );
    }

    return calendarDays;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-[1.2fr_1fr] gap-8 bg-white rounded-2xl w-full p-4 lg:p-0">
      <div className="calendar-container-premium">
        <div className="flex justify-between items-center mb-8">
          <button onClick={handlePrevMonth} className="w-10 h-10 rounded-full flex items-center justify-center bg-slate-50 border border-slate-200 text-slate-500 hover:bg-primary hover:text-white hover:border-primary transition-colors"><ChevronLeft /></button>
          <h3 className="text-xl font-extrabold text-slate-800 m-0">{monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}</h3>
          <button onClick={handleNextMonth} className="w-10 h-10 rounded-full flex items-center justify-center bg-slate-50 border border-slate-200 text-slate-500 hover:bg-primary hover:text-white hover:border-primary transition-colors"><ChevronRight /></button>
        </div>
        
        <div className="grid grid-cols-7 text-center font-extrabold text-slate-400 text-xs uppercase mb-4">
          <span>Dom</span><span>Lun</span><span>Mar</span><span>Mié</span><span>Jue</span><span>Vie</span><span>Sáb</span>
        </div>
        
        <div className="grid grid-cols-7 gap-2">
          {renderCalendar()}
        </div>

        <div className="flex gap-6 mt-8 text-xs font-bold text-slate-400">
          <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full inline-block bg-emerald-400"></span> Disponible</div>
          <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full inline-block bg-rose-500"></span> Ocupado</div>
        </div>
      </div>

      <div className="md:border-l md:border-slate-100 md:pl-8 mt-8 md:mt-0">
        {selectedDate ? (
          <>
            <div className="flex items-center gap-3 mb-6 text-slate-700 font-bold">
              <CalendarIcon size={20} className="text-primary" />
              <h4>Horarios para el {selectedDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}</h4>
            </div>

            {loadingSlots ? (
              <div className="py-10 text-center text-slate-500 font-medium animate-pulse">Buscando turnos...</div>
            ) : slots.length > 0 ? (
              <div className="space-y-4">
                {slots.map((slot, idx) => (
                  <div key={idx} className={`p-4 bg-slate-50 rounded-xl flex justify-between items-center border ${slot.isAvailable ? 'border-transparent border-l-4 border-l-emerald-500' : 'border-slate-200 opacity-60'}`}>
                    <div className="flex items-center gap-3">
                      <Clock size={16} className="text-slate-400" />
                      <div className="flex flex-col">
                        <span className="font-extrabold text-slate-800">{(slot.horaInicio || '').substring(0, 5)} - {(slot.horaFin || '').substring(0, 5)}</span>
                        <span className="text-xs text-slate-500 font-medium">{slot.nombreBloque}</span>
                      </div>
                    </div>
                    {slot.isAvailable ? (
                      <span className="px-3 py-1 rounded-md text-xs font-bold bg-emerald-100 text-emerald-700">Libre</span>
                    ) : (
                      <span className="px-3 py-1 rounded-md text-xs font-bold bg-slate-200 text-slate-600">Ocupado</span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center text-center p-8 bg-amber-50 text-amber-700 rounded-xl font-medium gap-3">
                <AlertTriangle size={32} />
                <p>No hay turnos configurados para este día o el salón está cerrado.</p>
              </div>
            )}
            
            {slots.some(s => s.isAvailable) && (
              <button 
                onClick={() => window.location.href = '/reservar'}
                className="w-full p-4 bg-emerald-500 text-white border-none rounded-xl font-extrabold cursor-pointer mt-8 hover:-translate-y-0.5 hover:brightness-110 hover:shadow-[0_10px_20px_rgba(16,185,129,0.2)] transition-all"
              >
                Reservar este día
              </button>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center text-center h-full text-slate-400 gap-4 opacity-70 border-2 border-dashed border-slate-200 rounded-2xl p-8 min-h-[300px]">
            <CalendarIcon size={48} className="text-slate-300" />
            <p className="max-w-[200px]">Selecciona un día en el calendario para ver los horarios disponibles.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AvailabilityCalendar;

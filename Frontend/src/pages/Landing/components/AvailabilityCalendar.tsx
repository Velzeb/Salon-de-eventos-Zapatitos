import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Clock, AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-react';
import { disponibilidadService } from '../../../services/disponibilidadService';
import type { AvailableSlot } from '../../../services/disponibilidadService';
import './AvailabilityCalendar.css';

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
      calendarDays.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
    }

    for (let day = 1; day <= totalDays; day++) {
      const isSelected = selectedDate?.getDate() === day && selectedDate?.getMonth() === month && selectedDate?.getFullYear() === year;
      const isToday = new Date().getDate() === day && new Date().getMonth() === month && new Date().getFullYear() === year;
      
      calendarDays.push(
        <div 
          key={day} 
          className={`calendar-day ${isSelected ? 'selected' : ''} ${isToday ? 'today' : ''}`}
          onClick={() => handleDateClick(day)}
        >
          <span className="day-number">{day}</span>
          <div className="day-status dots">
            <span className="dot free"></span>
          </div>
        </div>
      );
    }

    return calendarDays;
  };

  return (
    <div className="availability-widget">
      <div className="calendar-container-premium">
        <div className="calendar-header">
          <button onClick={handlePrevMonth} className="btn-nav"><ChevronLeft /></button>
          <h3>{monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}</h3>
          <button onClick={handleNextMonth} className="btn-nav"><ChevronRight /></button>
        </div>
        
        <div className="week-days">
          <span>Dom</span><span>Lun</span><span>Mar</span><span>Mié</span><span>Jue</span><span>Vie</span><span>Sáb</span>
        </div>
        
        <div className="calendar-grid">
          {renderCalendar()}
        </div>

        <div className="calendar-legend">
          <div className="legend-item"><span className="dot free"></span> Disponible</div>
          <div className="legend-item"><span className="dot busy"></span> Ocupado</div>
        </div>
      </div>

      <div className="slots-panel">
        {selectedDate ? (
          <>
            <div className="selected-date-header">
              <CalendarIcon size={20} />
              <h4>Horarios para el {selectedDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}</h4>
            </div>

            {loadingSlots ? (
              <div className="slots-loading">Buscando turnos...</div>
            ) : slots.length > 0 ? (
              <div className="slots-list">
                {slots.map((slot, idx) => (
                  <div key={idx} className={`slot-item ${slot.isAvailable ? 'available' : 'booked'}`}>
                    <div className="slot-info">
                      <Clock size={16} />
                      <span className="slot-time">{(slot.horaInicio || '').substring(0, 5)} - {(slot.horaFin || '').substring(0, 5)}</span>
                      <span className="slot-name">{slot.nombreBloque}</span>
                    </div>
                    {slot.isAvailable ? (
                      <span className="status-badge available">Libre</span>
                    ) : (
                      <span className="status-badge booked">Ocupado</span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-slots">
                <AlertTriangle size={32} />
                <p>No hay turnos configurados para este día o el salón está cerrado.</p>
              </div>
            )}
            
            {slots.some(s => s.isAvailable) && (
              <button 
                onClick={() => window.location.href = '/reservar'}
                className="btn-reserve-quick"
              >
                Reservar este día
              </button>
            )}
          </>
        ) : (
          <div className="select-date-hint">
            <CalendarIcon size={48} />
            <p>Selecciona un día en el calendario para ver los horarios disponibles.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AvailabilityCalendar;

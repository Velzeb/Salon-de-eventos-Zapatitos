import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar as CalendarIcon,
  Plus,
  RefreshCw,
  Settings,
  CalendarDays,
  Globe
} from 'lucide-react';
import { eventosService } from '../../services/eventosService';
import type { Evento } from '../../services/eventosService';
import CalendarView from './components/CalendarView';
import ConfiguracionHorarios from './components/ConfiguracionHorarios';

const ReservasPage = () => {
  const navigate = useNavigate();
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'calendar' | 'horarios'>('calendar');

  const loadEventos = async () => {
    setLoading(true);
    try {
      const data = await eventosService.getEventos();
      setEventos(data);
    } catch (err) {
      console.error('Error al cargar eventos', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void Promise.resolve().then(loadEventos);
  }, []);

  const pendientesOnline = eventos.filter(
    evento => evento.origen.toLowerCase() === 'online' && evento.estado.toLowerCase() === 'provisional'
  ).length;

  return (
    <div className="space-y-8 pb-20 font-sans">
      <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 p-8 shadow-xl">
        <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-white">
              {view === 'horarios' ? 'Disponibilidad' : 'Agenda de reservas'}
            </h1>
            <p className="mt-2 text-sm font-semibold text-slate-400">
              {view === 'horarios'
                ? 'Configura turnos y bloqueos para que la agenda sea confiable.'
                : 'Consulta disponibilidad y crea nuevas reservas. La operación se gestiona desde Operativo.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-white">
              <Globe size={18} className="text-blue-300" />
              <div>
                <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">Online pendientes</p>
                <p className="text-lg font-black">{pendientesOnline}</p>
              </div>
            </div>

            {view === 'calendar' ? (
              <button
                className="inline-flex items-center gap-3 rounded-xl bg-blue-600 px-6 py-4 text-xs font-black text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 active:scale-95"
                onClick={() => navigate('nueva')}
              >
                <Plus size={18} strokeWidth={3} />
                Nueva reserva
              </button>
            ) : (
              <div className="inline-flex items-center gap-3 rounded-xl border border-white/10 bg-white/10 px-5 py-4 text-xs font-black text-white">
                <Settings size={18} />
                Configuración
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex w-fit rounded-xl border border-slate-200 bg-slate-100 p-1">
          {[
            { id: 'calendar', icon: CalendarIcon, label: 'Calendario' },
            { id: 'horarios', icon: Settings, label: 'Horarios' }
          ].map(option => (
            <button
              key={option.id}
              className={`flex items-center gap-2 rounded-lg px-6 py-2.5 text-xs font-bold uppercase tracking-wide transition ${
                view === option.id
                  ? 'border border-slate-200 bg-white text-blue-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
              onClick={() => setView(option.id as 'calendar' | 'horarios')}
            >
              <option.icon size={16} />
              {option.label}
            </button>
          ))}
        </div>

        {view === 'calendar' && (
          <button
            onClick={loadEventos}
            className="inline-flex h-12 w-12 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:bg-slate-50 active:scale-95"
            title="Recargar"
          >
            <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
          </button>
        )}
      </div>

      <div className="min-h-[400px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {loading && view === 'calendar' ? (
          <div className="flex flex-col items-center justify-center gap-6 py-40">
            <div className="relative">
              <div className="h-16 w-16 rounded-full border-4 border-blue-500/10" />
              <div className="absolute left-0 top-0 h-16 w-16 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
            </div>
            <p className="text-xs font-bold text-slate-400">Sincronizando reservas...</p>
          </div>
        ) : view === 'calendar' ? (
          <CalendarView
            eventos={eventos}
            onDateSelect={date => {
              navigate('nueva', { state: { selectedDate: date } });
            }}
          />
        ) : (
          <ConfiguracionHorarios />
        )}
      </div>

      {view === 'calendar' && (
        <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5 text-sm font-semibold text-blue-700">
          <div className="flex items-start gap-3">
            <CalendarDays size={20} className="mt-0.5 shrink-0" />
            <p>
              Este módulo queda enfocado en agenda y disponibilidad. Para estados, pagos, staff, logística y cierre usa el Centro Operativo de cada evento.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReservasPage;

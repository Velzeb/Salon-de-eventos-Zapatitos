import { useEffect, useState, useRef } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import { authService } from '../../services/authService';
import { eventosService, type Evento } from '../../services/eventosService';
import { Bell, Clock, Globe, ArrowRight, Calendar, PlusCircle, PlayCircle, Wallet } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const AdminLayout = () => {
  const navigate = useNavigate();
  const [userName, setUserName] = useState('Usuario');
  const [userRole, setUserRole] = useState('Staff');
  const [notifications, setNotifications] = useState<Evento[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const name = authService.getUserName();
    if (name) setUserName(name);
    const roles = authService.getRoles();
    setUserRole(roles[0] || 'Staff');

    // Fetch initial notifications
    loadNotifications();

    // Polling every 1 minute for new online reservations
    const interval = setInterval(loadNotifications, 60000);
    return () => clearInterval(interval);
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadNotifications = async () => {
    try {
      const data = await eventosService.getEventos();
      // Filter for Online + Provisional (new)
      const news = data.filter(e => 
        e.origen.toLowerCase() === 'online' && 
        e.estado.toLowerCase() === 'provisional'
      );
      setNotifications(news);
    } catch (e) {
      console.error("Error loading notifications", e);
    }
  };

  const initials = (userName || 'Admin')
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#F8FAFC] font-main text-bg-dark selection:bg-primary selection:text-white">
      {/* ATMOSPHERIC BACKGROUND EFFECTS */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-primary/5 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-secondary/5 rounded-full blur-[100px] animate-pulse duration-700" />
      </div>

      <Sidebar />
      
      <main className="flex-1 flex flex-col min-w-0 h-screen relative z-10">
        {/* PREMIUM TOP NAVIGATION BAR */}
        <header className="h-28 min-h-[112px] flex items-center justify-between px-12 bg-white/60 backdrop-blur-2xl border-b border-slate-100/80 z-40 sticky top-0 transition-all duration-500">
          <div className="flex items-center gap-10">
            <div className="hidden lg:flex items-center gap-3">
              <button
                onClick={() => navigate('/admin/reservas/nueva')}
                className="flex items-center gap-2 bg-white border border-slate-200 rounded-2xl px-5 py-3 text-xs font-black uppercase tracking-widest text-slate-700 hover:text-primary hover:border-primary/40 transition-all shadow-sm"
              >
                <PlusCircle size={16} /> Nueva reserva
              </button>
              <button
                onClick={() => navigate('/admin/operativo')}
                className="flex items-center gap-2 bg-white border border-slate-200 rounded-2xl px-5 py-3 text-xs font-black uppercase tracking-widest text-slate-700 hover:text-primary hover:border-primary/40 transition-all shadow-sm"
              >
                <PlayCircle size={16} /> Eventos
              </button>
              <button
                onClick={() => navigate('/admin/finanzas')}
                className="flex items-center gap-2 bg-white border border-slate-200 rounded-2xl px-5 py-3 text-xs font-black uppercase tracking-widest text-slate-700 hover:text-primary hover:border-primary/40 transition-all shadow-sm"
              >
                <Wallet size={16} /> Pagos
              </button>
            </div>

            <div className="hidden xl:flex items-center gap-3 text-slate-400 font-black text-[9px] uppercase tracking-[0.3em] bg-slate-100/50 px-4 py-2 rounded-full border border-slate-200/50">
              <Clock size={12} className="text-primary" />
              <span>{notifications.length} reservas online pendientes</span>
            </div>
          </div>
          
          <div className="flex items-center gap-10">
            <div className="flex items-center gap-4">
              <div className="relative" ref={notificationRef}>
                <button 
                  onClick={() => setShowNotifications(!showNotifications)}
                  className={`w-16 h-16 rounded-[1.5rem] bg-white border border-slate-100 flex items-center justify-center transition-all duration-500 hover:bg-bg-dark hover:text-white hover:shadow-2xl hover:shadow-bg-dark/20 relative group active:scale-90 ${showNotifications ? 'bg-bg-dark text-white shadow-2xl shadow-bg-dark/20 ring-4 ring-primary/20' : 'text-slate-400'}`}
                >
                  <Bell size={24} />
                  {notifications.length > 0 && (
                    <>
                      <span className="absolute top-5 right-5 w-3 h-3 bg-primary rounded-full ring-4 ring-white group-hover:ring-bg-dark transition-all animate-pulse" />
                      <div className="absolute -top-1 -right-1 w-6 h-6 bg-accent text-white rounded-full flex items-center justify-center text-[10px] font-black border-2 border-white shadow-lg">
                        {notifications.length}
                      </div>
                    </>
                  )}
                </button>

                <AnimatePresence>
                  {showNotifications && (
                    <motion.div 
                      initial={{ opacity: 0, y: 20, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 mt-6 w-96 bg-white rounded-[2.5rem] shadow-[0_30px_80px_rgba(0,0,0,0.15)] border border-slate-100 overflow-hidden z-[100]"
                    >
                      <div className="bg-slate-900 p-8 text-white relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-3xl -mr-16 -mt-16" />
                        <div className="relative z-10 flex justify-between items-center">
                          <div className="space-y-1">
                            <h4 className="text-xl font-black italic tracking-tight">Notificaciones</h4>
                            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Nuevas Reservas Online</p>
                          </div>
                          <div className="bg-primary/20 text-primary px-3 py-1 rounded-full text-[10px] font-black">
                            {notifications.length} Pendientes
                          </div>
                        </div>
                      </div>

                      <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                        {notifications.length > 0 ? (
                          <div className="divide-y divide-slate-50">
                            {notifications.map(n => (
                              <div 
                                key={n.id} 
                                onClick={() => {
                                  navigate(`/admin/operativo/${n.id}`);
                                  setShowNotifications(false);
                                }}
                                className="p-6 hover:bg-slate-50 transition-all cursor-pointer group flex items-center gap-4"
                              >
                                <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:text-white transition-all duration-500">
                                  <Globe size={20} />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-black text-slate-800 text-sm truncate uppercase tracking-tight">{n.cumpleaneros.join(', ')}</p>
                                  <div className="flex items-center gap-3 mt-1 text-slate-400">
                                    <div className="flex items-center gap-1">
                                      <Calendar size={10} />
                                      <span className="text-[9px] font-bold">{new Date(n.fechaEvento).toLocaleDateString()}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <Clock size={10} />
                                      <span className="text-[9px] font-bold">{n.horaInicio.substring(0,5)}</span>
                                    </div>
                                  </div>
                                </div>
                                <ArrowRight size={16} className="text-slate-200 group-hover:text-primary transition-all group-hover:translate-x-1" />
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="p-12 text-center space-y-4">
                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-200 mx-auto">
                              <Bell size={24} />
                            </div>
                            <p className="text-slate-400 text-sm font-bold italic">No hay notificaciones nuevas</p>
                          </div>
                        )}
                      </div>

                      {notifications.length > 0 && (
                        <div className="p-6 bg-slate-50 border-t border-slate-100 text-center">
                          <button 
                            onClick={() => navigate('/admin/reservas')}
                            className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-primary transition-colors flex items-center justify-center gap-2 mx-auto"
                          >
                            Ver Todas las Reservas <ArrowRight size={12} />
                          </button>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <button
                onClick={() => navigate('/admin/reservas/nueva')}
                title="Nueva reserva"
                className="hidden sm:flex w-16 h-16 rounded-[1.5rem] bg-white border border-slate-100 items-center justify-center text-slate-400 transition-all duration-500 hover:bg-primary hover:text-bg-dark hover:border-primary hover:shadow-[0_15px_40px_rgba(var(--primary-rgb),0.3)] group active:scale-90"
              >
                <PlusCircle size={24} />
              </button>
            </div>

            <div className="h-10 w-[2px] bg-slate-100/80 rounded-full" />
            
            <div className="flex items-center gap-6 group cursor-pointer hover:bg-slate-50/50 p-2 pr-6 rounded-[2rem] transition-all duration-500 border border-transparent hover:border-slate-100/50">
              <div className="hidden sm:flex flex-col items-end">
                <span className="font-black text-base text-bg-dark tracking-tighter leading-none group-hover:text-primary transition-colors">{userName}</span>
                <span className="text-[10px] text-primary font-black uppercase tracking-[0.3em] mt-2 italic flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                  {userRole}
                </span>
              </div>
              <div className="relative">
                <div className="w-16 h-16 bg-white border-[3px] border-primary/20 rounded-[1.75rem] flex items-center justify-center font-black text-sm text-primary shadow-premium transition-all duration-700 group-hover:scale-110 group-hover:rotate-6 group-hover:border-primary group-hover:bg-primary group-hover:text-bg-dark">
                  {initials}
                </div>
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-secondary rounded-full border-4 border-white shadow-[0_4px_15px_rgba(6,182,212,0.4)]" />
              </div>
            </div>
          </div>
        </header>

        {/* MAIN CONTENT AREA */}
        <div className="p-12 flex-1 overflow-y-auto custom-scrollbar bg-transparent flex flex-col relative">
          <div className="max-w-[1920px] mx-auto w-full">
            <Outlet />
          </div>
        </div>

        {/* TEXTURE OVERLAY - FIXED NOISE */}
        <div className="fixed inset-0 pointer-events-none opacity-[0.03] mix-blend-soft-light z-[100] bg-[url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAyCAMAAAAp4XiDAAAAUVBMVEWFhYWDg4N3dy95eS95eS95eS95eS95eS95eS95eS95eS95eS95eS95eS95eS95eS95eS95eS95eS95eS95eS95eS95eS95eS95eS95eS95eS95eS913WbwAAAAJnRSTlMAAQIDBAUGBwgJCgsMDQ4PEBESExQVFhcYGRobHB0eHyAhIiMkJSInZ7nyAAAAn0lEQVRIx2NgYGRkZGRkZGRkZGRkZGRkZGRkZGRkZGRkZGRkZGRkZGRkZGRkZGRkZGRkZGRkZGRkZGRkZGRkZGRkZGRkZGRkZGRkZGRkZGRkZGRkZGRkZGRkZGRkZGRkZGRkZGRkZGRkZGRkZGRkZGRkZGRkZGRkZGRkZGRkZGRkZGRkZGRkZGRkZGRkZGRkZGRkZGRkZGRkZGRkZGRkZGRkYGCAMAL0EzgDe7H9uAAAAABJRU5ErkJggg==')]" />
      </main>
    </div>
  );
};

export default AdminLayout;

import { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  CalendarDays, 
  Users, 
  Settings, 
  DollarSign, 
  LogOut,
  PackageSearch,
  Layers,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  Play,
  Wallet,
  ShieldCheck,
  Wrench,
  ClipboardList
} from 'lucide-react';
import { authService } from '../../services/authService';
import { finanzasService } from '../../services/finanzasService';
import logo from '../../assets/logoZapatitos.webp';

const Sidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [pendingPaymentsCount, setPendingPaymentsCount] = useState(0);

  useEffect(() => {
    const fetchPending = async () => {
      try {
        const pagos = await finanzasService.getPagos();
        setPendingPaymentsCount(pagos.filter(p => p.estado === 'Pendiente').length);
      } catch {
        // Silently fail
      }
    };
    if (authService.hasRole(['Administrador'])) {
      fetchPending();
      const interval = setInterval(fetchPending, 60000); // Check every minute
      return () => clearInterval(interval);
    }
  }, []);

  const isAdmin = authService.hasRole(['Administrador']);

  const allMenuGroups = [
    {
      label: 'Principal',
      items: [
        { icon: LayoutDashboard, label: 'Resumen', path: '/admin/dashboard', desc: 'Métricas del negocio' },
        { icon: Play, label: 'Eventos', path: '/admin/operativo', desc: 'Fiestas y operación' },
        { icon: CalendarDays, label: 'Agenda', path: '/admin/reservas', desc: 'Reservas y calendario' },
      ]
    },
    {
      label: 'Comercial',
      items: [
        { icon: ShieldCheck, label: 'Servicios', path: '/admin/servicios', desc: 'Catálogo de venta' },
        { icon: Layers, label: 'Paquetes', path: '/admin/paquetes', desc: 'Planes y precios' },
      ]
    },
    {
      label: 'Logística',
      items: [
        { icon: PackageSearch, label: 'Inventario', path: '/admin/inventario', desc: 'Insumos y stock' },
        { icon: Wrench, label: 'Producción', path: '/admin/produccion', desc: 'Producción interna' },
        { icon: Users, label: 'Proveedores', path: '/admin/proveedores', desc: 'Aliados' },
      ]
    },
    {
      label: 'Finanzas',
      items: [
        { icon: DollarSign, label: 'Pagos y caja', path: '/admin/finanzas', desc: 'Ingresos y egresos' },
        { icon: Wallet, label: 'Pagos al staff', path: '/admin/nominas', desc: 'Eventos finalizados' },
      ]
    },
    {
      label: 'Administración',
      items: [
        { icon: Users, label: 'Clientes', path: '/admin/clientes', desc: 'Datos y expedientes' },
        { icon: Users, label: 'Empleados', path: '/admin/empleados', desc: 'Equipo Humano' },
        { icon: ClipboardList, label: 'Plantillas', path: '/admin/tareas-generales', desc: 'Tareas operativas' },
        { icon: Settings, label: 'Web y chatbot', path: '/admin/cms', desc: 'Landing y asistente' },
      ]
    }
  ];

  const menuGroups = allMenuGroups
    .filter(group => isAdmin || group.label === 'Principal')
    .map(group => {
      if (!isAdmin && group.label === 'Principal') {
        return {
          ...group,
          items: group.items.filter(item => item.path === '/admin/operativo')
        };
      }
      return group;
    });

  const toggleSidebar = () => setIsCollapsed(!isCollapsed);
  const toggleMobile = () => setIsMobileOpen(!isMobileOpen);

  return (
    <>
      {/* MOBILE TRIGGER */}
      <button 
        className="fixed top-8 left-8 z-[100] md:hidden w-16 h-16 bg-white shadow-[0_20px_50px_rgba(0,0,0,0.1)] rounded-3xl flex items-center justify-center text-bg-dark hover:bg-primary hover:text-white transition-all active:scale-90 border border-slate-100" 
        onClick={toggleMobile}
      >
        {isMobileOpen ? <X size={28} /> : <Menu size={28} />}
      </button>

      <aside className={`
        fixed inset-y-0 left-0 z-50 flex flex-col bg-bg-dark text-white transition-all duration-700 ease-in-out
        ${isCollapsed ? 'w-28' : 'w-[22rem]'}
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        md:relative md:flex border-r border-white/5 shadow-[25px_0_80px_rgba(0,0,0,0.2)]
      `}>
        {/* LOGO SECTION */}
        <div className="flex items-center justify-between p-10 h-32 relative overflow-hidden group/logo">
          <div className="absolute top-0 left-0 w-full h-full bg-primary/5 opacity-0 group-hover/logo:opacity-100 transition-opacity duration-700" />
          
          <div className="flex items-center gap-6 overflow-hidden relative z-10">
            <div className="w-14 h-14 rounded-2xl bg-white p-3 shadow-lg flex-shrink-0">
              <img src={logo} alt="Zapatitos" className="w-full h-full object-contain" />
            </div>
            {!isCollapsed && (
              <div className="flex flex-col animate-in fade-in slide-in-from-left-6 duration-700">
                <span className="font-bold text-xl tracking-tight leading-none uppercase">
                  Zapatitos
                </span>
                <div className="flex items-center gap-2 mt-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse" />
                  <span className="text-secondary text-[9px] font-bold uppercase tracking-widest opacity-80">
                    Operación diaria
                  </span>
                </div>
              </div>
            )}
          </div>
          <button 
            className="hidden md:flex items-center justify-center w-10 h-10 rounded-xl bg-white/5 text-slate-500 hover:text-white hover:bg-primary transition-all duration-500 group relative z-10"
            onClick={toggleSidebar}
          >
            {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
          </button>
        </div>

        {/* NAVIGATION */}
        <nav className="flex-1 px-6 py-10 space-y-8 overflow-y-auto custom-scrollbar relative z-10">
          {menuGroups.map((group) => (
            <div key={group.label} className="space-y-3">
              {!isCollapsed && (
                <div className="px-6 mb-4">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.4em] block">
                    {group.label}
                  </span>
                </div>
              )}
              <div className="space-y-2">
                {group.items.map((item) => (
                  <NavLink 
                    key={item.path} 
                    to={item.path}
                    className={({ isActive }) => `
                      flex items-center gap-5 px-6 py-4 rounded-[1.5rem] transition-all duration-500 group relative overflow-hidden
                      ${isActive 
                        ? 'bg-primary text-white shadow-glow scale-[1.02] z-10' 
                        : 'text-slate-500 hover:bg-white/5 hover:text-white hover:translate-x-1'}
                      ${isCollapsed ? 'justify-center px-0' : ''}
                    `}
                    onClick={() => setIsMobileOpen(false)}
                  >
                    <div className={`transition-all duration-700 ${isCollapsed ? '' : 'group-hover:scale-110'}`}>
                      <item.icon size={22} />
                    </div>
                    {!isCollapsed && (
                      <div className="flex flex-col animate-in fade-in slide-in-from-left-4 duration-500">
                        <span className="font-bold text-[10px] uppercase tracking-widest whitespace-nowrap leading-none">
                          {item.label}
                        </span>
                        <span className={`text-[7px] font-bold uppercase tracking-widest mt-1 opacity-40 group-hover:opacity-100 transition-opacity ${item.path === window.location.pathname ? 'text-white' : ''}`}>
                          {item.desc}
                        </span>
                      </div>
                    )}
                    
                    {/* NOTIFICATION BADGE */}
                    {item.path === '/admin/finanzas' && pendingPaymentsCount > 0 && (
                      <div className={`
                        absolute bg-rose-500 text-white font-black rounded-full flex items-center justify-center animate-pulse shadow-lg shadow-rose-500/20
                        ${isCollapsed 
                          ? 'top-2 right-2 w-4 h-4 text-[7px]' 
                          : 'right-10 w-5 h-5 text-[9px]'}
                      `}>
                        {pendingPaymentsCount}
                      </div>
                    )}
                    
                    {isCollapsed && (
                      <div className="absolute left-full ml-10 px-6 py-3 bg-bg-dark border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] text-white whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-500 z-50 shadow-[40px_0_80px_rgba(0,0,0,0.5)] scale-90 group-hover:scale-100">
                        {item.label}
                      </div>
                    )}

                    {/* ACTIVE INDICATOR */}
                    {!isCollapsed && (
                      <div className={`absolute right-6 w-1 h-4 rounded-full bg-white transition-all duration-700 scale-y-0 group-[.active]:scale-y-100 shadow-[0_0_15px_#fff]`}></div>
                    )}
                  </NavLink>
                ))}
              </div>
              {isCollapsed && <div className="h-px bg-white/5 mx-6" />}
            </div>
          ))}
        </nav>

        {/* PREMIUM FOOTER */}
        <div className="p-8 relative z-10">
          <div className="bg-white/5 rounded-[2.5rem] p-3 border border-white/5 backdrop-blur-sm group/footer overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/10 rounded-full translate-x-1/2 -translate-y-1/2 blur-2xl opacity-0 group-hover/footer:opacity-100 transition-opacity duration-700" />
            
            <button 
              onClick={() => authService.logout()} 
              className={`
                flex items-center gap-5 w-full px-6 py-5 rounded-[1.75rem] text-accent hover:bg-accent hover:text-white transition-all duration-500 group/btn
                ${isCollapsed ? 'justify-center px-0' : ''}
              `}
            >
              <LogOut size={24} className="group-hover/btn:-translate-x-2 transition-transform duration-500" />
              {!isCollapsed && (
                <div className="flex flex-col items-start">
                  <span className="font-bold text-[10px] uppercase tracking-widest leading-none">Cerrar Sesión</span>
                  <span className="text-[8px] font-medium uppercase tracking-widest mt-1 opacity-40 group-hover/btn:opacity-100">Finalizar Jornada</span>
                </div>
              )}
            </button>
          </div>

          {!isCollapsed && (
            <div className="mt-8 flex items-center justify-center gap-4 opacity-20 hover:opacity-50 transition-opacity duration-500 cursor-default">
              <ShieldCheck size={14} />
              <span className="text-[8px] font-bold uppercase tracking-[0.5em]">Secure Enterprise v2.4</span>
            </div>
          )}
        </div>
      </aside>
      
      {isMobileOpen && (
        <div className="fixed inset-0 bg-bg-dark/80 backdrop-blur-xl z-40 md:hidden animate-in fade-in duration-700" onClick={toggleMobile} />
      )}
    </>
  );
};

export default Sidebar;

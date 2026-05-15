import { Outlet, Link, useLocation } from 'react-router-dom';
import { LogOut, LayoutDashboard, Bell } from 'lucide-react';
import { authService } from '../../services/authService';
import logo from '../../assets/logoZapatitos.webp';
import './ClientLayout.css';

const ClientLayout = () => {
  const location = useLocation();
  const userName = authService.getUserName() || 'Cliente';

  return (
    <div className="client-layout">
      {/* GLOW DECORATION */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent z-[100]" />
      
      <header className="client-topbar">
        <div className="container mx-auto px-6 flex items-center justify-between h-20">
          <div className="client-brand">
            <Link to="/cliente/dashboard" className="brand-link group">
              <div className="w-12 h-12 bg-white rounded-2xl shadow-xl shadow-slate-200/50 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 border border-slate-100">
                <img src={logo} alt="Zapatitos" className="w-8 h-8 object-contain" />
              </div>
              <div className="brand-text">
                <span className="brand-name">Zapatitos</span>
                <span className="brand-tagline">Portal de Experiencias</span>
              </div>
            </Link>
          </div>

          <nav className="hidden md:flex items-center gap-10">
            <Link 
              to="/cliente/dashboard" 
              className={`nav-link ${location.pathname.includes('dashboard') ? 'active' : ''}`}
            >
              <LayoutDashboard size={18} /> 
              <span>Mis Eventos</span>
            </Link>
            <Link 
              to="/reservar" 
              className="nav-link"
            >
              <span>Nueva Reserva</span>
            </Link>
          </nav>
          
          <div className="client-actions">
            <button className="icon-btn">
              <Bell size={20} />
            </button>
            
            <div className="h-6 w-px bg-slate-200 mx-2" />

            <div className="client-user group">
              <div className="w-10 h-10 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 font-black text-sm border-2 border-white shadow-sm group-hover:border-indigo-100 transition-all">
                {userName.charAt(0).toUpperCase()}
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-black text-slate-800 leading-none">{userName}</span>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Cliente VIP</span>
              </div>
            </div>

            <button className="logout-btn-premium" onClick={() => authService.logout('/cliente/login')}>
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>

      <main className="client-content">
        <div className="container mx-auto px-6">
          <Outlet />
        </div>
      </main>

      <footer className="py-12 border-t border-slate-100 bg-white mt-auto">
        <div className="container mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-3">
            <img src={logo} alt="Zapatitos" className="w-8 h-8 opacity-30" />
            <span className="text-slate-300 font-black text-xs uppercase tracking-widest italic">Zapatitos Events Management — 2026</span>
          </div>
          <div className="flex items-center gap-8">
            <a href="#" className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-primary transition-colors">Términos</a>
            <a href="#" className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-primary transition-colors">Privacidad</a>
            <a href="#" className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-primary transition-colors">Soporte</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default ClientLayout;

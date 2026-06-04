import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, ChevronDown, LogOut, User, Calendar, Sparkles } from 'lucide-react';
import { authService } from '../../services/authService';
import logo from '../../assets/logoZapatitos.webp';

const Navbar = ({ promoBanner, logoSrc }: { promoBanner?: string; logoSrc?: string }) => {
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userName, setUserName] = useState('');
  const [isAdminOrStaff, setIsAdminOrStaff] = useState(false);
  const [bannerVisible, setBannerVisible] = useState(true);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener('scroll', handleScroll);

    // Sync auth status
    const checkAuth = () => {
      const authed = authService.isAuthenticated();
      setIsAuthenticated(authed);
      if (authed) {
        setUserName(authService.getUserName());
        setIsAdminOrStaff(authService.hasRole(['Administrador', 'Empleado']));
      } else {
        setUserName('');
        setIsAdminOrStaff(false);
      }
    };

    checkAuth();
    // In case auth status changes dynamically (e.g. from logout/login)
    const interval = setInterval(checkAuth, 1000);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearInterval(interval);
    };
  }, []);

  const handleLogout = () => {
    authService.logout('/cliente/login');
  };

  const menuItems = [
    { label: 'Inicio', path: '/' },
    { label: 'Servicios y Paquetes', path: '/servicios-y-paquetes' },
    { label: 'Sobre Nosotros', path: '/sobre-nosotros' },
    { label: 'Contacto', path: '/contacto' }
  ];

  const getPortalPath = () => {
    return isAdminOrStaff ? '/admin' : '/cliente';
  };

  const hasBanner = promoBanner && bannerVisible;

  return (
    <header 
      className={`
        fixed inset-x-0 top-0 z-[100] overflow-visible transition-all duration-500
        ${scrolled ? 'py-3' : 'py-4'}
      `}
    >
      <AnimatePresence>
        {hasBanner && !scrolled && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="relative z-[110] mx-auto mb-3 flex max-w-5xl items-center justify-center rounded-2xl bg-slate-900/95 px-6 py-2 text-center shadow-xl shadow-slate-900/15"
          >
            <p className="text-[9px] font-black text-white uppercase tracking-[0.3em] animate-pulse">
              {promoBanner}
            </p>
            <button 
              type="button"
              onClick={(e) => { e.stopPropagation(); setBannerVisible(false); }}
              className="absolute right-4 text-white/60 hover:text-white transition-colors p-1 hover:bg-white/10 rounded-full"
            >
              <X size={12} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="container mx-auto px-4 sm:px-6">
        <div className={`
          flex items-center justify-between rounded-[2rem] border px-4 py-3 transition-all duration-500 sm:px-5
          ${scrolled
            ? 'border-purple-100 bg-white/95 shadow-premium backdrop-blur-xl'
            : 'border-white/70 bg-white/[0.82] shadow-xl shadow-purple-100/30 backdrop-blur-xl'
          }
        `}>
        {/* LOGO */}
        <Link to="/" className="flex items-center gap-3 group cursor-pointer">
          <div className="w-12 h-12 bg-white rounded-2xl shadow-lg shadow-primary/10 flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
            <img src={logoSrc || logo} alt="Zapatitos" className="w-8 h-8 object-contain" />
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-display font-black text-bg-dark tracking-tighter leading-none">Zapatitos</span>
            <span className="text-[9px] font-black text-primary uppercase tracking-[0.2em]">Salón de Eventos</span>
          </div>
        </Link>

        {/* DESKTOP MENU */}
        <nav className="hidden lg:flex items-center gap-6 xl:gap-8">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link 
                key={item.label}
                to={item.path} 
                className={`text-sm font-bold transition-colors relative group ${isActive ? 'text-primary' : 'text-slate-600 hover:text-primary'}`}
              >
                {item.label}
                <span className={`absolute -bottom-1 left-0 h-0.5 bg-primary transition-all duration-300 ${isActive ? 'w-full' : 'w-0 group-hover:w-full'}`} />
              </Link>
            );
          })}
          
          <div className="h-4 w-[1px] bg-purple-100" />

          {isAuthenticated ? (
            <div className="relative">
              <button 
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                onBlur={() => setTimeout(() => setUserDropdownOpen(false), 200)}
                className="flex items-center gap-2.5 px-4 py-2 bg-purple-50 hover:bg-purple-100 rounded-2xl text-primary text-xs font-black uppercase tracking-widest transition-all"
              >
                <User size={14} />
                <span>{userName || 'Mi Cuenta'}</span>
                <ChevronDown size={14} className={`transition-transform duration-300 ${userDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {userDropdownOpen && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute right-0 mt-3 w-52 bg-white rounded-2xl border border-purple-50 shadow-2xl p-2.5 flex flex-col gap-1 z-[110]"
                  >
                    <Link 
                      to={getPortalPath()}
                      className="flex items-center gap-3 px-4.5 py-3 hover:bg-purple-50 text-slate-700 hover:text-primary rounded-xl text-xs font-bold transition-colors"
                    >
                      <Sparkles size={14} />
                      {isAdminOrStaff ? 'Panel de Control' : 'Mis Eventos'}
                    </Link>
                    {!isAdminOrStaff && (
                      <Link 
                        to="/cliente/perfil"
                        className="flex items-center gap-3 px-4.5 py-3 hover:bg-purple-50 text-slate-700 hover:text-primary rounded-xl text-xs font-bold transition-colors"
                      >
                        <User size={14} />
                        Mi Perfil
                      </Link>
                    )}
                    <button 
                      onClick={handleLogout}
                      className="flex items-center gap-3 px-4.5 py-3 hover:bg-rose-50 text-rose-600 rounded-xl text-xs font-bold transition-colors text-left w-full"
                    >
                      <LogOut size={14} />
                      Cerrar Sesión
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <Link 
                to="/cliente/login" 
                className="text-xs font-black uppercase tracking-widest text-slate-600 hover:text-primary transition-colors"
              >
                Ingresar
              </Link>
              <Link 
                to="/reservar" 
                className="bg-gradient-to-r from-primary to-pink-500 text-white px-6 py-3 rounded-full text-xs font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg shadow-primary/20 flex items-center gap-2"
              >
                <Calendar size={14} />
                Reservar Online
              </Link>
            </div>
          )}
        </nav>

        {/* MOBILE MENU TOGGLE */}
        <button 
          className="lg:hidden w-12 h-12 flex items-center justify-center text-slate-700 bg-slate-50 border border-purple-50 rounded-2xl active:scale-90 transition-all"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X size={26} /> : <Menu size={26} />}
        </button>
        </div>
      </div>

      {/* MOBILE DRAWER */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden absolute top-[100%] inset-x-0 bg-white border-t border-purple-50 p-6 flex flex-col gap-5 shadow-2xl overflow-hidden"
          >
            {menuItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link 
                  key={item.label}
                  to={item.path} 
                  className={`text-xl font-black tracking-tight transition-colors ${isActive ? 'text-primary' : 'text-slate-800 hover:text-primary'}`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.label}
                </Link>
              );
            })}

            <div className="h-px bg-purple-50 my-2" />

            {isAuthenticated ? (
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-3 px-2 text-slate-500 text-sm font-bold">
                  <User size={16} className="text-primary" />
                  <span>Hola, {userName}</span>
                </div>
                <Link 
                  to={getPortalPath()}
                  className="bg-purple-50 text-primary text-center py-[1.125rem] rounded-2xl font-black uppercase tracking-widest text-xs shadow-sm"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {isAdminOrStaff ? 'Panel de Control' : 'Mis Eventos'}
                </Link>
                <button 
                  onClick={() => { setMobileMenuOpen(false); handleLogout(); }}
                  className="bg-rose-50 text-rose-600 text-center py-[1.125rem] rounded-2xl font-black uppercase tracking-widest text-xs"
                >
                  Cerrar Sesión
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <Link 
                  to="/cliente/login" 
                  className="text-center py-4 text-slate-600 font-black uppercase tracking-widest text-xs border border-slate-200 rounded-2xl"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Ingresar al Portal
                </Link>
                <Link 
                  to="/reservar" 
                  className="bg-gradient-to-r from-primary to-pink-500 text-white text-center py-[1.125rem] rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg shadow-primary/20"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Reservar Online
                </Link>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Navbar;

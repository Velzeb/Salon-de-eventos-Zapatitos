import { useEffect, useState } from 'react';
import { Outlet, Link, NavLink, useNavigate } from 'react-router-dom';
import { CalendarPlus, LayoutDashboard, LogOut, UserRound } from 'lucide-react';
import { authService } from '../../services/authService';
import { clientePortalService, type PerfilCliente } from '../../services/clientePortalService';
import logo from '../../assets/logoZapatitos.webp';

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold transition-colors ${
    isActive ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
  }`;

const ClientLayout = () => {
  const navigate = useNavigate();
  const [perfil, setPerfil] = useState<PerfilCliente | null>(null);
  const fallbackName = authService.getUserName() || 'Cliente';
  const displayName = perfil?.nombreCompleto || fallbackName;
  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .map((word) => word[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  useEffect(() => {
    let active = true;
    clientePortalService
      .getPerfil()
      .then((data) => {
        if (active) setPerfil(data);
      })
      .catch(() => {
        if (active) setPerfil(null);
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link to="/cliente/dashboard" className="flex min-w-0 items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white">
              <img src={logo} alt="Zapatitos" className="h-7 w-7 object-contain" />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-base font-black leading-tight">Portal de cliente</span>
              <span className="block truncate text-xs font-medium text-slate-500">Zapatitos</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            <NavLink to="/cliente/dashboard" className={navLinkClass}>
              <LayoutDashboard size={17} />
              Mis eventos
            </NavLink>
            <NavLink to="/cliente/perfil" className={navLinkClass}>
              <UserRound size={17} />
              Perfil
            </NavLink>
            <Link
              to="/reservar"
              className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
            >
              <CalendarPlus size={17} />
              Nueva reserva
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/cliente/perfil')}
              className="hidden items-center gap-3 rounded-md border border-slate-200 bg-white px-3 py-2 text-left transition-colors hover:bg-slate-50 sm:flex"
            >
              {perfil?.fotoPerfilUrl ? (
                <img src={perfil.fotoPerfilUrl} alt={displayName} className="h-8 w-8 rounded-full object-cover" />
              ) : (
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-xs font-black text-indigo-700">
                  {initials || 'C'}
                </span>
              )}
              <span className="max-w-40 truncate text-sm font-bold">{displayName}</span>
            </button>
            <button
              className="inline-flex h-10 w-10 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-rose-50 hover:text-rose-600"
              onClick={() => authService.logout('/cliente/login')}
              title="Cerrar sesión"
            >
              <LogOut size={19} />
            </button>
          </div>
        </div>

        <nav className="flex gap-1 overflow-x-auto border-t border-slate-100 px-4 py-2 md:hidden">
          <NavLink to="/cliente/dashboard" className={navLinkClass}>
            <LayoutDashboard size={16} />
            Mis eventos
          </NavLink>
          <NavLink to="/cliente/perfil" className={navLinkClass}>
            <UserRound size={16} />
            Perfil
          </NavLink>
          <Link to="/reservar" className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold text-slate-600">
            <CalendarPlus size={16} />
            Reservar
          </Link>
        </nav>
      </header>

      <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Outlet />
      </main>
    </div>
  );
};

export default ClientLayout;

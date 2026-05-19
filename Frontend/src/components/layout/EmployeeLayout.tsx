import { useEffect, useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { CalendarDays, ClipboardList, LayoutDashboard, LogOut } from 'lucide-react';
import { authService } from '../../services/authService';
import { empleadoPortalService, type EmpleadoPerfil } from '../../services/empleadoPortalService';
import logo from '../../assets/logoZapatitos.webp';

const navClass = ({ isActive }: { isActive: boolean }) =>
  `inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-bold transition ${
    isActive ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
  }`;

const EmployeeLayout = () => {
  const [perfil, setPerfil] = useState<EmpleadoPerfil | null>(null);
  const name = perfil?.nombreCompleto || authService.getUserName() || 'Empleado';
  const initials = name.split(' ').filter(Boolean).map(part => part[0]).join('').slice(0, 2).toUpperCase();

  useEffect(() => {
    empleadoPortalService.getMe().then(setPerfil).catch(() => setPerfil(null));
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white">
              <img src={logo} alt="Zapatitos" className="h-7 w-7 object-contain" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-base font-black leading-tight">Panel operativo</p>
              <p className="truncate text-xs font-semibold text-slate-500">{perfil?.puesto || 'Empleado'}</p>
            </div>
          </div>

          <nav className="hidden items-center gap-1 md:flex">
            <NavLink to="/empleado/jornada" className={navClass}>
              <LayoutDashboard size={17} />
              Mi jornada
            </NavLink>
            <NavLink to="/empleado/eventos" className={navClass}>
              <CalendarDays size={17} />
              Eventos
            </NavLink>
          </nav>

          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-3 rounded-md border border-slate-200 bg-white px-3 py-2 sm:flex">
              {perfil?.fotoPerfilUrl ? (
                <img src={perfil.fotoPerfilUrl} alt={name} className="h-8 w-8 rounded-full object-cover" />
              ) : (
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-xs font-black text-indigo-700">
                  {initials || 'E'}
                </span>
              )}
              <span className="max-w-40 truncate text-sm font-bold">{name}</span>
            </div>
            <button
              onClick={() => authService.logout('/login')}
              className="inline-flex h-10 w-10 items-center justify-center rounded-md text-slate-500 hover:bg-rose-50 hover:text-rose-600"
              title="Cerrar sesión"
            >
              <LogOut size={19} />
            </button>
          </div>
        </div>
        <nav className="flex gap-2 overflow-x-auto border-t border-slate-100 px-4 py-2 md:hidden">
          <NavLink to="/empleado/jornada" className={navClass}>
            <ClipboardList size={16} />
            Jornada
          </NavLink>
          <NavLink to="/empleado/eventos" className={navClass}>
            <CalendarDays size={16} />
            Eventos
          </NavLink>
        </nav>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Outlet />
      </main>
    </div>
  );
};

export default EmployeeLayout;

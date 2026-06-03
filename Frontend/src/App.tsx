import { lazy, Suspense, type ReactNode } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { authService } from './services/authService';
import Toaster from './components/common/Toaster';

const LoginPage = lazy(() => import('./pages/Login/LoginPage'));
const DashboardPage = lazy(() => import('./pages/Dashboard/DashboardPage'));
const CMSPage = lazy(() => import('./pages/CMS/CMSPage'));
const ReservasPage = lazy(() => import('./pages/Reservas/ReservasPage'));
const ReservaNuevaPage = lazy(() => import('./pages/Reservas/ReservaNuevaPage'));
const InventarioPage = lazy(() => import('./pages/Inventario/InventarioPage'));
const PaquetesPage = lazy(() => import('./pages/Paquetes/PaquetesPage'));
const EmpleadosPage = lazy(() => import('./pages/Empleados/EmpleadosPage'));
const FinanzasPage = lazy(() => import('./pages/Finanzas/FinanzasPage'));
const NominasPage = lazy(() => import('./pages/Finanzas/NominasPage'));
const OperativoPage = lazy(() => import('./pages/Operativo/OperativoPage'));
const ServiciosPage = lazy(() => import('./pages/Servicios/ServiciosPage'));
const ProduccionPage = lazy(() => import('./pages/Produccion/ProduccionPage'));
const ProveedoresPage = lazy(() => import('./pages/Proveedores/ProveedoresPage'));
const ClientesPage = lazy(() => import('./pages/Clientes/ClientesPage'));
const DetalleOperativoPage = lazy(() => import('./pages/Operativo/DetalleOperativoPage'));
const TareasPlantillaPage = lazy(() => import('./pages/Operativo/TareasPlantillaPage'));
const LandingPage = lazy(() => import('./pages/Landing/LandingPage'));
const BookingPage = lazy(() => import('./pages/Landing/BookingPage'));
const InvitacionPublicaPage = lazy(() => import('./pages/Landing/InvitacionPublicaPage'));
const ClienteLoginPage = lazy(() => import('./pages/Cliente/ClienteLoginPage'));
const ServiciosPaquetesPage = lazy(() => import('./pages/Landing/ServiciosPaquetesPage'));
const SobreNosotrosPage = lazy(() => import('./pages/Landing/SobreNosotrosPage'));
const ContactoPage = lazy(() => import('./pages/Landing/ContactoPage'));
const PublicLayout = lazy(() => import('./components/layout/PublicLayout'));
const ClienteDashboardPage = lazy(() => import('./pages/Cliente/ClienteDashboardPage'));
const EventoClienteDetailPage = lazy(() => import('./pages/Cliente/EventoClienteDetailPage'));
const ClientePerfilPage = lazy(() => import('./pages/Cliente/ClientePerfilPage'));
const AdminLayout = lazy(() => import('./components/layout/AdminLayout'));
const ClientLayout = lazy(() => import('./components/layout/ClientLayout'));
const EmployeeLayout = lazy(() => import('./components/layout/EmployeeLayout'));
const EmpleadoJornadaPage = lazy(() => import('./pages/Empleado/EmpleadoJornadaPage'));
const EmpleadoEventosPage = lazy(() => import('./pages/Empleado/EmpleadoEventosPage'));
const EmpleadoEventoDetailPage = lazy(() => import('./pages/Empleado/EmpleadoEventoDetailPage'));
const MiHistorialPagosPage = lazy(() => import('./pages/Empleado/MiHistorialPagosPage'));

// Componente para rutas protegidas
const ProtectedRoute = ({
  children,
  roles,
  redirectTo = '/login'
}: {
  children: ReactNode;
  roles?: string[];
  redirectTo?: string;
}) => {
  if (!authService.isAuthenticated()) {
    return <Navigate to={redirectTo} replace />;
  }
  if (roles && !authService.hasRole(roles)) {
    return <Navigate to={redirectTo} replace />;
  }
  return <>{children}</>;
};

const RouteFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-bg-main">
    <div className="h-10 w-10 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
  </div>
);

// Componente para redirección del Index de Admin según rol
const AdminIndexRedirect = () => {
  if (authService.hasRole(['Administrador'])) {
    return <Navigate to="dashboard" replace />;
  }
  return <Navigate to="/empleado/jornada" replace />;
};

function App() {
  return (
    <Router>
      <Toaster />
      <Suspense fallback={<RouteFallback />}>
      <Routes>
        {/* Rutas Públicas con Header y Footer Unificados */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<LandingPage />} />
          <Route path="/servicios-y-paquetes" element={<ServiciosPaquetesPage />} />
          <Route path="/sobre-nosotros" element={<SobreNosotrosPage />} />
          <Route path="/contacto" element={<ContactoPage />} />
        </Route>
        
        <Route path="/reservar" element={<BookingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/cliente/login" element={<ClienteLoginPage />} />
        <Route path="/invitacion/:token" element={<InvitacionPublicaPage />} />
        
        {/* Rutas Protegidas bajo el AdminLayout */}
        <Route 
          path="/admin" 
          element={
            <ProtectedRoute roles={['Administrador', 'Empleado']} redirectTo="/login">
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<AdminIndexRedirect />} />
          <Route path="dashboard" element={<ProtectedRoute roles={['Administrador']} redirectTo="/admin/operativo"><DashboardPage /></ProtectedRoute>} />
          <Route path="cms" element={<ProtectedRoute roles={['Administrador']} redirectTo="/admin/operativo"><CMSPage /></ProtectedRoute>} />
          <Route path="reservas" element={<ProtectedRoute roles={['Administrador']} redirectTo="/admin/operativo"><ReservasPage /></ProtectedRoute>} />
          <Route path="reservas/nueva" element={<ProtectedRoute roles={['Administrador']} redirectTo="/admin/operativo"><ReservaNuevaPage /></ProtectedRoute>} />
          <Route path="clientes" element={<ProtectedRoute roles={['Administrador']} redirectTo="/admin/operativo"><ClientesPage /></ProtectedRoute>} />
          <Route path="inventario" element={<ProtectedRoute roles={['Administrador']} redirectTo="/admin/operativo"><InventarioPage /></ProtectedRoute>} />
          <Route path="proveedores" element={<ProtectedRoute roles={['Administrador']} redirectTo="/admin/operativo"><ProveedoresPage /></ProtectedRoute>} />
          <Route path="produccion" element={<ProtectedRoute roles={['Administrador']} redirectTo="/admin/operativo"><ProduccionPage /></ProtectedRoute>} />
          <Route path="servicios" element={<ProtectedRoute roles={['Administrador']} redirectTo="/admin/operativo"><ServiciosPage /></ProtectedRoute>} />
          <Route path="paquetes" element={<ProtectedRoute roles={['Administrador']} redirectTo="/admin/operativo"><PaquetesPage /></ProtectedRoute>} />
          <Route path="empleados" element={<ProtectedRoute roles={['Administrador']} redirectTo="/admin/operativo"><EmpleadosPage /></ProtectedRoute>} />
          <Route path="finanzas" element={<ProtectedRoute roles={['Administrador']} redirectTo="/admin/operativo"><FinanzasPage /></ProtectedRoute>} />
          <Route path="nominas" element={<ProtectedRoute roles={['Administrador']} redirectTo="/admin/operativo"><NominasPage /></ProtectedRoute>} />
          <Route path="tareas-generales" element={<ProtectedRoute roles={['Administrador']} redirectTo="/admin/operativo"><TareasPlantillaPage /></ProtectedRoute>} />
          
          {/* Rutas para Empleados y Administradores */}
          <Route path="operativo" element={<OperativoPage />} />
          <Route path="operativo/:id" element={<DetalleOperativoPage />} />
          <Route path="reservas/:id" element={<Navigate to="../operativo/:id" replace />} />
        </Route>

        <Route
          path="/empleado"
          element={
            <ProtectedRoute roles={['Empleado']} redirectTo="/login">
              <EmployeeLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="jornada" replace />} />
          <Route path="jornada" element={<EmpleadoJornadaPage />} />
          <Route path="eventos" element={<EmpleadoEventosPage />} />
          <Route path="eventos/:id" element={<EmpleadoEventoDetailPage />} />
          <Route path="pagos" element={<MiHistorialPagosPage />} />
        </Route>

        <Route
          path="/cliente"
          element={
            <ProtectedRoute roles={['Cliente']} redirectTo="/cliente/login">
              <ClientLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<ClienteDashboardPage />} />
          <Route path="eventos/:id" element={<EventoClienteDetailPage />} />
          <Route path="perfil" element={<ClientePerfilPage />} />
        </Route>

        {/* Redirección por defecto */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      </Suspense>
    </Router>
  );
}

export default App;

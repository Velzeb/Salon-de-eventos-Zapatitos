import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/Login/LoginPage';
import DashboardPage from './pages/Dashboard/DashboardPage';
import CMSPage from './pages/CMS/CMSPage';
import ReservasPage from './pages/Reservas/ReservasPage';
import ReservaNuevaPage from './pages/Reservas/ReservaNuevaPage';
import InventarioPage from './pages/Inventario/InventarioPage';
import PaquetesPage from './pages/Paquetes/PaquetesPage';
import EmpleadosPage from './pages/Empleados/EmpleadosPage';
import FinanzasPage from './pages/Finanzas/FinanzasPage';
import NominasPage from './pages/Finanzas/NominasPage';
import OperativoPage from './pages/Operativo/OperativoPage';
import ServiciosPage from './pages/Servicios/ServiciosPage';
import ProduccionPage from './pages/Produccion/ProduccionPage';
import ProveedoresPage from './pages/Proveedores/ProveedoresPage';
import DetalleOperativoPage from './pages/Operativo/DetalleOperativoPage';
import LandingPage from './pages/Landing/LandingPage';
import BookingPage from './pages/Landing/BookingPage';
import InvitacionPublicaPage from './pages/Landing/InvitacionPublicaPage';
import ClienteLoginPage from './pages/Cliente/ClienteLoginPage';
import ClienteDashboardPage from './pages/Cliente/ClienteDashboardPage';
import EventoClienteDetailPage from './pages/Cliente/EventoClienteDetailPage';
import ClientePerfilPage from './pages/Cliente/ClientePerfilPage';
import AdminLayout from './components/layout/AdminLayout';
import ClientLayout from './components/layout/ClientLayout';
import { authService } from './services/authService';
import Toaster from './components/common/Toaster';

// Componente para rutas protegidas
const ProtectedRoute = ({
  children,
  roles,
  redirectTo = '/login'
}: {
  children: React.ReactNode;
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

// Componente para redirección del Index de Admin según rol
const AdminIndexRedirect = () => {
  if (authService.hasRole(['Administrador'])) {
    return <Navigate to="dashboard" replace />;
  }
  return <Navigate to="operativo" replace />;
};

function App() {
  return (
    <Router>
      <Toaster />
      <Routes>
        <Route path="/" element={<LandingPage />} />
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
          <Route path="inventario" element={<ProtectedRoute roles={['Administrador']} redirectTo="/admin/operativo"><InventarioPage /></ProtectedRoute>} />
          <Route path="proveedores" element={<ProtectedRoute roles={['Administrador']} redirectTo="/admin/operativo"><ProveedoresPage /></ProtectedRoute>} />
          <Route path="produccion" element={<ProtectedRoute roles={['Administrador']} redirectTo="/admin/operativo"><ProduccionPage /></ProtectedRoute>} />
          <Route path="servicios" element={<ProtectedRoute roles={['Administrador']} redirectTo="/admin/operativo"><ServiciosPage /></ProtectedRoute>} />
          <Route path="paquetes" element={<ProtectedRoute roles={['Administrador']} redirectTo="/admin/operativo"><PaquetesPage /></ProtectedRoute>} />
          <Route path="empleados" element={<ProtectedRoute roles={['Administrador']} redirectTo="/admin/operativo"><EmpleadosPage /></ProtectedRoute>} />
          <Route path="finanzas" element={<ProtectedRoute roles={['Administrador']} redirectTo="/admin/operativo"><FinanzasPage /></ProtectedRoute>} />
          <Route path="nominas" element={<ProtectedRoute roles={['Administrador']} redirectTo="/admin/operativo"><NominasPage /></ProtectedRoute>} />
          
          {/* Rutas para Empleados y Administradores */}
          <Route path="operativo" element={<OperativoPage />} />
          <Route path="operativo/:id" element={<DetalleOperativoPage />} />
          <Route path="reservas/:id" element={<Navigate to="../operativo/:id" replace />} />
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
    </Router>
  );
}

export default App;

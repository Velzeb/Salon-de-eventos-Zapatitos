import { useEffect, useState } from 'react';
import { Plus, RefreshCw, Users, Mail, Briefcase, Shield, X, UserPlus, Fingerprint, Edit2, Trash2, Power } from 'lucide-react';
import { empleadosService } from '../../services/empleadosService';
import type { Empleado, CreateEmpleadoCommand } from '../../services/empleadosService';
import { toast } from 'sonner';
import ImageUpload from '../../components/common/ImageUpload';

const EmpleadosPage = () => {
  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUpdateMode, setIsUpdateMode] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<CreateEmpleadoCommand & { activo?: boolean }>({
    username: '',
    email: '',
    password: '',
    nombreCompleto: '',
    rol: 'Empleado',
    puesto: '',
    activo: true,
    fotoPerfilUrl: ''
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadEmpleados();
  }, []);

  const loadEmpleados = async () => {
    setLoading(true);
    try {
      const data = await empleadosService.getEmpleados();
      setEmpleados(data);
    } catch (err) {
      toast.error('Error al cargar empleados');
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setIsUpdateMode(false);
    setEditingId(null);
    setFormData({
      username: '',
      email: '',
      password: '',
      nombreCompleto: '',
      rol: 'Empleado',
      puesto: '',
      activo: true,
      fotoPerfilUrl: ''
    });
    setIsModalOpen(true);
  };

  const openUpdateModal = (emp: Empleado) => {
    setIsUpdateMode(true);
    setEditingId(emp.id);
    setFormData({
      username: emp.username,
      email: emp.email,
      password: '', // Password is not updated here in the current logic, unless we want to over-complicate it.
      nombreCompleto: emp.nombreCompleto,
      rol: emp.rol as any,
      puesto: emp.puesto || '',
      activo: emp.estado === 'Activo',
      fotoPerfilUrl: emp.fotoPerfilUrl || ''
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if(!window.confirm('¿Está seguro de eliminar este empleado? Esta acción no se puede deshacer.')) return;
    try {
      await empleadosService.deleteEmpleado(id);
      toast.success('Empleado eliminado');
      await loadEmpleados();
    } catch(err) {
      toast.error('Error al eliminar empleado');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.nombreCompleto || !formData.rol) {
      toast.error('Por favor complete los campos obligatorios.');
      return;
    }

    setSaving(true);
    try {
      if (isUpdateMode && editingId) {
        await empleadosService.updateEmpleado(editingId, {
          empleadoId: editingId,
          nombreCompleto: formData.nombreCompleto,
          puesto: formData.puesto,
          rol: formData.rol,
          activo: formData.activo ?? true,
          fotoPerfilUrl: formData.fotoPerfilUrl
        });
        toast.success('Empleado actualizado correctamente');
      } else {
        if (!formData.username || !formData.email || !formData.password) {
          toast.error('Por favor complete las credenciales para el nuevo empleado.');
          setSaving(false);
          return;
        }
        await empleadosService.createEmpleado(formData);
        toast.success('Empleado registrado correctamente');
      }
      
      await loadEmpleados();
      setIsModalOpen(false);
    } catch (err: any) {
      const errorMsg = err.response?.data?.[0] || 'Error al guardar empleado';
      toast.error(errorMsg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-6">
          <div className="w-14 h-14 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
            <Users size={24} />
          </div>
          <div className="space-y-1">
            <h1 className="text-2xl font-bold text-slate-800">
              Equipo de Trabajo
            </h1>
            <p className="text-slate-500 font-medium text-sm">
              Gestión Maestra de Staff y Permisos
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button 
            onClick={loadEmpleados}
            className="w-11 h-11 bg-white border border-slate-200 text-slate-600 rounded-lg flex items-center justify-center hover:bg-slate-50 transition-colors shadow-sm"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
          <button 
            className="bg-indigo-600 text-white flex items-center gap-2 px-6 py-2.5 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm" 
            onClick={openCreateModal}
          >
            <Plus size={18} /> 
            <span className="font-semibold text-sm">Añadir Staff</span>
          </button>
        </div>
      </div>

      {/* STAFF CONTENT AREA */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-32 flex flex-col items-center justify-center space-y-4">
            <RefreshCw className="animate-spin text-indigo-500" size={32} />
            <p className="text-slate-500 font-medium text-sm">Cargando nómina...</p>
          </div>
        ) : empleados.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50">
                <tr className="border-b border-slate-200">
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Perfil Profesional</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Rol / Seguridad</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Contacto Corporativo</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Estado</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {empleados.map((e) => (
                  <tr key={e.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          {e.fotoPerfilUrl ? (
                            <img src={e.fotoPerfilUrl} alt={e.nombreCompleto} className="w-12 h-12 rounded-lg object-cover border border-slate-100" />
                          ) : (
                            <div className="w-12 h-12 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-lg border border-indigo-100">
                              {e.nombreCompleto.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                            </div>
                          )}
                          <div className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-white ${e.estado === 'Activo' ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-800 text-sm">
                            {e.nombreCompleto}
                          </span>
                          <span className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                            <Briefcase size={12} className="text-slate-400" />
                            {e.puesto || 'Puesto no asignado'}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-700">
                        <Shield size={12} className={e.rol === 'Administrador' ? 'text-indigo-600' : 'text-slate-400'} />
                        {e.rol}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1 text-sm text-slate-600">
                        <div className="flex items-center gap-2">
                          <Mail size={14} className="text-slate-400" />
                          <span>{e.email}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          <Fingerprint size={12} className="text-slate-400" />
                          <span className="text-slate-500">@{e.username}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium ${e.estado === 'Activo' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-700'}`}>
                        {e.estado}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button 
                          onClick={() => openUpdateModal(e)}
                          className="w-8 h-8 rounded border bg-white text-indigo-600 border-slate-200 hover:bg-slate-50 flex items-center justify-center transition-colors shadow-sm"
                          title="Editar"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button 
                          onClick={() => handleDelete(e.id)}
                          className="w-8 h-8 rounded border bg-white text-rose-500 border-slate-200 hover:bg-rose-50 flex items-center justify-center transition-colors shadow-sm"
                          title="Eliminar"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-32 flex flex-col items-center justify-center space-y-4">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-400">
              <UserPlus size={32} />
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-slate-800">Nómina Vacía</p>
              <p className="text-sm text-slate-500">Comienza integrando talento a tu equipo.</p>
            </div>
            <button 
              onClick={openCreateModal}
              className="mt-4 px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors"
            >
              Registrar Primer Empleado
            </button>
          </div>
        )}
      </div>

      {/* REGISTRATION SIDE PANEL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex justify-end animate-in fade-in duration-300">
          <div 
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" 
            onClick={() => setIsModalOpen(false)}
          />
          <div className="relative w-full max-w-lg bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-500">
            {/* PANEL HEADER */}
            <div className="flex items-center justify-between p-6 border-b border-slate-200 bg-white">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600">
                  <UserPlus size={24} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-800">{isUpdateMode ? 'Editar Talento' : 'Nuevo Talento'}</h2>
                  <p className="text-xs text-slate-500">{isUpdateMode ? 'Actualizando Perfil Corporativo' : 'Creando Perfil Corporativo'}</p>
                </div>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="w-10 h-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* FORM CONTENT */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-8">
              {/* SECTION 1: CREDENTIALS */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2">Seguridad y Acceso</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600">Username</label>
                    <input
                      required={!isUpdateMode}
                      disabled={isUpdateMode}
                      placeholder="p. ej. jdoe"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 outline-none focus:border-indigo-500 transition-colors text-sm text-slate-800 disabled:opacity-50"
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600">Email Corporativo</label>
                    <input
                      type="email"
                      required={!isUpdateMode}
                      disabled={isUpdateMode}
                      placeholder="staff@zapatitos.com"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 outline-none focus:border-indigo-500 transition-colors text-sm text-slate-800 disabled:opacity-50"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                </div>
                {!isUpdateMode && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600">Password Temporal</label>
                    <input
                      type="password"
                      required
                      placeholder="••••••••••••"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 outline-none focus:border-indigo-500 transition-colors text-sm text-slate-800"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    />
                  </div>
                )}
              </div>

              {/* SECTION 2: PROFESSIONAL PROFILE */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2">Identidad Profesional</h3>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600">Nombre Completo</label>
                  <input
                    required
                    placeholder="Escriba el nombre legal..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 outline-none focus:border-indigo-500 transition-colors text-sm text-slate-800"
                    value={formData.nombreCompleto}
                    onChange={(e) => setFormData({ ...formData, nombreCompleto: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600">Puesto / Cargo</label>
                    <input
                      placeholder="Ej. Coordinador"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 outline-none focus:border-indigo-500 transition-colors text-sm text-slate-800"
                      value={formData.puesto}
                      onChange={(e) => setFormData({ ...formData, puesto: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600">Privilegios</label>
                    <select
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 outline-none focus:border-indigo-500 transition-colors text-sm text-slate-800 cursor-pointer"
                      value={formData.rol}
                      onChange={(e) => setFormData({ ...formData, rol: e.target.value as CreateEmpleadoCommand['rol'] })}
                    >
                      <option value="Administrador">Administrador</option>
                      <option value="Empleado">Staff Estándar</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5 pt-2">
                  <ImageUpload
                    value={formData.fotoPerfilUrl}
                    onChange={(url) => setFormData({ ...formData, fotoPerfilUrl: url })}
                    folder="empleados"
                    label="Fotografía del Empleado (Perfil)"
                    accept="image/*"
                  />
                </div>

                {isUpdateMode && (
                  <div className="space-y-1.5 mt-4">
                    <label className="flex items-center gap-2 cursor-pointer bg-slate-50 p-3 rounded-lg border border-slate-200 hover:border-indigo-500 transition-colors">
                      <input
                        type="checkbox"
                        className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 border-slate-300 rounded cursor-pointer"
                        checked={formData.activo}
                        onChange={(e) => setFormData({ ...formData, activo: e.target.checked })}
                      />
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-800 flex items-center gap-2">
                          <Power size={14} className={formData.activo ? 'text-emerald-500' : 'text-slate-400'} />
                          Cuenta Activa
                        </span>
                        <span className="text-xs text-slate-500">Permitir que este usuario inicie sesión</span>
                      </div>
                    </label>
                  </div>
                )}
              </div>
            </form>

            {/* PANEL FOOTER */}
            <div className="p-6 border-t border-slate-200 bg-slate-50 flex gap-4">
              <button 
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="flex-1 py-2.5 rounded-lg bg-white border border-slate-200 text-slate-600 font-semibold text-sm hover:bg-slate-50 transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={handleSubmit} 
                disabled={saving}
                className="flex-1 bg-indigo-600 text-white font-semibold py-2.5 rounded-lg flex items-center justify-center gap-2 hover:bg-indigo-700 transition-colors disabled:opacity-50"
              >
                {saving ? <RefreshCw className="animate-spin" size={18} /> : <span>Guardar</span>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmpleadosPage;

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  User, Phone, MapPin, Baby, ChevronLeft,
  Save, Edit3, CheckCircle, RefreshCw
} from 'lucide-react';
import { clientePortalService, type PerfilCliente } from '../../services/clientePortalService';

const ClientePerfilPage = () => {
  const navigate = useNavigate();
  const [perfil, setPerfil] = useState<PerfilCliente | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({ nombreCompleto: '', telefono: '', direccion: '' });

  useEffect(() => { loadPerfil(); }, []);

  const loadPerfil = async () => {
    setLoading(true);
    try {
      const data = await clientePortalService.getPerfil();
      setPerfil(data);
      setForm({
        nombreCompleto: data.nombreCompleto,
        telefono: data.telefono || '',
        direccion: data.direccion || ''
      });
    } catch (err) {
      console.error('Error al cargar perfil', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await clientePortalService.updatePerfil({
        nombreCompleto: form.nombreCompleto,
        telefono: form.telefono || undefined,
        direccion: form.direccion || undefined
      });
      setSaved(true);
      setEditing(false);
      await loadPerfil();
      setTimeout(() => setSaved(false), 3000);
      toast.success('Cambios guardados correctamente.');
    } catch (err: any) {
      toast.error(err.response?.data?.join(', ') || 'Error al guardar cambios.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        <p className="text-slate-400 font-black text-[10px] uppercase tracking-widest">Cargando perfil...</p>
      </div>
    );
  }

  if (!perfil) return null;

  const initials = perfil.nombreCompleto.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6 md:p-12 space-y-10">
      {/* HEADER */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/cliente/dashboard')}
          className="w-11 h-11 bg-white rounded-2xl border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-900 hover:text-white transition-all shadow-sm"
        >
          <ChevronLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Mi Perfil</h1>
          <p className="text-sm text-slate-400 font-medium">Gestiona tu información personal</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* AVATAR & INFO CARD */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm p-10 space-y-8 text-center">
            <div className="w-28 h-28 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-4xl font-black mx-auto shadow-xl shadow-primary/30">
              {initials}
            </div>
            <div className="space-y-1">
              <p className="text-xl font-black text-slate-800">{perfil.nombreCompleto}</p>
              <p className="text-sm text-slate-400 font-medium">{perfil.email}</p>
            </div>

            <div className="space-y-3 text-left">
              <div className="flex items-center gap-3 text-slate-600">
                <Phone size={16} className="text-primary shrink-0" />
                <span className="text-sm font-medium">{perfil.telefono || 'Sin teléfono'}</span>
              </div>
              <div className="flex items-center gap-3 text-slate-600">
                <MapPin size={16} className="text-primary shrink-0" />
                <span className="text-sm font-medium">{perfil.direccion || 'Sin dirección'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* MAIN CONTENT */}
        <div className="lg:col-span-2 space-y-8">
          {/* EDIT FORM */}
          <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm p-10 space-y-8">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h2 className="text-xl font-black text-slate-800 tracking-tight">Información Personal</h2>
                <p className="text-sm text-slate-400">Mantén tus datos actualizados</p>
              </div>
              {!editing ? (
                <button
                  onClick={() => setEditing(true)}
                  className="flex items-center gap-2 px-5 py-2.5 bg-primary/10 text-primary rounded-xl font-black text-xs uppercase tracking-widest hover:bg-primary hover:text-white transition-all"
                >
                  <Edit3 size={16} /> Editar
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={() => { setEditing(false); setForm({ nombreCompleto: perfil.nombreCompleto, telefono: perfil.telefono || '', direccion: perfil.direccion || '' }); }}
                    className="px-5 py-2.5 bg-slate-100 text-slate-600 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-secondary transition-all disabled:opacity-50"
                  >
                    {saving ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
                    Guardar
                  </button>
                </div>
              )}
            </div>

            {saved && (
              <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-100 rounded-2xl p-4">
                <CheckCircle size={20} className="text-emerald-500" />
                <p className="text-sm font-bold text-emerald-700">¡Perfil actualizado correctamente!</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                { label: 'Nombre Completo', key: 'nombreCompleto', icon: User, placeholder: 'Tu nombre completo' },
                { label: 'Teléfono', key: 'telefono', icon: Phone, placeholder: '+52 123 456 7890' },
              ].map(({ label, key, icon: Icon, placeholder }) => (
                <div key={key} className="space-y-2">
                  <label className="text-xs font-black text-slate-600 uppercase tracking-widest">{label}</label>
                  <div className="relative">
                    <Icon size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={form[key as keyof typeof form]}
                      onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                      disabled={!editing}
                      placeholder={placeholder}
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 outline-none focus:border-primary transition-colors disabled:opacity-60 disabled:cursor-not-allowed font-medium"
                    />
                  </div>
                </div>
              ))}
              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-black text-slate-600 uppercase tracking-widest">Dirección</label>
                <div className="relative">
                  <MapPin size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={form.direccion}
                    onChange={(e) => setForm({ ...form, direccion: e.target.value })}
                    disabled={!editing}
                    placeholder="Tu dirección"
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 outline-none focus:border-primary transition-colors disabled:opacity-60 disabled:cursor-not-allowed font-medium"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* NIÑOS REGISTRADOS */}
          <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm p-10 space-y-8">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h2 className="text-xl font-black text-slate-800 tracking-tight">Mis Pequeños</h2>
                <p className="text-sm text-slate-400">Niños registrados en tus eventos</p>
              </div>
              <div className="w-12 h-12 bg-pink-50 rounded-2xl flex items-center justify-center text-pink-500">
                <Baby size={24} />
              </div>
            </div>

            {perfil.ninos.length === 0 ? (
              <div className="text-center py-10 space-y-3">
                <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300 mx-auto border border-slate-100">
                  <Baby size={32} />
                </div>
                <p className="text-slate-400 font-medium text-sm">Aún no hay niños registrados.</p>
                <p className="text-slate-300 text-xs">Se añaden automáticamente al crear un evento.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {perfil.ninos.map((nino) => (
                  <div key={nino.id} className="flex items-center gap-5 p-6 bg-slate-50/50 rounded-[2rem] border border-slate-100 hover:bg-white hover:border-primary/20 hover:shadow-md transition-all">
                    <div className="w-12 h-12 bg-gradient-to-br from-pink-400 to-purple-500 rounded-2xl flex items-center justify-center text-white text-lg font-black shadow-md">
                      {nino.nombre[0].toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <p className="text-base font-black text-slate-700">{nino.nombre}</p>
                      <p className="text-xs text-slate-400 font-medium">
                        {nino.edad} {nino.edad === 1 ? 'año' : 'años'} • {new Date(nino.fechaNacimiento).toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientePerfilPage;

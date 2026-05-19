import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowLeft, Baby, Loader2, Mail, MapPin, Phone, Save, UserRound, type LucideIcon } from 'lucide-react';
import { clientePortalService, type PerfilCliente } from '../../services/clientePortalService';
import ImageUpload from '../../components/common/ImageUpload';

const dateFormat = new Intl.DateTimeFormat('es-BO', { day: '2-digit', month: 'long', year: 'numeric' });

const ClientePerfilPage = () => {
  const [perfil, setPerfil] = useState<PerfilCliente | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ nombreCompleto: '', telefono: '', direccion: '', fotoPerfilUrl: '' });

  const loadPerfil = async () => {
    setLoading(true);
    try {
      const data = await clientePortalService.getPerfil();
      setPerfil(data);
      setForm({
        nombreCompleto: data.nombreCompleto,
        telefono: data.telefono || '',
        direccion: data.direccion || '',
        fotoPerfilUrl: data.fotoPerfilUrl || ''
      });
    } catch (err) {
      console.error('Error al cargar perfil', err);
      toast.error('No se pudo cargar tu perfil.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPerfil();
  }, []);

  const handleSave = async () => {
    if (!form.nombreCompleto.trim()) {
      toast.error('El nombre completo es obligatorio.');
      return;
    }
    setSaving(true);
    try {
      await clientePortalService.updatePerfil({
        nombreCompleto: form.nombreCompleto.trim(),
        telefono: form.telefono.trim() || undefined,
        direccion: form.direccion.trim() || undefined,
        fotoPerfilUrl: form.fotoPerfilUrl || undefined
      });
      await loadPerfil();
      setEditing(false);
      toast.success('Perfil actualizado.');
    } catch (err: any) {
      toast.error(err.response?.data?.join?.(', ') || 'No se pudo guardar el perfil.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[55vh] flex-col items-center justify-center gap-3 text-slate-500">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        <p className="text-sm font-semibold">Cargando perfil...</p>
      </div>
    );
  }

  if (!perfil) return null;

  const initials = perfil.nombreCompleto
    .split(' ')
    .filter(Boolean)
    .map((word) => word[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="space-y-6">
      <Link to="/cliente/dashboard" className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50">
        <ArrowLeft size={17} />
        Volver
      </Link>

      <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            {perfil.fotoPerfilUrl ? (
              <img src={perfil.fotoPerfilUrl} alt={perfil.nombreCompleto} className="h-16 w-16 rounded-full object-cover" />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-indigo-100 text-xl font-black text-indigo-700">
                {initials || 'C'}
              </div>
            )}
            <div>
              <p className="text-sm font-bold text-indigo-700">Mi perfil</p>
              <h1 className="text-2xl font-black text-slate-950">{perfil.nombreCompleto}</h1>
              <p className="mt-1 text-sm text-slate-500">{perfil.email}</p>
            </div>
          </div>
          <div className="flex gap-2">
            {editing && (
              <button
                onClick={() => {
                  setEditing(false);
                  setForm({
                    nombreCompleto: perfil.nombreCompleto,
                    telefono: perfil.telefono || '',
                    direccion: perfil.direccion || '',
                    fotoPerfilUrl: perfil.fotoPerfilUrl || ''
                  });
                }}
                className="rounded-md border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"
              >
                Cancelar
              </button>
            )}
            <button
              onClick={editing ? handleSave : () => setEditing(true)}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-bold text-white hover:bg-indigo-700 disabled:opacity-60"
            >
              {saving ? <Loader2 size={17} className="animate-spin" /> : editing ? <Save size={17} /> : <UserRound size={17} />}
              {editing ? 'Guardar' : 'Editar perfil'}
            </button>
          </div>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-black text-slate-900">Datos personales</h2>
          {editing && (
            <div className="mt-5 border-b border-slate-100 pb-5">
              <ImageUpload
                value={form.fotoPerfilUrl}
                onChange={(url) => setForm((current) => ({ ...current, fotoPerfilUrl: url }))}
                folder="clientes"
                label="Foto de perfil"
                accept="image/*"
              />
            </div>
          )}
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <Field icon={UserRound} label="Nombre completo" value={form.nombreCompleto} editing={editing} onChange={(value) => setForm({ ...form, nombreCompleto: value })} />
            <ReadOnlyField icon={Mail} label="Correo" value={perfil.email} />
            <Field icon={Phone} label="Teléfono" value={form.telefono} editing={editing} onChange={(value) => setForm({ ...form, telefono: value })} />
            <Field icon={MapPin} label="Dirección" value={form.direccion} editing={editing} onChange={(value) => setForm({ ...form, direccion: value })} />
          </div>
        </section>

        <aside className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-black text-slate-900">Cumpleañeros</h2>
              <p className="mt-1 text-sm text-slate-500">Registrados desde tus reservas.</p>
            </div>
            <Baby className="h-6 w-6 text-indigo-600" />
          </div>
          <div className="mt-5 space-y-3">
            {perfil.ninos.length === 0 ? (
              <p className="rounded-md bg-slate-50 p-4 text-sm text-slate-500">Aún no hay cumpleañeros asociados a tu cuenta.</p>
            ) : (
              perfil.ninos.map((nino) => (
                <div key={nino.id} className="rounded-md border border-slate-200 p-4">
                  <p className="font-black text-slate-900">{nino.nombre}</p>
                  <p className="mt-1 text-sm text-slate-500">
                    {nino.edad} {nino.edad === 1 ? 'año' : 'años'}
                    {nino.fechaNacimiento ? ` · ${dateFormat.format(new Date(nino.fechaNacimiento))}` : ''}
                  </p>
                </div>
              ))
            )}
          </div>
        </aside>
      </div>
    </div>
  );
};

const Field = ({
  icon: Icon,
  label,
  value,
  editing,
  onChange
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  editing: boolean;
  onChange: (value: string) => void;
}) => (
  <label className="block">
    <span className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-500">
      <Icon size={15} />
      {label}
    </span>
    <input
      value={value}
      onChange={(event) => onChange(event.target.value)}
      disabled={!editing}
      className="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-800 outline-none focus:border-indigo-500 disabled:opacity-80"
    />
  </label>
);

const ReadOnlyField = ({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) => (
  <div>
    <span className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-500">
      <Icon size={15} />
      {label}
    </span>
    <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-600">{value || 'Sin registrar'}</div>
  </div>
);

export default ClientePerfilPage;

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { 
  Layout, 
  Image as ImageIcon, 
  Phone, 
  Mail, 
  MapPin, 
  Save, 
  RefreshCw,
  Megaphone,
  Monitor,
  QrCode
} from 'lucide-react';
import { configService, type ConfigEntry } from '../../services/configService';

const CMSPage = () => {
  const [configs, setConfigs] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'general' | 'hero' | 'contacto' | 'pagos'>('general');

  useEffect(() => {
    loadConfigs();
  }, []);

  const loadConfigs = async () => {
    setLoading(true);
    try {
      const data = await configService.getLandingConfig();
      const configMap: Record<string, string> = {};
      data.forEach(item => {
        configMap[item.clave] = item.valor;
      });
      setConfigs(configMap);
    } catch (err) {
      toast.error('Error al cargar configuraciones');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = (clave: string, valor: string) => {
    setConfigs(prev => ({ ...prev, [clave]: valor }));
  };

  const handleFileChange = async (clave: string, file: File) => {
    if (file.size > 2 * 1024 * 1024) {
      toast.error('La imagen no debe superar los 2MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      handleUpdate(clave, reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const saveAll = async () => {
    setSaving(true);
    try {
      const items: ConfigEntry[] = Object.entries(configs).map(([clave, valor]) => ({
        clave,
        valor
      }));
      await configService.bulkUpdate(items);
      toast.success('Cambios guardados correctamente');
    } catch (err) {
      toast.error('Error al guardar cambios');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center gap-4 bg-white">
        <RefreshCw className="animate-spin text-indigo-600" size={48} />
        <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Sincronizando Plataforma...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20 animate-in fade-in duration-700">
      {/* HEADER CMS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 rounded-full translate-x-1/2 -translate-y-1/2 blur-3xl opacity-50" />
        
        <div className="flex items-center gap-6 relative z-10">
          <div className="w-16 h-16 bg-indigo-600 rounded-3xl flex items-center justify-center text-white shadow-xl shadow-indigo-200">
            <Layout size={28} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight leading-none">Marketing Control</h1>
            <p className="text-slate-500 font-medium text-sm mt-2">Personaliza la identidad visual y contenidos de Zapatitos</p>
          </div>
        </div>
        <button 
          onClick={saveAll}
          disabled={saving}
          className="relative z-10 flex items-center gap-3 px-10 py-5 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-2xl shadow-indigo-200 disabled:opacity-50"
        >
          {saving ? <RefreshCw className="animate-spin" size={18} /> : <Save size={18} />}
          {saving ? 'Guardando...' : 'Publicar Cambios'}
        </button>
      </div>

      {/* TABS NAVIGATION CMS */}
      <div className="flex items-center gap-2 p-2 bg-slate-100 rounded-3xl w-fit border border-slate-200">
        {[
          { id: 'general', label: 'General', icon: Megaphone },
          { id: 'hero', label: 'Banner Principal', icon: Monitor },
          { id: 'contacto', label: 'Contacto y Redes', icon: Phone },
          { id: 'pagos', label: 'Pagos QR', icon: QrCode }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-3 px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
              activeTab === tab.id 
                ? 'bg-white text-indigo-600 shadow-xl shadow-slate-200/50' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* EDIT FORM CMS */}
        <div className="lg:col-span-2 space-y-8">
          {activeTab === 'general' && (
            <div className="bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-8">
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest border-b border-slate-100 pb-6 flex items-center gap-3">
                <Megaphone size={18} className="text-indigo-600" /> Avisos y Promociones
              </h3>
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Banner Promocional (Top Bar)</label>
                <textarea 
                  className="w-full bg-slate-50 border border-slate-200 rounded-3xl p-6 text-sm font-medium outline-none focus:border-indigo-500 transition-all h-32 resize-none shadow-inner"
                  value={configs.promo_banner || ''}
                  onChange={(e) => handleUpdate('promo_banner', e.target.value)}
                  placeholder="Ej: ¡Reserva ahora y obtén un 10% de descuento en servicios extras!"
                />
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Email de Contacto</label>
                <div className="relative">
                   <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                   <input 
                    type="email"
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-16 pr-6 py-4 text-sm font-bold outline-none focus:border-indigo-500 transition-all shadow-inner"
                    value={configs.contact_email || ''}
                    onChange={(e) => handleUpdate('contact_email', e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'hero' && (
            <div className="bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-10">
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest border-b border-slate-100 pb-6 flex items-center gap-3">
                <Monitor size={18} className="text-indigo-600" /> Sección Hero (Bienvenida)
              </h3>
              <div className="space-y-8">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Título Impactante</label>
                  <input 
                    className="w-full bg-slate-50 border border-slate-200 rounded-3xl px-6 py-5 text-xl font-black outline-none focus:border-indigo-500 transition-all shadow-inner"
                    value={configs.hero_title || ''}
                    onChange={(e) => handleUpdate('hero_title', e.target.value)}
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Subtítulo Descriptivo</label>
                  <textarea 
                    className="w-full bg-slate-50 border border-slate-200 rounded-3xl p-6 text-sm font-medium outline-none focus:border-indigo-500 transition-all h-32 resize-none shadow-inner"
                    value={configs.hero_subtitle || ''}
                    onChange={(e) => handleUpdate('hero_subtitle', e.target.value)}
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Imagen de Fondo (Full HD)</label>
                  <div className="relative group">
                    <div className="w-full h-64 bg-slate-100 rounded-[2rem] overflow-hidden border-2 border-dashed border-slate-200 flex items-center justify-center transition-all group-hover:border-indigo-300">
                       {configs.hero_image ? (
                         <img src={configs.hero_image} className="w-full h-full object-cover opacity-80" alt="Preview" />
                       ) : (
                         <ImageIcon size={48} className="text-slate-300" />
                       )}
                       <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900/40 backdrop-blur-sm">
                          <label className="bg-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-2xl cursor-pointer hover:scale-105 transition-transform flex items-center gap-3">
                             <RefreshCw size={18} /> Reemplazar Imagen
                             <input type="file" className="hidden" accept="image/*" onChange={(e) => e.target.files?.[0] && handleFileChange('hero_image', e.target.files[0])} />
                          </label>
                       </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'contacto' && (
            <div className="bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-10">
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest border-b border-slate-100 pb-6 flex items-center gap-3">
                <Phone size={18} className="text-indigo-600" /> Información y Redes
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">Teléfono</label>
                  <input 
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:border-indigo-500 transition-all shadow-inner"
                    value={configs.contact_phone || ''}
                    onChange={(e) => handleUpdate('contact_phone', e.target.value)}
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">Ubicación</label>
                  <input 
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:border-indigo-500 transition-all shadow-inner"
                    value={configs.contact_address || ''}
                    onChange={(e) => handleUpdate('contact_address', e.target.value)}
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">Instagram (Username)</label>
                  <input 
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:border-indigo-500 transition-all shadow-inner"
                    value={configs.social_instagram || ''}
                    onChange={(e) => handleUpdate('social_instagram', e.target.value)}
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">Facebook (URL)</label>
                  <input 
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:border-indigo-500 transition-all shadow-inner"
                    value={configs.social_facebook || ''}
                    onChange={(e) => handleUpdate('social_facebook', e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'pagos' && (
            <div className="bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-8">
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest border-b border-slate-100 pb-6 flex items-center gap-3">
                <QrCode size={18} className="text-indigo-600" /> QR de Pago (Base)
              </h3>
              <p className="text-xs text-slate-500 font-medium leading-relaxed">Este código QR es el que verán los clientes al realizar su reserva online para el pago del anticipo.</p>
              
              <div className="flex flex-col items-center gap-8 p-12 bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200">
                {configs.qr_pago_base64 ? (
                  <div className="relative group">
                    <img src={configs.qr_pago_base64} className="w-72 h-72 bg-white p-6 rounded-3xl shadow-2xl object-contain" alt="QR" />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900/50 backdrop-blur-sm rounded-3xl">
                       <label className="bg-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-2xl cursor-pointer hover:scale-105 transition-transform">
                          Cambiar Código QR
                          <input type="file" className="hidden" accept="image/*" onChange={(e) => e.target.files?.[0] && handleFileChange('qr_pago_base64', e.target.files[0])} />
                       </label>
                    </div>
                  </div>
                ) : (
                  <div className="w-72 h-72 flex flex-col items-center justify-center gap-6">
                     <QrCode size={80} className="text-slate-300" />
                     <label className="bg-indigo-600 text-white px-10 py-5 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-2xl cursor-pointer hover:bg-indigo-700 transition-all">
                        Subir Archivo QR
                        <input type="file" className="hidden" accept="image/*" onChange={(e) => e.target.files?.[0] && handleFileChange('qr_pago_base64', e.target.files[0])} />
                     </label>
                  </div>
                )}
                <div className="text-center">
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Formato PNG/JPG • Máx 2MB</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* PREVIEW LIVE CMS */}
        <div className="space-y-8">
          <div className="bg-slate-900 rounded-[3rem] p-10 shadow-[0_50px_100px_rgba(0,0,0,0.3)] sticky top-24 border border-white/5">
             <div className="flex items-center gap-3 mb-10">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">Vista Previa Live</span>
             </div>
             
             <div className="space-y-8">
                {/* Simulated Header */}
                <div className="flex justify-between items-center opacity-30 pb-6 border-b border-white/5">
                   <div className="w-16 h-4 bg-white/20 rounded-full" />
                   <div className="flex gap-4">
                      <div className="w-4 h-4 bg-white/20 rounded-full" />
                      <div className="w-16 h-4 bg-indigo-500/40 rounded-full" />
                   </div>
                </div>

                {/* Simulated Hero */}
                <div className="space-y-6 py-10 relative overflow-hidden rounded-3xl">
                   {configs.hero_image && (
                     <div className="absolute inset-0 opacity-20 blur-sm scale-110">
                        <img src={configs.hero_image} className="w-full h-full object-cover" alt="bg" />
                     </div>
                   )}
                   <div className="relative z-10 space-y-4">
                      <h4 className="text-3xl font-black text-white leading-[1.1] tracking-tight">
                        {configs.hero_title || 'Cargando título...'}
                      </h4>
                      <p className="text-xs text-slate-400 leading-relaxed font-medium">
                        {configs.hero_subtitle || 'Cargando subtítulo descriptivo...'}
                      </p>
                      <div className="w-32 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
                         <div className="w-16 h-2 bg-white/40 rounded-full" />
                      </div>
                   </div>
                </div>

                {/* Promotion bar */}
                {configs.promo_banner && (
                  <div className="bg-indigo-600/10 border border-indigo-500/20 p-5 rounded-2xl">
                     <p className="text-[9px] font-black text-indigo-400 text-center uppercase tracking-[0.2em] leading-relaxed">
                       {configs.promo_banner}
                     </p>
                  </div>
                )}

                {/* Contact Footer */}
                <div className="pt-8 border-t border-white/5 space-y-3">
                   <div className="flex items-center gap-4 text-slate-500">
                      <div className="w-6 h-6 rounded-lg bg-white/5 flex items-center justify-center"><Phone size={12} /></div>
                      <span className="text-[10px] font-bold tracking-wider">{configs.contact_phone || '555-000-000'}</span>
                   </div>
                   <div className="flex items-center gap-4 text-slate-500">
                      <div className="w-6 h-6 rounded-lg bg-white/5 flex items-center justify-center"><MapPin size={12} /></div>
                      <span className="text-[10px] font-bold tracking-wider line-clamp-1">{configs.contact_address || 'Ubicación de Salón'}</span>
                   </div>
                </div>
             </div>
          </div>

          <div className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-200">
             <div className="flex items-center gap-4 mb-4">
                <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                   <Monitor size={20} />
                </div>
                <h4 className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Publicación Inmediata</h4>
             </div>
             <p className="text-[10px] text-slate-500 leading-relaxed font-medium">
                Al guardar, los cambios se reflejarán instantáneamente en la web pública. Asegúrate de que las imágenes tengan buena resolución.
             </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CMSPage;

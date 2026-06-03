import { useState } from 'react';
import { Mail, Phone, MapPin, Send, CheckCircle, MessageCircle, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';
import { isGoogleMapsEmbedUrl, normalizeGoogleMapsEmbedUrl } from '../../../utils/googleMaps';

// TikTok icon (lucide doesn't have one, so we use a simple SVG)
const TikTokIcon = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.28 6.28 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.19 8.19 0 0 0 4.79 1.53V6.78a4.85 4.85 0 0 1-1.02-.09z"/>
  </svg>
);

const cleanPhone = (value?: string) => value?.replace(/\D/g, '') || '';
const socialUsername = (value: string) => value.trim().replace(/^@/, '');
const defaultWhatsAppTemplate = [
  'Hola, quiero consultar sobre: {asunto}',
  'Nombre: {nombre}',
  'Email: {email}',
  'Mensaje: {mensaje}'
].join('\n');

const applyTemplate = (template: string, values: Record<string, string>) =>
  Object.entries(values).reduce((text, [key, value]) => text.replaceAll(`{${key}}`, value || 'No especificado'), template);

interface ContactProps {
  phone?: string;
  email?: string;
  address?: string;
  whatsapp?: string;
  instagram?: string;
  facebook?: string;
  tiktok?: string;
  mapsEmbedUrl?: string;
  whatsappTemplate?: string;
}

const ContactSection = ({ phone, email, address, whatsapp, instagram, facebook, tiktok, mapsEmbedUrl, whatsappTemplate }: ContactProps) => {
  const [status, setStatus] = useState<'idle' | 'sending' | 'success'>('idle');
  const [form, setForm] = useState({
    nombre: '',
    email: '',
    asunto: 'Consulta General',
    mensaje: ''
  });

  const whatsappNumber = cleanPhone(whatsapp || phone);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!whatsappNumber) return;

    const message = applyTemplate(whatsappTemplate || defaultWhatsAppTemplate, {
      nombre: form.nombre,
      telefono: '',
      fecha: '',
      invitados: '',
      paquete: '',
      email: form.email,
      asunto: form.asunto,
      mensaje: form.mensaje
    });

    window.open(`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer');
    setStatus('success');
    setForm({ nombre: '', email: '', asunto: 'Consulta General', mensaje: '' });
  };

  const socialLinks = [
    whatsapp && {
      icon: MessageCircle,
      label: 'WhatsApp',
      href: `https://wa.me/${cleanPhone(whatsapp)}`,
      color: 'hover:text-emerald-400 hover:border-emerald-400/30',
    },
    instagram && {
      icon: ExternalLink,
      label: 'Instagram',
      href: instagram.startsWith('http') ? instagram : `https://instagram.com/${socialUsername(instagram)}`,
      color: 'hover:text-pink-400 hover:border-pink-400/30',
    },
    facebook && {
      icon: ExternalLink,
      label: 'Facebook',
      href: facebook.startsWith('http') ? facebook : `https://facebook.com/${socialUsername(facebook)}`,
      color: 'hover:text-blue-400 hover:border-blue-400/30',
    },
    tiktok && {
      icon: TikTokIcon,
      label: 'TikTok',
      href: tiktok.startsWith('http') ? tiktok : `https://tiktok.com/@${socialUsername(tiktok)}`,
      color: 'hover:text-slate-200 hover:border-slate-400/30',
    },
  ].filter(Boolean) as { icon: any; label: string; href: string; color: string }[];

  return (
    <section id="contacto" className="py-32 bg-bg-main overflow-hidden">
      <div className="container mx-auto px-6 space-y-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="bg-bg-dark rounded-[3.5rem] overflow-hidden shadow-2xl border border-slate-800"
        >
          <div className="grid lg:grid-cols-2">
            {/* INFO PANEL */}
            <div className="p-12 lg:p-20 bg-gradient-to-br from-bg-dark to-slate-900 space-y-12">
              <div className="space-y-6">
                <div className="inline-block px-4 py-2 bg-white/5 rounded-full border border-white/10">
                  <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Contacto</span>
                </div>
                <h2 className="text-4xl lg:text-5xl font-display font-black text-white tracking-tight leading-tight">
                  ¿Hablemos de <br /> tu evento?
                </h2>
                <p className="text-slate-400 font-medium leading-relaxed max-w-sm">
                  Estamos listos para asesorarte y hacer realidad la fiesta de tus sueños.
                </p>
              </div>

              {/* Contact Info Items */}
              <div className="space-y-6">
                {[
                  { icon: Phone, label: 'Llámanos', val: phone || '+1 (555) 123-4567', color: 'text-blue-400', href: phone ? `tel:${phone}` : undefined },
                  { icon: Mail, label: 'Escríbenos', val: email || 'contacto@zapatitos.com', color: 'text-primary', href: email ? `mailto:${email}` : undefined },
                  { icon: MapPin, label: 'Visítanos', val: address || 'Calle de la Diversión 123, Ciudad Mágica', color: 'text-emerald-400', href: undefined },
                ].map((m, i) => (
                  <div key={i} className="flex items-center gap-6 group">
                    <div className={`w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center shrink-0 border border-white/5 group-hover:scale-110 group-hover:bg-white/10 transition-all duration-300 ${m.color}`}>
                      <m.icon size={22} />
                    </div>
                    <div className="space-y-0.5 min-w-0">
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{m.label}</span>
                      {m.href ? (
                        <a href={m.href} className="block text-white font-bold hover:text-primary transition-colors truncate">{m.val}</a>
                      ) : (
                        <p className="text-white font-bold">{m.val}</p>
                      )}
                    </div>
                  </div>
                ))}

                {/* WhatsApp quick link prominent */}
                {whatsapp && (
                  <a
                    href={`https://wa.me/${cleanPhone(whatsapp)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-4 px-6 py-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl hover:bg-emerald-500/20 transition-all group"
                  >
                    <MessageCircle size={22} className="text-emerald-400 shrink-0 group-hover:scale-110 transition-transform" />
                    <div>
                      <p className="text-[10px] font-black text-emerald-400/60 uppercase tracking-widest">WhatsApp Directo</p>
                      <p className="text-emerald-300 font-bold text-sm">{whatsapp}</p>
                    </div>
                    <span className="ml-auto text-[9px] font-black text-emerald-400/50 uppercase tracking-widest">Chatear →</span>
                  </a>
                )}
              </div>

              {/* Social Media Links */}
              {socialLinks.length > 0 && (
                <div className="space-y-4 border-t border-white/5 pt-8">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Síguenos en</p>
                  <div className="flex flex-wrap gap-3">
                    {socialLinks.map((s, i) => (
                      <a
                        key={i}
                        href={s.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`flex items-center gap-2.5 px-5 py-3 bg-white/5 border border-white/10 rounded-2xl text-slate-400 text-xs font-bold transition-all duration-300 ${s.color}`}
                      >
                        <s.icon size={16} />
                        {s.label}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* FORM PANEL */}
            <div className="p-12 lg:p-20 bg-white">
              {status === 'success' ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="h-full flex flex-col items-center justify-center text-center space-y-6"
                >
                  <div className="w-24 h-24 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-500 shadow-inner">
                    <CheckCircle size={60} />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-2xl font-black text-bg-dark uppercase tracking-tight">WhatsApp abierto</h3>
                    <p className="text-slate-500 font-medium">Revisa la ventana de WhatsApp para enviar tu consulta.</p>
                  </div>
                  <button
                    onClick={() => setStatus('idle')}
                    className="px-10 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-bg-dark hover:text-white transition-all"
                  >
                    Preparar otro mensaje
                  </button>
                </motion.div>
              ) : (
                <form className="space-y-6" onSubmit={handleSubmit}>
                  <div className="grid sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nombre</label>
                      <input
                        type="text"
                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-sm font-bold focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                        placeholder="Tu nombre completo"
                        required
                        value={form.nombre}
                        onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email</label>
                      <input
                        type="email"
                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-sm font-bold focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                        placeholder="tu@email.com"
                        required
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Asunto</label>
                    <select
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-sm font-bold focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all appearance-none cursor-pointer"
                      value={form.asunto}
                      onChange={(e) => setForm({ ...form, asunto: e.target.value })}
                    >
                      <option>Consulta General</option>
                      <option>Presupuesto para Evento</option>
                      <option>Visita Guiada al Salón</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Mensaje</label>
                    <textarea
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-sm font-bold focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all resize-none"
                      rows={4}
                      placeholder="¿Cómo podemos ayudarte a que tu evento sea único?"
                      required
                      value={form.mensaje}
                      onChange={(e) => setForm({ ...form, mensaje: e.target.value })}
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full btn-primary-glow flex items-center justify-center gap-3 py-5 disabled:opacity-50 disabled:cursor-not-allowed group"
                    disabled={!whatsappNumber}
                  >
                    <span className="font-black uppercase tracking-widest text-sm">Enviar por WhatsApp</span>
                    <Send size={18} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                  </button>
                  {!whatsappNumber && (
                    <p className="text-xs font-bold text-red-500">Configura un WhatsApp o teléfono para activar el envío directo.</p>
                  )}
                </form>
              )}
            </div>
          </div>
        </motion.div>

        {/* GOOGLE MAPS EMBED — only renders if URL is a valid embed URL */}
        {mapsEmbedUrl && (() => {
          const embedUrl = normalizeGoogleMapsEmbedUrl(mapsEmbedUrl);
          const isEmbedUrl = isGoogleMapsEmbedUrl(embedUrl);
          if (!isEmbedUrl) return null;
          return (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="rounded-[3rem] overflow-hidden shadow-2xl border border-purple-100/30 bg-white"
            >
              <div className="p-6 lg:p-8 flex items-center gap-4 border-b border-slate-100">
                <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-500 shrink-0">
                  <MapPin size={22} />
                </div>
                <div>
                  <h3 className="font-display font-black text-bg-dark text-lg">¿Cómo llegar?</h3>
                  <p className="text-slate-400 text-xs font-medium">{address || 'Visítanos en nuestro salón'}</p>
                </div>
              </div>
              <div className="w-full h-80 lg:h-96">
                <iframe
                  src={embedUrl}
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Ubicación del Salón Zapatitos"
                />
              </div>
            </motion.div>
          );
        })()}
      </div>
    </section>
  );
};

export default ContactSection;

import React, { useEffect, useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Clock, ExternalLink, Mail, MapPin, MessageCircle, Phone, Send, Share2 } from 'lucide-react';
import type { PublicLayoutContext } from '../../components/layout/PublicLayout';
import { isGoogleMapsEmbedUrl, normalizeGoogleMapsEmbedUrl } from '../../utils/googleMaps';
import { paquetesService, type Paquete } from '../../services/paquetesService';

const cleanPhone = (value?: string) => value?.replace(/\D/g, '') || '';
const defaultWhatsAppTemplate = [
  'Hola, quiero consultar sobre un evento infantil.',
  'Nombre: {nombre}',
  'Teléfono: {telefono}',
  'Fecha tentativa: {fecha}',
  'Invitados: {invitados}',
  'Paquete de interés: {paquete}',
  'Mensaje: {mensaje}'
].join('\n');

const socialUrl = (type: 'instagram' | 'facebook' | 'tiktok', value?: string) => {
  if (!value) return '';
  const trimmed = value.trim();
  if (trimmed.startsWith('http')) return trimmed;
  const username = trimmed.replace(/^@/, '');

  if (type === 'instagram') return `https://instagram.com/${username}`;
  if (type === 'facebook') return `https://facebook.com/${username}`;
  return `https://tiktok.com/@${username}`;
};

const applyTemplate = (template: string, values: Record<string, string>) =>
  Object.entries(values).reduce((text, [key, value]) => text.replaceAll(`{${key}}`, value || 'No especificado'), template);

const ContactoPage = () => {
  const { configs } = useOutletContext<PublicLayoutContext>();
  const [paquetes, setPaquetes] = useState<Paquete[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    eventDate: '',
    guests: '',
    packageType: '',
    message: ''
  });

  const whatsappNumber = cleanPhone(configs.contact_whatsapp || configs.contact_phone);
  const mapsEmbedUrl = normalizeGoogleMapsEmbedUrl(configs.maps_embed_url);
  const canEmbedMap = isGoogleMapsEmbedUrl(mapsEmbedUrl);
  const mapsSearchUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(configs.contact_address || 'Zapatitos Eventos Infantiles')}`;
  const packageOptions = paquetes.length > 0
    ? paquetes.map((paquete) => paquete.nombre)
    : ['Paquete Básico', 'Paquete Premium', 'Paquete Full', 'Solo cotización'];

  useEffect(() => {
    paquetesService.getPaquetes()
      .then(setPaquetes)
      .catch(() => setPaquetes([]));
  }, []);

  const socialLinks = useMemo(() => [
    configs.social_instagram && {
      label: 'Instagram',
      href: socialUrl('instagram', configs.social_instagram),
      color: 'hover:border-pink-200 hover:bg-pink-50 hover:text-pink-600'
    },
    configs.social_facebook && {
      label: 'Facebook',
      href: socialUrl('facebook', configs.social_facebook),
      color: 'hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600'
    },
    configs.social_tiktok && {
      label: 'TikTok',
      href: socialUrl('tiktok', configs.social_tiktok),
      color: 'hover:border-slate-300 hover:bg-slate-50 hover:text-slate-800'
    }
  ].filter(Boolean) as { label: string; href: string; color: string }[], [configs.social_facebook, configs.social_instagram, configs.social_tiktok]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!whatsappNumber) return;

    const message = applyTemplate(configs.whatsapp_message_template || defaultWhatsAppTemplate, {
      nombre: formData.name,
      telefono: formData.phone,
      fecha: formData.eventDate,
      invitados: formData.guests,
      paquete: formData.packageType,
      email: '',
      asunto: 'Consulta desde página de contacto',
      mensaje: formData.message
    });

    window.open(`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="min-h-screen bg-bg-main pt-24 pb-20 selection:bg-primary selection:text-white">
      <section className="relative py-16 text-center overflow-hidden bg-white border-b border-purple-50">
        <div className="max-w-3xl mx-auto px-6 space-y-6 relative z-10">
          <div className="inline-flex px-5 py-2.5 bg-primary/10 rounded-full border border-primary/20 shadow-sm">
            <span className="text-xs font-black text-primary uppercase tracking-[0.25em] flex items-center justify-center gap-1.5">
              <MessageCircle size={12} /> Contacto directo
            </span>
          </div>
          <h1 className="text-4xl md:text-6xl font-display font-black text-bg-dark tracking-tight leading-none">
            Hablemos de tu <span className="text-primary">próxima fiesta</span>
          </h1>
          <p className="text-slate-500 font-medium text-lg max-w-xl mx-auto">
            Escríbenos por WhatsApp, revisa nuestras redes o encuentra la ubicación del salón.
          </p>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 lg:px-10 py-12 grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-[2rem] border border-purple-50 p-8 shadow-sm space-y-7">
            <h2 className="text-2xl font-black text-bg-dark tracking-tight">Información de Contacto</h2>

            <div className="space-y-5">
              <a href={`tel:${configs.contact_phone || ''}`} className="flex items-start gap-4 group">
                <div className="w-12 h-12 bg-purple-50 text-primary rounded-xl flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:text-white transition-all">
                  <Phone size={20} />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Teléfono</p>
                  <p className="text-sm font-black text-bg-dark mt-1.5 break-words">{configs.contact_phone || '+591 70000000'}</p>
                </div>
              </a>

              {configs.contact_whatsapp && (
                <a href={`https://wa.me/${cleanPhone(configs.contact_whatsapp)}`} target="_blank" rel="noreferrer" className="flex items-start gap-4 group">
                  <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-emerald-500 group-hover:text-white transition-all">
                    <MessageCircle size={20} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">WhatsApp</p>
                    <p className="text-sm font-black text-bg-dark mt-1.5 break-words">{configs.contact_whatsapp}</p>
                  </div>
                </a>
              )}

              <a href={`mailto:${configs.contact_email || ''}`} className="flex items-start gap-4 group">
                <div className="w-12 h-12 bg-pink-50 text-pink-500 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-pink-500 group-hover:text-white transition-all">
                  <Mail size={20} />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Email</p>
                  <p className="text-sm font-black text-bg-dark mt-1.5 break-words">{configs.contact_email || 'contacto@zapatitos.com'}</p>
                </div>
              </a>

              <a href={mapsSearchUrl} target="_blank" rel="noreferrer" className="flex items-start gap-4 group">
                <div className="w-12 h-12 bg-amber-50 text-amber-500 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-amber-500 group-hover:text-white transition-all">
                  <MapPin size={20} />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Ubicación</p>
                  <p className="text-sm font-black text-bg-dark mt-1.5 leading-relaxed">{configs.contact_address || 'Calle de la Diversión 123, Ciudad Mágica'}</p>
                </div>
              </a>
            </div>
          </div>

          {(socialLinks.length > 0 || configs.contact_whatsapp) && (
            <div className="bg-white rounded-[2rem] border border-purple-50 p-8 shadow-sm space-y-5">
              <h3 className="text-lg font-black text-bg-dark flex items-center gap-2">
                <Share2 size={20} className="text-primary" /> Redes y canales
              </h3>
              <div className="flex flex-wrap gap-3">
                {configs.contact_whatsapp && (
                  <a href={`https://wa.me/${cleanPhone(configs.contact_whatsapp)}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl border border-emerald-100 bg-emerald-50 text-emerald-700 text-xs font-black uppercase tracking-widest hover:bg-emerald-500 hover:text-white transition-all">
                    <MessageCircle size={15} /> WhatsApp
                  </a>
                )}
                {socialLinks.map((link) => (
                  <a key={link.label} href={link.href} target="_blank" rel="noreferrer" className={`inline-flex items-center gap-2 px-5 py-3 rounded-2xl border border-slate-100 bg-white text-slate-500 text-xs font-black uppercase tracking-widest transition-all ${link.color}`}>
                    <ExternalLink size={15} /> {link.label}
                  </a>
                ))}
              </div>
            </div>
          )}

          <div className="bg-white rounded-[2rem] border border-purple-50 p-8 shadow-sm space-y-5">
            <h3 className="text-lg font-black text-bg-dark flex items-center gap-2">
              <Clock size={20} className="text-primary" /> Horarios de Atención
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center text-xs font-bold border-b border-purple-50/50 pb-3">
                <span className="text-slate-500">Lunes a Viernes</span>
                <span className="text-bg-dark font-black">{configs.business_hours_weekdays || '09:00 - 18:00'}</span>
              </div>
              <div className="flex justify-between items-center text-xs font-bold">
                <span className="text-slate-500">Sábados y Domingos</span>
                <span className="text-primary font-black">{configs.business_hours_weekend || '10:00 - 22:00'}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-7 bg-white rounded-[2rem] border border-purple-50 p-8 lg:p-10 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <h2 className="text-2xl font-black text-bg-dark tracking-tight">Consulta por WhatsApp</h2>
              <p className="text-slate-400 text-sm font-medium">Completa los datos y abriremos WhatsApp con tu mensaje listo para enviar.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nombre Completo</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Juan Pérez"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm font-medium outline-none focus:bg-white focus:border-primary transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Teléfono</label>
                <input
                  type="tel"
                  required
                  placeholder="Ej. +591 70000000"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm font-medium outline-none focus:bg-white focus:border-primary transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Fecha tentativa</label>
                <input
                  type="date"
                  value={formData.eventDate}
                  onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm font-medium outline-none focus:bg-white focus:border-primary transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Invitados</label>
                <input
                  type="number"
                  min="1"
                  placeholder="Ej. 40"
                  value={formData.guests}
                  onChange={(e) => setFormData({ ...formData, guests: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm font-medium outline-none focus:bg-white focus:border-primary transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Paquete</label>
                <select
                  value={formData.packageType}
                  onChange={(e) => setFormData({ ...formData, packageType: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm font-medium outline-none focus:bg-white focus:border-primary transition-all"
                >
                  <option value="">Por definir</option>
                  {packageOptions.map((option) => (
                    <option key={option}>{option}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Mensaje o Pedido Especial</label>
              <textarea
                rows={5}
                required
                placeholder="Cuéntanos edad del cumpleañero, cantidad de invitados, temática o dudas..."
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-5 text-sm font-medium outline-none focus:bg-white focus:border-primary transition-all resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={!whatsappNumber}
              className="w-full py-5 bg-emerald-500 text-white font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg flex items-center justify-center gap-2"
            >
              <Send size={14} /> Enviar por WhatsApp
            </button>
            {!whatsappNumber && (
              <p className="text-xs font-bold text-red-500">Configura un WhatsApp o teléfono en Admin - Plataforma - Contacto y Redes.</p>
            )}
          </form>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 lg:px-10 mt-2">
        <div className="bg-white rounded-[2rem] border border-purple-50 p-6 shadow-sm overflow-hidden space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-black text-bg-dark tracking-tight">Nuestra Ubicación</h3>
              <p className="text-sm text-slate-500 font-medium mt-1">{configs.contact_address || 'Visítanos en nuestro salón'}</p>
            </div>
            <a href={mapsSearchUrl} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-amber-50 border border-amber-100 rounded-2xl text-[10px] font-black text-amber-700 uppercase tracking-widest hover:bg-amber-500 hover:text-white transition-all">
              <MapPin size={15} /> Abrir en Google Maps
            </a>
          </div>

          {canEmbedMap ? (
            <div className="aspect-[21/9] min-h-80 w-full rounded-2xl border border-purple-50 overflow-hidden bg-slate-50">
              <iframe
                src={mapsEmbedUrl}
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Ubicación del Salón Zapatitos"
              />
            </div>
          ) : (
            <div className="min-h-80 w-full rounded-2xl border border-dashed border-amber-200 bg-amber-50/50 flex items-center justify-center p-8 text-center">
              <div className="max-w-md space-y-3">
                <MapPin size={36} className="mx-auto text-amber-500" />
                <p className="text-sm font-black text-bg-dark">El mapa embebido no está configurado correctamente.</p>
                <p className="text-xs font-bold text-slate-500">En el admin pega el enlace de "Insertar un mapa", no el link normal de compartir.</p>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default ContactoPage;

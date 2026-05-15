import { useState } from 'react';
import { Mail, Phone, MapPin, Send, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { contactoService } from '../../../services/contactoService';
import { toast } from 'sonner';

interface ContactProps {
  phone?: string;
  email?: string;
  address?: string;
}

const ContactSection = ({ phone, email, address }: ContactProps) => {
  const [status, setStatus] = useState<'idle' | 'sending' | 'success'>('idle');
  const [form, setForm] = useState({
    nombre: '',
    email: '',
    asunto: 'Consulta General',
    mensaje: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('sending');
    try {
      await contactoService.createMensaje(form);
      setStatus('success');
      toast.success('Mensaje enviado correctamente');
    } catch (err) {
      console.error('Error al enviar mensaje', err);
      toast.error('No se pudo enviar el mensaje. Reintenta más tarde.');
      setStatus('idle');
    }
  };

  return (
    <section id="contacto" className="py-32 bg-white overflow-hidden">
      <div className="container mx-auto px-6">
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
              
              <div className="space-y-8">
                {[
                  { icon: Phone, label: 'Llámanos', val: phone || '+1 (555) 123-4567', color: 'text-blue-400' },
                  { icon: Mail, label: 'Escríbenos', val: email || 'contacto@zapatitos.com', color: 'text-primary' },
                  { icon: MapPin, label: 'Visítanos', val: address || 'Calle de la Diversión 123, Ciudad Mágica', color: 'text-emerald-400' }
                ].map((m, i) => (
                  <div key={i} className="flex items-center gap-6 group">
                    <div className={`w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center shrink-0 border border-white/5 group-hover:scale-110 group-hover:bg-white/10 transition-all duration-300 ${m.color}`}>
                      <m.icon size={24} />
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{m.label}</span>
                      <p className="text-white font-bold">{m.val}</p>
                    </div>
                  </div>
                ))}
              </div>
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
                    <h3 className="text-2xl font-black text-bg-dark uppercase tracking-tight">¡Mensaje Enviado!</h3>
                    <p className="text-slate-500 font-medium">Nos pondremos en contacto contigo en las próximas 24 horas.</p>
                  </div>
                  <button 
                    onClick={() => setStatus('idle')} 
                    className="px-10 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-bg-dark hover:text-white transition-all"
                  >
                    Enviar otro mensaje
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
                    className="w-full btn-primary-glow flex items-center justify-center gap-3 py-5 disabled:opacity-50 group" 
                    disabled={status === 'sending'}
                  >
                    {status === 'sending' ? (
                      <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <span className="font-black uppercase tracking-widest text-sm">Enviar Mensaje</span>
                        <Send size={18} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default ContactSection;

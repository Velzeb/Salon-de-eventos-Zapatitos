import { motion } from 'framer-motion';
import AvailabilityCalendar from '../components/AvailabilityCalendar';
import { Calendar as CalendarIcon } from 'lucide-react';

interface AvailabilitySectionProps {
  title?: string;
  subtitle?: string;
  satisfaction?: string;
  eventsCount?: string;
}

const AvailabilitySection = ({ title, subtitle, satisfaction, eventsCount }: AvailabilitySectionProps) => {
  return (
    <section id="disponibilidad" className="py-24 bg-gradient-to-b from-bg-main to-purple-50/20 relative overflow-hidden">
      {/* Decorative background vectors */}
      <div className="absolute top-1/4 -left-20 w-72 h-72 bg-purple-200/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-pink-200/10 rounded-full blur-3xl pointer-events-none" />

      <div className="container mx-auto px-6 max-w-7xl relative z-10">
        <motion.div 
          className="text-center max-w-3xl mx-auto space-y-4 mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full border border-primary/20">
            <CalendarIcon size={14} className="text-primary" />
            <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Disponibilidad Inmediata</span>
          </div>
          <h2 className="text-4xl lg:text-5xl font-display font-black text-bg-dark tracking-tight leading-tight">
            {title || '¿Cuándo es tu Próximo Evento?'}
          </h2>
          <p className="text-slate-500 font-medium text-lg leading-relaxed max-w-2xl mx-auto">
            {subtitle || 'Consulta nuestra disponibilidad en tiempo real. Selecciona una fecha y descubre los turnos disponibles para tu celebración.'}
          </p>
        </motion.div>

        {/* Full-width Calendar Container */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="w-full"
        >
          <AvailabilityCalendar />
        </motion.div>

        {/* Statistics Row */}
        <motion.div 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="grid grid-cols-2 max-w-md mx-auto gap-8 pt-12 mt-16 border-t border-purple-100 text-center"
        >
          <div className="space-y-1">
            <span className="text-4xl font-black text-bg-dark tracking-tighter">{satisfaction || '98%'}</span>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Satisfacción</p>
          </div>
          <div className="space-y-1">
            <span className="text-4xl font-black text-bg-dark tracking-tighter">{eventsCount || '+2k'}</span>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Eventos Exitosos</p>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default AvailabilitySection;

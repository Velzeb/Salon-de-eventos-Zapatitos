import { motion } from 'framer-motion';
import { CalendarCheck, Music, Gift, Cake, ShieldCheck, Heart, type LucideIcon } from 'lucide-react';

interface Feature {
  icon: LucideIcon;
  title: string;
  desc: string;
  color: string;
}

interface ServicesSectionProps {
  features?: Feature[];
}

const defaultFeatures = [
  { icon: CalendarCheck, title: 'Reserva Online', desc: 'Gestiona tu evento desde la comodidad de tu casa.', color: '#662d91' },
  { icon: Cake, title: 'Catering Premium', desc: 'Menús deliciosos diseñados para niños y adultos.', color: '#23abe2' },
  { icon: Music, title: 'Entretenimiento', desc: 'Animadores, música y shows temáticos inolvidables.', color: '#39b54a' },
  { icon: Gift, title: 'Decoración Pack', desc: 'Temáticas personalizadas con globos y mobiliario.', color: '#f59e0b' },
  { icon: ShieldCheck, title: 'Seguridad Total', desc: 'Área vigilada y personal de asistencia permanente.', color: '#ef4444' },
  { icon: Heart, title: 'Atención Única', desc: 'Un equipo dedicado a hacer realidad tus sueños.', color: '#e83e8c' }
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15
    }
  }
};

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
};

const ServicesSection = ({ features }: ServicesSectionProps) => {
  const displayFeatures = (features && features.length > 0) ? features : defaultFeatures;

  return (
    <section id="servicios" className="py-32 bg-white relative overflow-hidden">
      {/* DECORATION */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      
      <div className="container mx-auto px-6 relative z-10">
        <motion.div 
          className="max-w-2xl mx-auto text-center space-y-4 mb-20"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <div className="inline-block px-4 py-2 bg-primary/10 rounded-full border border-primary/20">
            <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">¿Por qué Zapatitos?</span>
          </div>
          <h2 className="text-4xl lg:text-5xl font-display font-black text-bg-dark tracking-tight">Servicios de Clase Mundial</h2>
          <p className="text-slate-500 font-medium">Nos encargamos de cada detalle para que tú solo disfrutes el momento.</p>
        </motion.div>

        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
        >
          {displayFeatures.map((f, i) => (
            <motion.div
              key={i}
              className="group p-10 bg-white border border-slate-100 rounded-[2.5rem] shadow-sm hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500 hover:-translate-y-2"
              variants={cardVariants}
            >
              <div 
                className="w-16 h-16 rounded-2xl flex items-center justify-center mb-8 transition-transform duration-500 group-hover:scale-110"
                style={{ backgroundColor: `${f.color}15`, color: f.color }}
              >
                <f.icon size={32} />
              </div>
              <h3 className="text-xl font-black text-bg-dark mb-4 group-hover:text-primary transition-colors">{f.title}</h3>
              <p className="text-slate-500 text-sm font-medium leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default ServicesSection;

import { Users, History, Trophy, HelpCircle } from 'lucide-react';
import { motion } from 'framer-motion';

interface AboutUsSectionProps {
  aboutUsImage?: string;
  title?: string;
  description?: string;
  yearsExperience?: string;
  valuesJson?: string;
}

const defaultValues = [
  { icon: 'Users', title: 'Equipo Profesional', desc: 'Animadores y coordinadores expertos en manejo de grupos.', color: 'text-blue-500', bg: 'bg-blue-50/75' },
  { icon: 'History', title: 'Compromiso Total', desc: 'Acompañamiento desde la reserva hasta el fin del evento.', color: 'text-amber-500', bg: 'bg-amber-50/75' },
  { icon: 'Trophy', title: 'Calidad Garantizada', desc: 'Instalaciones seguras y certificadas para los más pequeños.', color: 'text-emerald-500', bg: 'bg-emerald-50/75' }
];

const resolveIcon = (iconName: string) => {
  switch (iconName) {
    case 'Users': return Users;
    case 'History': return History;
    case 'Trophy': return Trophy;
    default: return HelpCircle;
  }
};

const AboutUsSection = ({ aboutUsImage, title, description, yearsExperience, valuesJson }: AboutUsSectionProps) => {
  const defaultImage = "https://images.unsplash.com/photo-1519222970733-f546218fa6d7?auto=format&fit=crop&q=80&w=1470";
  const displayImage = aboutUsImage || defaultImage;
  const displayTitle = title || "Pasión por crear recuerdos que duran toda la vida";
  const displayDesc = description || "En Zapatitos, no solo alquilamos un espacio; diseñamos experiencias. Lo que comenzó como un pequeño sueño familiar se ha convertido en el referente de celebraciones infantiles premium en la ciudad.";
  const displayYears = yearsExperience || "10+";

  const displayValues = (() => {
    if (valuesJson) {
      try {
        const parsed = JSON.parse(valuesJson);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((item: any) => ({
            icon: item.icon,
            title: item.title,
            desc: item.desc,
            color: 'text-indigo-600',
            bg: 'bg-indigo-50/75'
          }));
        }
      } catch (e) {
        console.error(e);
      }
    }
    return defaultValues;
  })();

  return (
    <section id="sobre-nosotros" className="py-32 bg-bg-main overflow-hidden relative">
      {/* Background blobs */}
      <div className="absolute top-1/4 -right-24 w-80 h-80 bg-pink-100/30 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-64 h-64 bg-purple-100/30 rounded-full blur-3xl pointer-events-none" />

      <div className="container mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-20 items-center">
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative px-4"
          >
            {/* Playful Sticker Frame on image */}
            <div className="sticker-frame relative z-20 rounded-[3.5rem] overflow-hidden aspect-square border-[12px] border-white bg-slate-100 shadow-xl">
              <img 
                src={displayImage} 
                alt="Nuestro Equipo" 
                className="w-full h-full object-cover"
              />
            </div>
            
            <motion.div 
              initial={{ scale: 0, rotate: -20 }}
              whileInView={{ scale: 1, rotate: 12 }}
              viewport={{ once: true }}
              transition={{ delay: 0.5, type: 'spring' }}
              className="absolute -bottom-6 -right-6 bg-gradient-to-r from-primary to-pink-500 p-7 rounded-[2.5rem] shadow-2xl shadow-primary/20 text-white text-center min-w-[170px] z-30"
              style={{ transform: 'rotate(12deg)' }}
            >
              <p className="text-5xl font-display font-bold tracking-tighter">{displayYears}</p>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-90">Años de Magia</p>
            </motion.div>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="space-y-8"
          >
            <div className="inline-block px-4 py-2 bg-primary/10 rounded-full border border-primary/20">
              <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Sobre Nosotros</span>
            </div>
            <h2 className="text-4xl lg:text-5xl font-display font-bold text-[var(--text-main)] tracking-tight leading-tight text-playful-shadow">
              {displayTitle}
            </h2>
            <p className="text-lg text-slate-500 font-medium leading-relaxed font-main">
              {displayDesc}
            </p>
            
            <div className="space-y-6 pt-4">
              {displayValues.map((item: any, i: number) => {
                const IconComponent = resolveIcon(item.icon);
                return (
                  <motion.div 
                    key={i} 
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3 + (i * 0.1) }}
                    className="flex gap-6 p-5 rounded-[2rem] border border-purple-50 bg-white/60 hover:bg-white hover:border-primary-light/40 transition-all group shadow-sm hover:shadow-md"
                  >
                    <div className={`w-14 h-14 rounded-2xl ${item.bg} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform ${item.color} border border-purple-50`}>
                      <IconComponent size={26} />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-lg font-display font-bold text-[var(--text-main)] tracking-tight">{item.title}</h4>
                      <p className="text-sm text-slate-500 font-medium leading-relaxed">{item.desc}</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default AboutUsSection;

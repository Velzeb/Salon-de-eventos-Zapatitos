import { Users, History, Trophy } from 'lucide-react';
import { motion } from 'framer-motion';

const AboutUsSection = () => {
  return (
    <section id="sobre-nosotros" className="py-32 bg-white overflow-hidden">
      <div className="container mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-20 items-center">
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative"
          >
            <div className="rounded-[3.5rem] overflow-hidden shadow-2xl border-[12px] border-slate-50 aspect-square">
              <img 
                src="https://images.unsplash.com/photo-1519222970733-f546218fa6d7?auto=format&fit=crop&q=80&w=1470" 
                alt="Nuestro Equipo" 
                className="w-full h-full object-cover"
              />
            </div>
            
            <motion.div 
              initial={{ scale: 0, rotate: -20 }}
              whileInView={{ scale: 1, rotate: 12 }}
              viewport={{ once: true }}
              transition={{ delay: 0.5, type: 'spring' }}
              className="absolute -bottom-10 -right-10 bg-primary p-8 rounded-[2.5rem] shadow-2xl shadow-primary/40 text-white text-center min-w-[180px]"
            >
              <p className="text-5xl font-black tracking-tighter">10+</p>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80">Años de Magia</p>
            </motion.div>

            {/* DECO */}
            <div className="absolute -z-10 -top-10 -left-10 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
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
            <h2 className="text-4xl lg:text-5xl font-display font-black text-bg-dark tracking-tight leading-tight">
              Pasión por crear recuerdos que duran toda la vida
            </h2>
            <p className="text-lg text-slate-500 font-medium leading-relaxed">
              En Zapatitos, no solo alquilamos un espacio; diseñamos experiencias. 
              Lo que comenzó como un pequeño sueño familiar se ha convertido en el 
              referente de celebraciones infantiles premium en la ciudad.
            </p>
            
            <div className="space-y-6 pt-6">
              {[
                { icon: Users, title: 'Equipo Profesional', desc: 'Animadores y coordinadores expertos en manejo de grupos.', color: 'text-blue-500' },
                { icon: History, title: 'Compromiso Total', desc: 'Acompañamiento desde la reserva hasta el fin del evento.', color: 'text-amber-500' },
                { icon: Trophy, title: 'Calidad Garantizada', desc: 'Instalaciones seguras y certificadas para los más pequeños.', color: 'text-emerald-500' }
              ].map((item, i) => (
                <motion.div 
                  key={i} 
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3 + (i * 0.1) }}
                  className="flex gap-6 p-6 rounded-3xl border border-slate-50 hover:border-slate-100 hover:bg-slate-50/50 transition-all group"
                >
                  <div className={`w-14 h-14 rounded-2xl bg-white shadow-sm flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform ${item.color}`}>
                    <item.icon size={28} />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-lg font-black text-bg-dark uppercase tracking-tight">{item.title}</h4>
                    <p className="text-sm text-slate-500 font-medium leading-relaxed">{item.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default AboutUsSection;

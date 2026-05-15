import { motion } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';

const SalonGallery = () => {
  return (
    <section id="salon" className="py-32 bg-slate-50 overflow-hidden">
      <div className="container mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-20 items-center">
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="space-y-8"
          >
            <div className="inline-block px-4 py-2 bg-primary/10 rounded-full border border-primary/20">
              <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Nuestras Instalaciones</span>
            </div>
            <h2 className="text-4xl lg:text-5xl font-display font-black text-bg-dark tracking-tight leading-tight">
              Un Espacio Diseñado <br /> para Soñar
            </h2>
            <p className="text-lg text-slate-500 font-medium leading-relaxed">
              Contamos con áreas climatizadas, zonas de juego de última generación 
              y un área lounge para adultos que redefine lo que un salón infantil puede ser.
            </p>
            
            <ul className="grid sm:grid-cols-2 gap-4">
              {[
                'Área de Juegos Interactivos',
                'Salón Climatizado de Alta Capacidad',
                'Sonido e Iluminación Profesional',
                'Personal de Seguridad y Monitoreo'
              ].map((text, i) => (
                <motion.li 
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3 + (i * 0.1) }}
                  className="flex items-center gap-3 p-4 bg-white rounded-2xl border border-slate-100 shadow-sm group hover:border-primary/30 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0 group-hover:bg-emerald-500 group-hover:text-white transition-all">
                    <CheckCircle2 size={16} />
                  </div>
                  <span className="text-sm font-bold text-slate-700">{text}</span>
                </motion.li>
              ))}
            </ul>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative"
          >
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-4">
                <div className="rounded-[2.5rem] overflow-hidden shadow-2xl h-64 border-4 border-white">
                  <img 
                    src="https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?auto=format&fit=crop&q=80&w=1470" 
                    alt="Main Salon" 
                    className="w-full h-full object-cover hover:scale-110 transition-transform duration-700" 
                  />
                </div>
                <div className="rounded-[2.5rem] overflow-hidden shadow-2xl h-80 border-4 border-white">
                  <img 
                    src="https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&q=80&w=1469" 
                    alt="Kids Area" 
                    className="w-full h-full object-cover hover:scale-110 transition-transform duration-700" 
                  />
                </div>
              </div>
              <div className="pt-12">
                <div className="rounded-[2.5rem] overflow-hidden shadow-2xl h-[450px] border-4 border-white">
                  <img 
                    src="https://images.unsplash.com/photo-1472653431158-6364773b2a56?auto=format&fit=crop&q=80&w=1469" 
                    alt="Decoration" 
                    className="w-full h-full object-cover hover:scale-110 transition-transform duration-700" 
                  />
                </div>
              </div>
            </div>
            
            {/* FLOATING DECO */}
            <div className="absolute -z-10 -bottom-10 -right-10 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default SalonGallery;

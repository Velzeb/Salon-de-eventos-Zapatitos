import { useState } from 'react';
import { motion } from 'framer-motion';

interface HeroSectionProps {
  title: string;
  subtitle: string;
  image?: string;
}

const HeroSection = ({ title, subtitle, image }: HeroSectionProps) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const defaultImage = "https://images.unsplash.com/photo-1530103043960-ef38714abb15?auto=format&fit=crop&q=80&w=2069";
  const bgImage = (image && image.trim().length > 0) ? image : defaultImage;

  return (
    <section className="relative min-h-screen flex items-center pt-24 pb-20 overflow-hidden bg-white">
      {/* BACKGROUND DECORATION */}
      <div className="absolute top-0 right-0 w-1/2 h-screen bg-slate-50/50 -skew-x-12 translate-x-1/4 pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
      
      <div className="container mx-auto px-6 relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="space-y-8 text-center lg:text-left"
          >
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full border border-primary/20"
            >
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Bienvenidos a Zapatitos</span>
            </motion.div>

            <h1 className="text-5xl lg:text-7xl font-display font-black text-bg-dark tracking-tighter leading-[1.05]">
              {title.split('—').map((part, i) => (
                <span key={i} className={i === 1 ? "text-primary block lg:inline" : ""}>
                  {i === 1 ? ` — ${part}` : part}
                </span>
              ))}
            </h1>

            <p className="text-xl text-slate-500 font-medium leading-relaxed max-w-xl mx-auto lg:mx-0">
              {subtitle}
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-4 pt-4 justify-center lg:justify-start">
              <a 
                href="#disponibilidad" 
                className="w-full sm:w-auto px-10 py-5 bg-bg-dark text-white rounded-[2rem] font-black uppercase tracking-widest text-sm shadow-2xl shadow-slate-900/20 hover:bg-primary hover:scale-105 active:scale-95 transition-all flex items-center justify-center"
              >
                Explorar Espacios
              </a>
              <a 
                href="#paquetes" 
                className="w-full sm:w-auto px-10 py-5 bg-white border border-slate-200 text-slate-600 rounded-[2rem] font-black uppercase tracking-widest text-sm hover:bg-slate-50 transition-all flex items-center justify-center"
              >
                Ver Paquetes
              </a>
            </div>

            <div className="flex items-center gap-6 pt-10 justify-center lg:justify-start">
              <div className="flex -space-x-3">
                {[1,2,3,4].map(i => (
                  <div key={i} className="w-10 h-10 rounded-full border-2 border-white bg-slate-100 overflow-hidden shadow-sm">
                    <img src={`https://i.pravatar.cc/150?u=${i}`} alt="User" />
                  </div>
                ))}
              </div>
              <div className="text-left">
                <div className="flex text-amber-400 gap-0.5">
                  {[1,2,3,4,5].map(i => <span key={i}>★</span>)}
                </div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">+500 Clientes Felices</p>
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="relative"
          >
            <div className="relative z-20 rounded-[3rem] overflow-hidden shadow-premium aspect-[4/5] border-[12px] border-white bg-slate-100">
              <img 
                src={bgImage} 
                alt="Salon" 
                className={`w-full h-full object-cover transition-opacity duration-1000 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
                onLoad={() => setIsLoaded(true)}
              />
              {!isLoaded && (
                <div className="absolute inset-0 bg-slate-100 animate-pulse flex items-center justify-center">
                  <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>

            {/* FLOATING ELEMENTS */}
            <motion.div 
              animate={{ y: [0, -20, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -top-10 -right-10 z-30 bg-white p-6 rounded-3xl shadow-premium border border-slate-50 hidden sm:block"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                  <span className="font-black">9.8</span>
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Calificación</p>
                  <p className="text-sm font-black text-bg-dark">Excelencia Garantizada</p>
                </div>
              </div>
            </motion.div>

            <motion.div 
              animate={{ y: [0, 20, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
              className="absolute -bottom-10 -left-10 z-30 bg-white p-6 rounded-3xl shadow-premium border border-slate-50 hidden sm:block"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                  <span className="font-black">15+</span>
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Años</p>
                  <p className="text-sm font-black text-bg-dark">Creando Momentos</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;

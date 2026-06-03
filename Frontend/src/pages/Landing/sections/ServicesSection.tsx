import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles } from 'lucide-react';
import { paquetesService, type Servicio } from '../../../services/paquetesService';
import { getServiceImageFallback } from '../../../utils/imageFallbacks';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const cardVariants = {
  hidden: { opacity: 0, scale: 0.9, y: 20 },
  visible: { 
    opacity: 1, 
    scale: 1, 
    y: 0, 
    transition: { type: "spring" as const, stiffness: 100, damping: 12 } 
  }
};

const ServicesSection = () => {
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const data = await paquetesService.getServicios();
        setServicios(data);
      } catch (err) {
        console.error("Error al cargar servicios en la landing page", err);
      } finally {
        setLoading(false);
      }
    };
    fetchServices();
  }, []);

  const getCategoryLabel = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes('decor')) return 'Decoración 🎨';
    if (n.includes('show') || n.includes('anima') || n.includes('mago')) return 'Diversión 🎭';
    if (n.includes('cater') || n.includes('comida') || n.includes('repost')) return 'Delicias 🧁';
    if (n.includes('foto') || n.includes('video')) return 'Recuerdos 📸';
    return 'Especial ⭐';
  };

  return (
    <section id="servicios" className="py-32 bg-gradient-to-b from-bg-main to-purple-50/30 relative overflow-hidden">
      {/* Playful bubble background decorations */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-purple-300/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-amber-200/10 rounded-full blur-3xl translate-y-1/3 -translate-x-1/3 pointer-events-none" />
      <div className="absolute top-1/2 left-10 w-24 h-24 bg-cyan-200/10 rounded-full blur-xl pointer-events-none animate-bounce" />

      <div className="container mx-auto px-6 relative z-10">
        <motion.div 
          className="max-w-2xl mx-auto text-center space-y-4 mb-20 animate-in fade-in duration-1000"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary/10 rounded-full border border-primary/20 shadow-sm">
            <Sparkles size={12} className="text-primary animate-pulse" />
            <span className="text-xs font-black text-primary uppercase tracking-[0.2em]">Servicios Mágicos</span>
          </div>
          <h2 className="text-4xl lg:text-6xl font-display font-bold text-[var(--text-main)] tracking-tight text-playful-shadow">
            Todo lo que Ofrecemos
          </h2>
          <p className="text-slate-500 font-medium text-lg">Hacemos que organizar fiestas sea tan divertido como asistir a ellas.</p>
        </motion.div>

        {loading ? (
          <div className="text-center py-20 text-slate-400 font-bold uppercase tracking-widest text-xs animate-pulse">Cargando catálogo...</div>
        ) : servicios.length > 0 ? (
          <>
            <motion.div 
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
            >
              {servicios.slice(0, 6).map((s) => {
                return (
                  <motion.div
                    key={s.id}
                    className="group p-6 bg-white border-2 border-purple-100/65 rounded-tl-[3.5rem] rounded-br-[3.5rem] rounded-tr-[1.5rem] rounded-bl-[1.5rem] shadow-sm hover:shadow-2xl hover:shadow-primary/5 hover:border-primary-light/50 transition-all duration-500 hover:-translate-y-2.5 relative overflow-hidden flex flex-col justify-between"
                    variants={cardVariants}
                  >
                    <div>
                      {/* Category sticker badge */}
                      <div className="absolute top-8 left-8 z-30 px-3 py-1 bg-amber-300 text-slate-800 font-black text-[9px] uppercase tracking-wider rounded-full shadow-sm">
                        {getCategoryLabel(s.nombre)}
                      </div>

                      {/* Premium card image representation */}
                      <div className="h-44 w-full rounded-tl-[2.5rem] rounded-br-[2.5rem] rounded-tr-2xl rounded-bl-2xl bg-slate-100 overflow-hidden mb-6 relative border border-purple-50/50">
                        <img 
                          src={s.imagenUrl || getServiceImageFallback(s.nombre)} 
                          alt={s.nombre} 
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                        />
                      </div>
                      
                      <h3 className="text-2xl font-display font-bold text-[var(--text-main)] mb-3 group-hover:text-primary transition-colors tracking-tight leading-snug">{s.nombre}</h3>
                      <p className="text-slate-500 text-sm font-medium leading-relaxed mb-4">{s.descripcion || 'Una experiencia mágica e inolvidable configurada especialmente para tu fiesta.'}</p>
                    </div>
                    
                    <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-50">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{s.esExtra ? 'Servicio Extra' : 'Servicio Base'}</span>
                      <span className="text-lg font-black text-primary">${s.costoBase.toLocaleString()}</span>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>

            {servicios.length > 6 && (
              <div className="text-center mt-16 animate-in fade-in duration-1000">
                <Link 
                  to="/servicios-y-paquetes" 
                  className="inline-flex items-center gap-3 px-10 py-5 candy-bubble-btn rounded-[2rem] text-xs font-black uppercase tracking-widest transition-all"
                >
                  Ver todos los servicios y paquetes ({servicios.length}) <ArrowRight size={16} />
                </Link>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-20 text-slate-400 font-bold">No hay servicios registrados en la base de datos.</div>
        )}
      </div>

      {/* WAVY BOTTOM DIVIDER */}
      <div className="absolute bottom-0 left-0 right-0 w-full overflow-hidden leading-none z-30">
        <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="relative block w-full h-[60px]" fill="var(--bg-main)">
          <path d="M985.66,92.83C906.67,72,823.78,31,743.84,14.19c-82.26-17.34-168.06-16.33-250.45.39-57.84,11.73-114,31.07-172,41.86C233.08,72.82,154.06,44.92,88.43,26.88,57.05,18.3,26.9,8.75,0,0V120H1200V95.83C1132.19,118.92,1055.71,111.31,985.66,92.83Z" fill="var(--bg-main)"></path>
        </svg>
      </div>
    </section>
  );
};

export default ServicesSection;

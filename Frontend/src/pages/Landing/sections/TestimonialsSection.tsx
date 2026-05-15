import { motion } from 'framer-motion';
import { MessageSquareQuote, Star } from 'lucide-react';

const testimonials = [
  {
    name: "María García",
    role: "Madre de cumpleañero",
    text: "El mejor salón de la ciudad. La atención al detalle y la elegancia del lugar hicieron que el cumple de mi hija fuera mágico.",
    rating: 5
  },
  {
    name: "Roberto Soto",
    role: "Padre de familia",
    text: "Excelente servicio y organización. No tuvimos que preocuparnos por nada, el equipo de Zapatitos se encargó de todo.",
    rating: 5
  },
  {
    name: "Elena Martínez",
    role: "Organizadora de eventos",
    text: "Como profesional, valoro mucho la calidad de las instalaciones. Zapatitos ofrece un estándar superior en todo.",
    rating: 5
  }
];

const TestimonialsSection = () => {
  return (
    <section className="py-32 bg-bg-dark overflow-hidden relative">
      {/* DECORATION */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
      
      <div className="container mx-auto px-6 relative z-10">
        <div className="max-w-2xl mx-auto text-center space-y-4 mb-20">
          <div className="inline-block px-4 py-2 bg-white/5 rounded-full border border-white/10">
            <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Testimonios</span>
          </div>
          <h2 className="text-4xl lg:text-5xl font-display font-black text-white tracking-tight leading-tight">
            Lo que dicen <br /> los padres
          </h2>
          <p className="text-slate-400 font-medium">Nuestra mayor recompensa es ver la sonrisa de los niños y la tranquilidad de sus padres.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((t, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1, duration: 0.8 }}
              className="relative p-10 bg-white/5 backdrop-blur-sm border border-white/10 rounded-[2.5rem] group hover:bg-white/[0.08] transition-all duration-500"
            >
              <MessageSquareQuote className="absolute top-8 right-8 text-white/5 group-hover:text-primary/20 transition-colors duration-500" size={64} />
              
              <div className="relative z-10 space-y-6">
                <div className="flex gap-1">
                  {[...Array(t.rating)].map((_, i) => (
                    <Star key={i} size={16} className="fill-primary text-primary" />
                  ))}
                </div>
                
                <p className="text-lg text-slate-300 font-medium leading-relaxed italic">
                  "{t.text}"
                </p>
                
                <div className="pt-6 border-t border-white/5 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary font-black text-xs">
                    {t.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="text-white font-black uppercase text-xs tracking-widest">{t.name}</h4>
                    <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">{t.role}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;

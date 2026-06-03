import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, MessageCircle, Star, Sparkles } from 'lucide-react';

const pastEvents = [
  {
    title: "El Cumpleaños Mágico de Sofía (5 años)",
    image: "https://images.unsplash.com/photo-1530103043960-ef38714abb15?auto=format&fit=crop&q=80&w=1200",
    comment: "El show de magia y animación fue alucinante, ¡los niños no pararon de reír en toda la tarde! Una organización impecable.",
    author: "Mamá Lucía",
    tag: "Show de Magia 🪄"
  },
  {
    title: "La Aventura Temática de Mateo (6 años)",
    image: "https://images.unsplash.com/photo-1485546246426-74dc88dec4d9?auto=format&fit=crop&q=80&w=1200",
    comment: "Toda la decoración temática de dinosaurios y los juegos interactivos de búsqueda de fósiles fueron geniales. ¡Súper recomendado!",
    author: "Papá Diego",
    tag: "Juegos Interactivos 🦖"
  },
  {
    title: "La Fiesta Neon Glitter de Valentina (8 años)",
    image: "https://images.unsplash.com/photo-1519222970733-f546218fa6d7?auto=format&fit=crop&q=80&w=1200",
    comment: "El área de maquillaje de caritas y brillo fue el éxito total para las niñas. El catering infantil estuvo riquísimo y muy fresco.",
    author: "Mamá Carolina",
    tag: "Taller de Glitter ✨"
  },
  {
    title: "El Safari Cumple de Thiago (4 años)",
    image: "https://images.unsplash.com/photo-1544027750-47db62c85958?auto=format&fit=crop&q=80&w=1200",
    comment: "Las instalaciones climatizadas y el personal cuidando y coordinando los juegos nos dio total tranquilidad a los padres.",
    author: "Mamá Romina",
    tag: "Safari Park 🦁"
  }
];

interface PastEventsSectionProps {
  eventsData?: string;
}

const PastEventsSection = ({ eventsData }: PastEventsSectionProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0); // -1 for left, 1 for right

  const displayEvents = (() => {
    if (eventsData) {
      try {
        const parsed = JSON.parse(eventsData);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      } catch (e) {
        console.error("Error parsing past events JSON", e);
      }
    }
    return pastEvents;
  })();

  const handlePrev = () => {
    setDirection(-1);
    setCurrentIndex((prev) => (prev === 0 ? displayEvents.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setDirection(1);
    setCurrentIndex((prev) => (prev === displayEvents.length - 1 ? 0 : prev + 1));
  };

  // Prevent index out of bounds if size of slides decreases
  useEffect(() => {
    if (currentIndex >= displayEvents.length) {
      setCurrentIndex(0);
    }
  }, [displayEvents.length, currentIndex]);

  const current = displayEvents[currentIndex] || displayEvents[0] || pastEvents[0];

  return (
    <section id="galeria-fiestas" className="py-32 bg-bg-main overflow-hidden relative">
      {/* Background bubble decoration */}
      <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-purple-100/30 rounded-full blur-3xl pointer-events-none floating-bubble-slow" />
      <div className="absolute bottom-1/4 right-10 w-80 h-80 bg-pink-100/30 rounded-full blur-3xl pointer-events-none floating-bubble-slower" />

      <div className="container mx-auto px-6 max-w-7xl relative z-10">
        <div className="text-center max-w-2xl mx-auto space-y-4 mb-20">
          <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary/10 rounded-full border border-primary/20 shadow-sm">
            <Sparkles size={12} className="text-primary animate-pulse" />
            <span className="text-xs font-black text-primary uppercase tracking-[0.2em]">Fiestas Pasadas</span>
          </div>
          <h2 className="text-4xl lg:text-5xl font-display font-bold text-[var(--text-main)] tracking-tight text-playful-shadow leading-tight">
            Momentos Felices en Zapatitos
          </h2>
          <p className="text-slate-500 font-medium text-lg">
            Echa un vistazo a la magia que hemos vivido en nuestras celebraciones. ¡Tu fiesta podría ser la siguiente!
          </p>
        </div>

        {/* Carousel Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Polaroid Image Wrapper */}
          <div className="lg:col-span-6 relative flex justify-center px-4">
            <div className="relative w-full max-w-lg aspect-[4/3]">
              <AnimatePresence mode="popLayout" custom={direction} initial={false}>
                <motion.div
                  key={currentIndex}
                  custom={direction}
                  variants={{
                    enter: (dir: number) => ({ x: dir > 0 ? 300 : -300, opacity: 0, rotate: dir > 0 ? 5 : -5 }),
                    center: { x: 0, opacity: 1, rotate: currentIndex % 2 === 0 ? -1.5 : 1.5 },
                    exit: (dir: number) => ({ x: dir < 0 ? 300 : -300, opacity: 0, rotate: dir < 0 ? 5 : -5 })
                  }}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ type: 'spring', stiffness: 220, damping: 22 }}
                  className="absolute inset-0 bg-white p-4 pb-14 rounded-[3.5rem] shadow-2xl border-2 border-purple-50/50 flex flex-col justify-between"
                >
                  <div className="absolute top-6 left-6 z-20 px-3.5 py-1.5 bg-amber-300 text-slate-800 font-black text-[9px] uppercase tracking-wider rounded-full shadow-sm">
                    {current.tag}
                  </div>
                  <div className="w-full h-full rounded-[2.5rem] overflow-hidden bg-slate-100 border border-purple-50/20">
                    <img src={current.image} alt={current.title} className="w-full h-full object-cover" />
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
            
            {/* Absolute Arrows */}
            <div className="absolute top-1/2 -translate-y-1/2 -left-4 z-30">
              <button 
                onClick={handlePrev}
                aria-label="Ver fiesta anterior"
                className="w-12 h-12 rounded-2xl bg-white border border-purple-100 text-slate-500 hover:bg-primary hover:text-white transition-all shadow-lg flex items-center justify-center hover:scale-105 active:scale-95"
              >
                <ChevronLeft size={22} />
              </button>
            </div>
            <div className="absolute top-1/2 -translate-y-1/2 -right-4 z-30">
              <button 
                onClick={handleNext}
                aria-label="Ver siguiente fiesta"
                className="w-12 h-12 rounded-2xl bg-white border border-purple-100 text-slate-500 hover:bg-primary hover:text-white transition-all shadow-lg flex items-center justify-center hover:scale-105 active:scale-95"
              >
                <ChevronRight size={22} />
              </button>
            </div>
          </div>

          {/* Testimonial / Story Wrapper */}
          <div className="lg:col-span-6 space-y-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentIndex}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3 }}
                className="space-y-6 text-center lg:text-left"
              >
                <h3 className="text-2xl lg:text-3xl font-display font-bold text-[var(--text-main)] tracking-tight">
                  {current.title}
                </h3>
                
                {/* Speech bubble review card */}
                <div className="relative p-8 lg:p-10 bg-white border-2 border-purple-100/50 rounded-[3rem] rounded-bl-[0.5rem] shadow-premium space-y-6">
                  <div className="flex gap-1.5 justify-center lg:justify-start">
                    {[1,2,3,4,5].map((s) => (
                      <Star key={s} size={16} className="fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  
                  <p className="text-lg text-slate-600 font-medium leading-relaxed italic relative z-10">
                    "{current.comment}"
                  </p>

                  <div className="flex items-center gap-3.5 pt-4 border-t border-purple-50 justify-center lg:justify-start">
                    <div className="w-10 h-10 rounded-xl bg-purple-50 text-primary flex items-center justify-center shrink-0 border border-purple-100/30">
                      <MessageCircle size={20} className="fill-primary/10" />
                    </div>
                    <div className="text-left">
                      <p className="font-display font-bold text-sm text-[var(--text-main)]">{current.author}</p>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Familia Feliz Zapatitos</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Pagination indicator dots */}
            <div className="flex gap-2 justify-center lg:justify-start pt-4">
              {displayEvents.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentIndex(i)}
                  aria-label={`Ver fiesta ${i + 1}`}
                  className={`w-3.5 h-3.5 rounded-full transition-all duration-300 ${
                    currentIndex === i ? 'bg-primary w-8' : 'bg-purple-100 hover:bg-purple-200'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PastEventsSection;

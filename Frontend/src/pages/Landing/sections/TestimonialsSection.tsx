import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, MessageSquareQuote, Star, Sparkles } from 'lucide-react';

const defaultTestimonials = [
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

interface TestimonialsSectionProps {
  testimonialsJson?: string;
}

const TestimonialCard = ({ t, idx }: { t: any; idx: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ delay: (idx % 3) * 0.1, duration: 0.8 }}
    className="relative h-full p-10 bg-white/[0.03] backdrop-blur-md border border-white/10 rounded-[3rem] rounded-br-[0.5rem] group hover:bg-white/[0.07] hover:border-primary-light/40 transition-all duration-500 shadow-xl hover:-translate-y-2"
  >
    <MessageSquareQuote className="absolute top-8 right-8 text-white/[0.02] group-hover:text-primary-light/10 transition-colors duration-500" size={64} />

    <div className="relative z-10 space-y-6 h-full flex flex-col">
      <div className="flex gap-1">
        {[...Array(Math.min(Math.max(Number(t.rating) || 5, 1), 5))].map((_, i) => (
          <Star key={i} size={14} className="fill-amber-400 text-amber-400" />
        ))}
      </div>

      <p className="text-base text-slate-300 font-medium leading-relaxed italic flex-1">
        "{t.text}"
      </p>

      <div className="pt-6 border-t border-white/5 flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center text-primary-light font-display font-bold text-lg border border-white/10 shrink-0 overflow-hidden">
          {t.avatar ? (
            <img src={t.avatar} alt={t.name} className="w-full h-full object-cover" />
          ) : (
            (t.name || '?').charAt(0)
          )}
        </div>
        <div className="min-w-0">
          <h4 className="text-white font-display font-bold text-sm tracking-wide truncate">{t.name}</h4>
          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-0.5 truncate">{t.role}</p>
        </div>
      </div>
    </div>
  </motion.div>
);

const TestimonialsSection = ({ testimonialsJson }: TestimonialsSectionProps) => {
  const [visibleCount, setVisibleCount] = useState(3);
  const [currentIndex, setCurrentIndex] = useState(0);

  const displayTestimonials = (() => {
    if (testimonialsJson) {
      try {
        const parsed = JSON.parse(testimonialsJson);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch {
        // fallback
      }
    }
    return defaultTestimonials;
  })();

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) setVisibleCount(3);
      else if (window.innerWidth >= 768) setVisibleCount(2);
      else setVisibleCount(1);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const maxIndex = Math.max(0, displayTestimonials.length - visibleCount);
  const showCarousel = displayTestimonials.length > visibleCount;

  useEffect(() => {
    if (currentIndex > maxIndex) setCurrentIndex(maxIndex);
  }, [currentIndex, maxIndex]);

  const handlePrev = () => setCurrentIndex((prev) => Math.max(prev - 1, 0));
  const handleNext = () => setCurrentIndex((prev) => Math.min(prev + 1, maxIndex));

  return (
    <section className="py-32 bg-[#0c0926] overflow-hidden relative">
      {/* GLOWING STARDUST PARTICLES */}
      <div className="absolute top-10 left-12 w-2 h-2 rounded-full bg-pink-300 animate-ping pointer-events-none" />
      <div className="absolute top-1/4 right-20 w-3 h-3 rounded-full bg-cyan-300 animate-pulse pointer-events-none" />
      <div className="absolute bottom-12 left-1/3 w-1.5 h-1.5 rounded-full bg-yellow-200 animate-pulse pointer-events-none" />
      <div className="absolute bottom-1/3 right-1/4 w-2 h-2 rounded-full bg-purple-300 animate-ping pointer-events-none" />

      {/* NEBULA GLOW EFFECTS */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-pink-500/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="container mx-auto px-6 relative z-10">
        <div className="max-w-2xl mx-auto text-center space-y-4 mb-20">
          <div className="inline-flex items-center gap-1.5 px-4 py-2 bg-white/5 rounded-full border border-white/10 shadow-sm">
            <Sparkles size={12} className="text-primary-light animate-pulse" />
            <span className="text-[10px] font-black text-primary-light uppercase tracking-[0.2em]">Testimonios</span>
          </div>
          <h2 className="text-4xl lg:text-5xl font-display font-bold text-white tracking-tight leading-tight text-shadow-sm">
            Lo que dicen <br /> los padres
          </h2>
          <p className="text-slate-400 font-medium">Nuestra mayor recompensa es ver la sonrisa de los niños y la tranquilidad de sus padres.</p>
        </div>

        <div className="relative">
          <div className="overflow-hidden px-1 py-2">
            <div
              className={`flex transition-transform duration-500 ease-out ${!showCarousel ? 'lg:grid lg:grid-cols-3 lg:gap-8' : ''}`}
              style={showCarousel ? {
                transform: `translateX(-${currentIndex * (100 / visibleCount)}%)`,
                width: `${(displayTestimonials.length / visibleCount) * 100}%`
              } : undefined}
            >
              {displayTestimonials.map((t, idx) => (
                <div
                  key={idx}
                  className={showCarousel ? 'px-4 shrink-0' : 'w-full mb-8 lg:mb-0'}
                  style={showCarousel ? { width: `${100 / displayTestimonials.length}%` } : undefined}
                >
                  <TestimonialCard t={t} idx={idx} />
                </div>
              ))}
            </div>
          </div>

          {showCarousel && (
            <>
              <button
                type="button"
                onClick={handlePrev}
                disabled={currentIndex === 0}
                aria-label="Ver testimonios anteriores"
                className="absolute top-1/2 -translate-y-1/2 -left-3 lg:-left-6 z-20 w-12 h-12 rounded-2xl bg-white/10 border border-white/10 text-white hover:bg-primary transition-all shadow-lg flex items-center justify-center disabled:opacity-30 disabled:hover:bg-white/10"
              >
                <ChevronLeft size={22} />
              </button>
              <button
                type="button"
                onClick={handleNext}
                disabled={currentIndex === maxIndex}
                aria-label="Ver siguientes testimonios"
                className="absolute top-1/2 -translate-y-1/2 -right-3 lg:-right-6 z-20 w-12 h-12 rounded-2xl bg-white/10 border border-white/10 text-white hover:bg-primary transition-all shadow-lg flex items-center justify-center disabled:opacity-30 disabled:hover:bg-white/10"
              >
                <ChevronRight size={22} />
              </button>

              <div className="flex gap-2 justify-center pt-10">
                {Array.from({ length: maxIndex + 1 }).map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setCurrentIndex(i)}
                    aria-label={`Ir al grupo de testimonios ${i + 1}`}
                    className={`h-3 rounded-full transition-all duration-300 ${currentIndex === i ? 'w-8 bg-primary' : 'w-3 bg-white/15 hover:bg-white/30'}`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;

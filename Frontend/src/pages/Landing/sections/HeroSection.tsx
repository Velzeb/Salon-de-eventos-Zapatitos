import { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Gift, Sparkles, Star, PartyPopper, Smile } from 'lucide-react';

interface HeroSectionProps {
  title: string;
  subtitle: string;
  image?: string;
  badge?: string;
}

// Playful custom SVG Balloon component with radial gradient
const SVGBalloon = ({ className, color, delay }: { className?: string; color: string; delay?: number }) => (
  <motion.div
    animate={{ y: [0, -25, 0], rotate: [-3, 3, -3] }}
    transition={{ duration: 6 + Math.random() * 3, repeat: Infinity, ease: "easeInOut", delay: delay }}
    className={className}
  >
    <svg viewBox="0 0 50 120" className="w-full h-full drop-shadow-md">
      <defs>
        <radialGradient id={`grad-${color.replace('#', '')}`} cx="35%" cy="30%" r="55%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.65" />
          <stop offset="60%" stopColor={color} />
          <stop offset="100%" stopColor={color} />
        </radialGradient>
      </defs>
      {/* Balloon Ellipse */}
      <ellipse cx="25" cy="30" rx="17" ry="21" fill={`url(#grad-${color.replace('#', '')})`} />
      {/* Balloon Knot */}
      <polygon points="22,50 28,50 25,54" fill={color} />
      {/* Balloon String */}
      <path d="M25,54 Q28,75 21,95 T25,115" fill="none" stroke="#cbd5e1" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  </motion.div>
);

// Soft custom SVG Cloud component
const SVGCloud = ({ className, delay }: { className?: string; delay?: number }) => (
  <motion.div
    animate={{ x: [0, 15, 0] }}
    transition={{ duration: 12 + Math.random() * 4, repeat: Infinity, ease: "easeInOut", delay: delay }}
    className={className}
  >
    <svg viewBox="0 0 120 80" className="w-full h-full drop-shadow-sm opacity-40">
      <path 
        d="M30 60 Q20 60 20 50 Q20 40 30 40 Q35 25 50 25 Q65 20 75 35 Q85 30 90 40 Q100 40 100 52 Q100 60 90 60 Z" 
        fill="#ffffff" 
      />
    </svg>
  </motion.div>
);

const HeroSection = ({ title, subtitle, image, badge }: HeroSectionProps) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const defaultImage = "https://images.unsplash.com/photo-1530103043960-ef38714abb15?auto=format&fit=crop&q=80&w=2069";
  const bgImage = (image && image.trim().length > 0) ? image : defaultImage;

  // Custom typography highlighting function
  const renderPlayfulTitle = (fullTitle: string) => {
    const parts = fullTitle.split('—');
    if (parts.length > 1) {
      return (
        <>
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-pink-500 to-amber-400 font-extrabold text-5xl lg:text-7xl leading-tight">
            {parts[0].trim()}
          </span>
          <span className="block text-3xl lg:text-5xl mt-3 font-medium text-slate-700 tracking-normal leading-snug">
            {parts[1].trim()}
          </span>
        </>
      );
    }
    return <span>{fullTitle}</span>;
  };

  return (
    <section className="relative min-h-screen flex items-center pt-36 lg:pt-40 pb-24 lg:pb-28 overflow-hidden bg-bg-main">
      {/* PLAYFUL BUBBLES BACKGROUND DECORATION */}
      <div className="absolute top-1/4 right-10 w-96 h-96 bg-pink-100/50 rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute top-10 right-1/3 w-80 h-80 bg-yellow-100/40 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-20 w-80 h-80 bg-cyan-100/50 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
      
      {/* SVG Balloons Floating */}
      <SVGBalloon className="absolute top-28 left-6 w-14 h-36 z-0 pointer-events-none" color="#ffb7b2" delay={0} />
      <SVGBalloon className="absolute bottom-40 left-12 w-16 h-40 z-0 pointer-events-none" color="#d8b4fe" delay={1.5} />
      <SVGBalloon className="absolute top-52 right-20 w-12 h-32 z-0 pointer-events-none" color="#fde047" delay={0.7} />
      <SVGBalloon className="absolute bottom-16 right-[45%] w-10 h-28 z-0 pointer-events-none" color="#a5f3fc" delay={2.2} />

      {/* SVG Clouds */}
      <SVGCloud className="absolute top-16 left-[25%] w-24 h-16 z-0 pointer-events-none" delay={0} />
      <SVGCloud className="absolute top-28 right-[10%] w-32 h-20 z-0 pointer-events-none" delay={3} />
      
      <div className="container mx-auto px-6 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 xl:gap-16 items-center">
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="space-y-8 text-center lg:text-left"
          >
            {/* Playful Welcome Badge (No tech ping light) */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-100/70 rounded-full border border-amber-200/80 shadow-sm"
            >
              <span className="text-[11px] font-black text-amber-700 uppercase tracking-[0.2em] flex items-center gap-2 font-display">
                <PartyPopper size={14} className="text-amber-500" /> {badge || '¡Bienvenidos a Zapatitos!'} <PartyPopper size={14} className="text-amber-500" />
              </span>
            </motion.div>
 
            <h1 className="text-5xl lg:text-7xl font-display font-bold text-[var(--text-main)] tracking-tight leading-[1.05] text-playful-shadow">
              {renderPlayfulTitle(title)}
            </h1>
 
            <p className="text-xl text-slate-500 font-medium leading-relaxed max-w-xl mx-auto lg:mx-0 font-main">
              {subtitle}
            </p>
 
            <div className="flex flex-col sm:flex-row items-center gap-4 pt-4 justify-center lg:justify-start">
              <a 
                href="#disponibilidad" 
                className="w-full sm:w-auto px-10 py-5 candy-bubble-btn rounded-[2rem] text-xs flex items-center justify-center gap-2"
              >
                <Calendar size={16} /> Explorar Disponibilidad
              </a>
              <a 
                href="#paquetes" 
                className="w-full sm:w-auto px-10 py-5 candy-bubble-btn rounded-[2rem] text-xs flex items-center justify-center gap-2"
                style={{ background: 'linear-gradient(135deg, #ffc837 0%, #ff8008 100%)', boxShadow: '0 10px 25px -5px rgba(251, 191, 36, 0.4)' }}
              >
                <Gift size={16} /> Ver Paquetes
              </a>
            </div>

            {/* Custom Interactive Cloud-like Dialog Review block (no hardcoded avatars) */}
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="relative p-6 bg-white border-2 border-pink-200 rounded-[2.5rem] rounded-bl-[0.5rem] shadow-premium max-w-md mx-auto lg:mx-0 flex flex-col sm:flex-row items-center gap-4 hover:scale-[1.02] transition-transform z-10"
            >
              <div className="w-12 h-12 rounded-2xl bg-pink-100 text-pink-500 flex items-center justify-center shrink-0">
                <Smile size={28} className="fill-pink-200" />
              </div>
              <div className="text-center sm:text-left space-y-1">
                <div className="flex gap-0.5 justify-center sm:justify-start">
                  {[1,2,3,4,5].map(i => <Star key={i} size={16} className="fill-amber-400 text-amber-400" />)}
                </div>
                <p className="font-display font-bold text-sm text-[var(--text-main)]">
                  ¡La diversión favorita de más de <span className="text-primary font-black">500 familias felices</span>!
                </p>
              </div>
              {/* Dialogue speech arrow */}
              <div className="absolute -bottom-3.5 left-6 w-6 h-6 bg-white border-b-2 border-l-2 border-pink-200 rounded-bl-lg transform -rotate-45" />
            </motion.div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="relative mx-auto mt-8 w-full max-w-[430px] px-2 sm:px-6 lg:ml-auto lg:mr-0 lg:mt-0 xl:max-w-[460px]"
          >
            <div className="sticker-frame relative z-20 aspect-[5/6] overflow-hidden rounded-[2.25rem] border-[8px] border-white bg-slate-100 shadow-premium">
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

            {/* Professional image badges */}
            <motion.div 
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.35 }}
              className="absolute right-4 top-5 z-30 hidden max-w-[230px] rounded-[1.5rem] border border-white/80 bg-white/95 p-3.5 shadow-xl shadow-slate-900/10 backdrop-blur sm:block"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-600">
                  <Sparkles size={19} className="fill-amber-300" />
                </div>
                <div>
                  <p className="font-display text-[10px] font-black uppercase leading-none tracking-[0.18em] text-amber-600">Producción integral</p>
                  <p className="mt-1 font-main text-xs font-bold leading-snug text-slate-700">Show, decoración y coordinación</p>
                </div>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.5 }}
              className="absolute -bottom-3 left-2 z-30 hidden max-w-[245px] rounded-[1.5rem] border border-white/80 bg-white/95 p-3.5 shadow-xl shadow-slate-900/10 backdrop-blur sm:block lg:left-0"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-pink-100 text-pink-600">
                  <Gift size={19} className="fill-pink-200" />
                </div>
                <div>
                  <p className="font-display text-[10px] font-black uppercase leading-none tracking-[0.18em] text-pink-600">Experiencia completa</p>
                  <p className="mt-1 font-main text-xs font-bold leading-snug text-slate-700">Invitaciones y detalles incluidos</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* WAVY BOTTOM DIVIDER */}
      <div className="absolute bottom-0 left-0 right-0 w-full overflow-hidden leading-none z-30">
        <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="relative block w-full h-[60px]" fill="#fff8fa">
          <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V120H0V0C26.9,8.75,57.05,18.3,88.43,26.88,154.06,44.92,233.08,72.82,321.39,56.44Z" fill="#fff8fa"></path>
        </svg>
      </div>
    </section>
  );
};

export default HeroSection;

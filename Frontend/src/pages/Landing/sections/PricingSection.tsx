import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle2, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';
import { authService } from '../../../services/authService';

interface Package {
  id?: number;
  name: string;
  price: string;
  features: string[];
  recommended: boolean;
}

interface PricingSectionProps {
  packages?: any[];
  recommendedPackageId?: string;
  currencySymbol?: string;
  currencyLabel?: string;
}

const defaultPackages: Package[] = [
  { id: 1, name: 'Básico', price: '299', recommended: false, features: ['3 horas de salón', 'Invitaciones digitales', 'Asistencia básica', 'Limpieza incluida'] },
  { id: 2, name: 'Premium', price: '499', recommended: true, features: ['5 horas de salón', 'Decoración temática', 'Catering infantil', 'Show de magia', 'Piñata premium'] },
  { id: 3, name: 'VIP', price: '899', recommended: false, features: ['Día completo', 'Todo incluido', 'Show personalizado', 'Área VIP padres', 'Mesa de dulces'] }
];

const PricingSection = ({ packages, recommendedPackageId, currencySymbol = '$', currencyLabel = '/ Evento' }: PricingSectionProps) => {
  const navigate = useNavigate();

  const displayPackages: Package[] = (packages && packages.length > 0)
    ? packages.map((pkg, idx) => {
        const features = [
          `${pkg.duracionHoras} horas de salón`,
          `Hasta ${pkg.capacidadNinos} niños`,
          ...pkg.servicios.map((s: any) => `${s.cantidad > 1 ? s.cantidad + 'x ' : ''}${s.nombre}`)
        ];

        return {
          id: pkg.id,
          name: pkg.nombre,
          price: pkg.precioBase.toString(),
          features,
          recommended: recommendedPackageId 
            ? pkg.id?.toString() === recommendedPackageId
            : (pkg.nombre.toLowerCase().includes('premium') || idx === 1)
        };
      })
    : defaultPackages;

  const handleSelect = (pkgId?: number) => {
    const targetPath = pkgId ? `/reservar?paqueteId=${pkgId}` : '/reservar';
    if (authService.isAuthenticated()) {
      navigate(targetPath);
    } else {
      navigate(`/cliente/login?redirect=${encodeURIComponent(targetPath)}`);
    }
  };

  // Carousel Logic
  const [visibleCount, setVisibleCount] = useState(3);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const handleResize = () => {
      if (typeof window !== 'undefined') {
        if (window.innerWidth >= 1024) {
          setVisibleCount(3);
        } else if (window.innerWidth >= 768) {
          setVisibleCount(2);
        } else {
          setVisibleCount(1);
        }
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const maxIndex = Math.max(0, displayPackages.length - visibleCount);

  // Clamp current index if maxIndex decreases on resize
  useEffect(() => {
    if (currentIndex > maxIndex) {
      setCurrentIndex(maxIndex);
    }
  }, [maxIndex, currentIndex]);

  const handlePrev = () => {
    setCurrentIndex((prev) => Math.max(prev - 1, 0));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => Math.min(prev + 1, maxIndex));
  };

  const showControls = displayPackages.length > visibleCount;

  return (
    <section id="paquetes" className="py-32 bg-bg-main overflow-hidden relative">
      {/* Background blobs */}
      <div className="absolute top-1/2 left-0 w-96 h-96 bg-purple-100/30 rounded-full blur-3xl -translate-x-1/2 pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-pink-100/20 rounded-full blur-3xl pointer-events-none" />
      
      <div className="container mx-auto px-6 relative z-10">
        <motion.div 
          className="max-w-2xl mx-auto text-center space-y-4 mb-16"
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <div className="inline-block px-4 py-2 bg-primary/10 rounded-full border border-primary/20">
            <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Planes & Precios</span>
          </div>
          <h2 className="text-4xl lg:text-5xl font-display font-bold text-[var(--text-main)] tracking-tight text-playful-shadow">
            Elige el Paquete Perfecto
          </h2>
          <p className="text-slate-500 font-medium">Opciones flexibles diseñadas para cada tipo de celebración.</p>
        </motion.div>

        {/* Carousel Container */}
        <div className="relative px-2 sm:px-4">
          <div className="overflow-hidden py-10 px-2">
            <div 
              className="flex transition-transform duration-500 ease-out"
              style={{ 
                transform: `translateX(-${currentIndex * (100 / visibleCount)}%)`,
                width: `${(displayPackages.length / visibleCount) * 100}%` 
              }}
            >
              {displayPackages.map((pkg, i) => (
                <div 
                  key={i} 
                  className="px-4 shrink-0 flex-1"
                  style={{ width: `${100 / displayPackages.length}%` }}
                >
                  <motion.div 
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: (i % visibleCount) * 0.15 }}
                    className={`
                      relative p-10 border transition-all duration-500 flex flex-col group h-full
                      ${pkg.recommended 
                        ? 'bg-gradient-to-br from-[#1e1b4b] to-[#120f35] border-primary-light/35 rounded-tl-[1.5rem] rounded-br-[1.5rem] rounded-tr-[3.5rem] rounded-bl-[3.5rem] scale-105 z-20 shadow-2xl shadow-purple-950/20' 
                        : 'bg-white border-purple-100/70 rounded-tl-[3.5rem] rounded-br-[3.5rem] rounded-tr-[1.5rem] rounded-bl-[1.5rem] shadow-sm hover:shadow-2xl z-10'}
                    `}
                  >
                    {pkg.recommended && (
                      <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-primary to-pink-500 text-white px-6 py-2 rounded-full text-[9px] font-black uppercase tracking-[0.2em] shadow-lg shadow-primary/30 flex items-center gap-1.5 animate-bounce">
                        <Sparkles size={10} /> Más Elegido
                      </div>
                    )}
                    
                    <div className="mb-10 space-y-4 text-center">
                      <h3 className={`text-xl font-display font-bold uppercase tracking-widest ${pkg.recommended ? 'text-primary-light' : 'text-slate-400'}`}>
                        {pkg.name}
                      </h3>
                      <div className={`flex items-center justify-center gap-1 ${pkg.recommended ? 'text-white' : 'text-[var(--text-main)]'}`}>
                        <span className="text-2xl font-bold opacity-50">{currencySymbol}</span>
                        <span className="text-6xl font-display font-bold tracking-tight">{Number(pkg.price).toLocaleString()}</span>
                        <span className="text-sm font-bold opacity-50 uppercase tracking-widest ml-2">{currencyLabel}</span>
                      </div>
                    </div>

                    <ul className="flex-1 space-y-5 mb-10 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                      {pkg.features.map((feat, fi) => (
                        <li key={fi} className="flex items-center gap-4">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${pkg.recommended ? 'bg-primary/20 text-primary-light' : 'bg-purple-50 text-primary'}`}>
                            <CheckCircle2 size={14} />
                          </div>
                          <span className={`text-sm font-bold ${pkg.recommended ? 'text-slate-300' : 'text-slate-600'}`}>
                            {feat}
                          </span>
                        </li>
                      ))}
                    </ul>

                    <button 
                      onClick={() => handleSelect(pkg.id)}
                      className={`
                        w-full py-[1.125rem] rounded-2xl font-black uppercase tracking-widest text-[11px] transition-all active:scale-95 mt-auto
                        ${pkg.recommended 
                          ? 'candy-bubble-btn' 
                          : 'bg-purple-50 text-primary hover:bg-primary hover:text-white shadow-sm hover:shadow-md'}
                      `}
                    >
                      Seleccionar {pkg.name}
                    </button>
                  </motion.div>
                </div>
              ))}
            </div>
          </div>

          {/* Navigation Controls */}
          {showControls && (
            <>
              <div className="absolute top-1/2 -translate-y-1/2 -left-2 sm:-left-4 z-30">
                <button 
                  onClick={handlePrev}
                  disabled={currentIndex === 0}
                  aria-label="Ver paquetes anteriores"
                  className="w-12 h-12 rounded-2xl bg-white border border-purple-100 text-slate-500 hover:bg-primary hover:text-white transition-all shadow-lg flex items-center justify-center hover:scale-105 active:scale-95 disabled:opacity-30 disabled:hover:scale-100 disabled:hover:bg-white disabled:hover:text-slate-500"
                >
                  <ChevronLeft size={22} />
                </button>
              </div>
              <div className="absolute top-1/2 -translate-y-1/2 -right-2 sm:-right-4 z-30">
                <button 
                  onClick={handleNext}
                  disabled={currentIndex === maxIndex}
                  aria-label="Ver siguientes paquetes"
                  className="w-12 h-12 rounded-2xl bg-white border border-purple-100 text-slate-500 hover:bg-primary hover:text-white transition-all shadow-lg flex items-center justify-center hover:scale-105 active:scale-95 disabled:opacity-30 disabled:hover:scale-100 disabled:hover:bg-white disabled:hover:text-slate-500"
                >
                  <ChevronRight size={22} />
                </button>
              </div>
            </>
          )}
        </div>

        {/* Carousel Pagination Dots */}
        {showControls && (
          <div className="flex gap-2 justify-center pt-6">
            {Array.from({ length: maxIndex + 1 }).map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentIndex(i)}
                aria-label={`Ir al grupo de paquetes ${i + 1}`}
                className={`w-3.5 h-3.5 rounded-full transition-all duration-300 ${
                  currentIndex === i ? 'bg-primary w-8' : 'bg-purple-100 hover:bg-purple-200'
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default PricingSection;

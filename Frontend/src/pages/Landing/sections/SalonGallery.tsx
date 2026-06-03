import { motion } from 'framer-motion';
import { CheckCircle2, MapPin } from 'lucide-react';

interface SalonGalleryProps {
  title?: string;
  subtitle?: string;
  description?: string;
  featuresJson?: string;
  imagesJson?: string;
}

interface SalonImage {
  src?: string;
  img?: string;
  label?: string;
  alt?: string;
  height?: string;
}

const defaultFeatures = [
  'Área de Juegos Interactivos',
  'Salón Climatizado de Alta Capacidad',
  'Sonido e Iluminación Profesional',
  'Personal de Seguridad y Monitoreo'
];

const defaultImages: SalonImage[] = [
  {
    src: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?auto=format&fit=crop&q=80&w=1470',
    label: 'Salón Climatizado',
    alt: 'Main Salon',
    height: 'h-48'
  },
  {
    src: 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&q=80&w=1469',
    label: 'Zona de Juegos',
    alt: 'Kids Area',
    height: 'h-64'
  },
  {
    src: 'https://images.unsplash.com/photo-1472653431158-6364773b2a56?auto=format&fit=crop&q=80&w=1469',
    label: 'Globos y Temáticas',
    alt: 'Decoration',
    height: 'h-[400px]'
  }
];

const parseJsonArray = <T,>(value: string | undefined, fallback: T[]) => {
  if (!value) return fallback;
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : fallback;
  } catch {
    return fallback;
  }
};

const SalonGallery = ({ title, description, featuresJson, imagesJson }: SalonGalleryProps) => {
  const features = parseJsonArray<string>(featuresJson, defaultFeatures);
  const images = parseJsonArray<SalonImage>(imagesJson, defaultImages);
  const [firstImage, secondImage, thirdImage] = [...images, ...defaultImages].slice(0, 3);

  return (
    <section id="salon" className="py-32 bg-[var(--bg-main)] overflow-hidden relative">
      {/* Decorative vectors */}
      <div className="absolute top-1/3 -left-12 w-48 h-48 bg-purple-200/20 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute bottom-1/3 -right-12 w-48 h-48 bg-pink-200/20 rounded-full blur-2xl pointer-events-none" />

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
            <h2 className="text-4xl lg:text-5xl font-display font-bold text-[var(--text-main)] tracking-tight leading-tight text-playful-shadow">
              {title || 'Un Espacio Diseñado para Soñar'}
            </h2>
            <p className="text-lg text-slate-500 font-medium leading-relaxed font-main">
              {description || 'Contamos con amplias áreas climatizadas, zonas de juegos interactivos de última generación y decoraciones de ensueño diseñadas especialmente para hacer realidad las fantasías de tus pequeños.'}
            </p>
            
            <ul className="grid sm:grid-cols-2 gap-4">
              {features.map((text, i) => (
                <motion.li 
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3 + (i * 0.1) }}
                  className="flex items-center gap-3 p-4 bg-white rounded-2xl border border-slate-100 shadow-sm group hover:border-primary-light/50 transition-colors"
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
            <div className="grid grid-cols-2 gap-6 relative z-10">
              <div className="space-y-6">
                {/* Polaroid 1 */}
                <div className="bg-white p-3.5 pb-10 rounded-3xl shadow-lg border border-purple-50/50 -rotate-3 hover:rotate-0 transition-transform duration-500 hover:shadow-2xl">
                  <div className="h-48 rounded-2xl overflow-hidden bg-slate-100 mb-4">
                    <img 
                      src={firstImage.src || firstImage.img}
                      alt={firstImage.alt || firstImage.label || 'Salón'} 
                      className="w-full h-full object-cover" 
                    />
                  </div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center flex items-center justify-center gap-1">
                    <MapPin size={10} className="text-primary" /> {firstImage.label || 'Salón Climatizado'}
                  </p>
                </div>
                
                {/* Polaroid 2 */}
                <div className="bg-white p-3.5 pb-10 rounded-3xl shadow-lg border border-purple-50/50 rotate-3 hover:rotate-0 transition-transform duration-500 hover:shadow-2xl">
                  <div className="h-64 rounded-2xl overflow-hidden bg-slate-100 mb-4">
                    <img 
                      src={secondImage.src || secondImage.img}
                      alt={secondImage.alt || secondImage.label || 'Zona de juegos'} 
                      className="w-full h-full object-cover" 
                    />
                  </div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center flex items-center justify-center gap-1">
                    <MapPin size={10} className="text-primary" /> {secondImage.label || 'Zona de Juegos'}
                  </p>
                </div>
              </div>
              
              <div className="pt-10">
                {/* Polaroid 3 */}
                <div className="bg-white p-3.5 pb-10 rounded-3xl shadow-lg border border-purple-50/50 -rotate-1 hover:rotate-0 transition-transform duration-500 hover:shadow-2xl">
                  <div className="h-[400px] rounded-2xl overflow-hidden bg-slate-100 mb-4">
                    <img 
                      src={thirdImage.src || thirdImage.img}
                      alt={thirdImage.alt || thirdImage.label || 'Decoración'} 
                      className="w-full h-full object-cover" 
                    />
                  </div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center flex items-center justify-center gap-1">
                    <MapPin size={10} className="text-primary" /> {thirdImage.label || 'Globos y Temáticas'}
                  </p>
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

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Heart, Users, Sparkles, Calendar, HelpCircle, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { configService } from '../../services/configService';

const cardVariants = {
  hidden: { opacity: 0, scale: 0.9, y: 20 },
  visible: { 
    opacity: 1, 
    scale: 1, 
    y: 0, 
    transition: { type: "spring" as const, stiffness: 100, damping: 12 } 
  }
};

const defaultEmployees = [
  { name: "Lucía Fernández", role: "Coordinadora de Eventos", img: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=400", desc: "" },
  { name: "Tío Mateo", role: "Mago & Animador Líder", img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400", desc: "" },
  { name: "Sofía Gómez", role: "Chef Infantil & Repostería", img: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=400", desc: "" },
  { name: "Carlos Ruiz", role: "Encargado de Sonido & Luces", img: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=400", desc: "" }
];

const defaultValues = [
  { 
    icon: "ShieldCheck", 
    title: "Seguridad y Cuidado", 
    desc: "Nuestras instalaciones están completamente equipadas con sistemas de seguridad y zonas acolchadas. Todo nuestro personal cuenta con certificación en asistencia infantil.", 
    color: "#10b981" 
  },
  { 
    icon: "Heart", 
    title: "Diversión y Creatividad", 
    desc: "Desarrollamos shows, títeres y talleres temáticos dinámicos que estimulan la imaginación de los pequeños, alejándolos de las pantallas por unas horas de pura alegría.", 
    color: "#ff5e7e" 
  },
  { 
    icon: "Users", 
    title: "Tranquilidad para los Padres", 
    desc: "Nos encargamos de todo: invitaciones digitales, catering premium, limpieza antes y después de la fiesta. Tu única tarea es relajarte y tomar fotos divertidas.", 
    color: "#fbbf24" 
  }
];

const defaultGallery = [
  { img: "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?auto=format&fit=crop&q=80&w=600", desc: "Nuestro amplio salón principal decorado para un cumpleaños mágico." },
  { img: "https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&q=80&w=600", desc: "Zonas de juego seguras y equipadas para niños de todas las edades." },
  { img: "https://images.unsplash.com/photo-1472653431158-6364773b2a56?auto=format&fit=crop&q=80&w=600", desc: "Detalles en globos y temáticas personalizadas para cada cumpleañero." }
];

// Helper to resolve icon components by string name
const resolveIcon = (iconName: string) => {
  switch (iconName) {
    case "ShieldCheck": return ShieldCheck;
    case "Heart": return Heart;
    case "Users": return Users;
    default: return HelpCircle;
  }
};

const SobreNosotrosPage = () => {
  const [configs, setConfigs] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadConfigs = async () => {
      try {
        const data = await configService.getLandingConfig();
        const map: Record<string, string> = {};
        data.forEach(d => { if(d.valor) map[d.clave] = d.valor; });
        setConfigs(map);
      } catch (err) {
        console.error('Error loading config', err);
      } finally {
        setLoading(false);
      }
    };
    loadConfigs();
  }, []);

  const displayEmployees = (() => {
    if (configs.about_us_employees_json) {
      try {
        const parsed = JSON.parse(configs.about_us_employees_json);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      } catch (e) {
        console.error("Error parsing team json", e);
      }
    }
    return defaultEmployees;
  })();

  const displayValues = (() => {
    if (configs.about_us_values_json) {
      try {
        const parsed = JSON.parse(configs.about_us_values_json);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      } catch (e) {
        console.error("Error parsing values json", e);
      }
    }
    return defaultValues;
  })();

  const displayTitle = configs.about_us_title || "Pasión por crear recuerdos que duran toda la vida";
  const displayDesc = configs.about_us_description || "En Zapatitos, no solo alquilamos un espacio; diseñamos experiencias. Lo que comenzó como un pequeño sueño familiar se ha convertido en el referente de celebraciones infantiles premium en la ciudad.";
  const displayStoryTitle = configs.about_us_story_title || "¿Cómo nació Zapatitos?";
  const displayImage = configs.about_us_image || "https://images.unsplash.com/photo-1530103043960-ef38714abb15?auto=format&fit=crop&q=80&w=1200";
  const displayYearsExp = configs.about_us_years_experience || "10+";
  const displayEventsCount = configs.about_us_events_count || "500+";
  const displayPageTitle = configs.about_us_page_title || "Nuestra Historia de Magia y Diversión";

  const displayGallery = (() => {
    if (configs.about_us_gallery_json) {
      try {
        const parsed = JSON.parse(configs.about_us_gallery_json);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      } catch (e) {
        console.error("Error parsing gallery json", e);
      }
    }
    return defaultGallery;
  })();

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-bg-main pt-24">
        <RefreshCw className="animate-spin text-primary" size={48} />
        <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Cargando Historia...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-main pt-24 pb-20 selection:bg-primary selection:text-white">
      {/* HERO BANNER */}
      <section className="relative py-20 text-center overflow-hidden bg-gradient-to-b from-bg-main to-purple-50/20">
        <div className="absolute top-10 left-10 w-32 h-32 bg-pink-100/50 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-5 right-10 w-40 h-40 bg-purple-100/50 rounded-full blur-3xl pointer-events-none" />
        
        <div className="max-w-3xl mx-auto px-6 space-y-6 relative z-10">
          <div className="inline-block px-5 py-2.5 bg-primary/10 rounded-full border border-primary/20 shadow-sm">
            <span className="text-xs font-black text-primary uppercase tracking-[0.25em] flex items-center justify-center gap-1.5 font-display">
              <Sparkles size={12} className="text-primary animate-pulse" /> Conócenos Más <Sparkles size={12} className="text-primary animate-pulse" />
            </span>
          </div>
          <h1 className="text-4xl md:text-6xl font-display font-black text-bg-dark tracking-tight leading-none text-playful-shadow">
            {displayPageTitle}
          </h1>
          <p className="text-slate-500 font-medium text-lg max-w-xl mx-auto font-main">
            {displayTitle}
          </p>
        </div>
      </section>

      {/* CORE STORY */}
      <section className="max-w-7xl mx-auto px-6 lg:px-10 py-12 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        <motion.div 
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="space-y-6"
        >
          <h2 className="text-3xl lg:text-4xl font-display font-black text-bg-dark tracking-tight">{displayStoryTitle}</h2>
          <p className="text-slate-500 font-medium leading-relaxed font-main whitespace-pre-line">
            {displayDesc}
          </p>
          <div className="grid grid-cols-2 gap-6 pt-4">
            <div className="p-5 bg-white border border-purple-50 rounded-2xl shadow-sm space-y-1">
              <p className="text-3xl font-black text-primary font-display">{displayYearsExp}</p>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest font-main">Años de Magia</p>
            </div>
            <div className="p-5 bg-white border border-purple-50 rounded-2xl shadow-sm space-y-1">
              <p className="text-3xl font-black text-primary font-display">{displayEventsCount}</p>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest font-main">Fiestas Felices</p>
            </div>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="relative"
        >
          <div className="aspect-[4/3] rounded-[3rem] overflow-hidden shadow-2xl border-8 border-white bg-slate-100">
            <img 
              src={displayImage} 
              alt="Fiesta Infantil" 
              className="w-full h-full object-cover" 
            />
          </div>
        </motion.div>
      </section>

      {/* VALUES */}
      <section className="bg-gradient-to-b from-[#fff8fa] to-white py-20 mt-10">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 space-y-16">
          <div className="text-center space-y-2">
            <h2 className="text-3xl lg:text-5xl font-display font-black text-bg-dark tracking-tight text-playful-shadow">Nuestros Pilares Mágicos</h2>
            <p className="text-slate-500 font-medium max-w-md mx-auto font-main">Lo que nos impulsa a dar lo mejor en cada fiesta.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {displayValues.map((v, idx) => {
              const ValueIcon = resolveIcon(v.icon);
              return (
                <motion.div
                  key={idx}
                  className="group p-8 bg-white border border-purple-50 rounded-[2.5rem] shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1.5"
                  variants={cardVariants}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                >
                  <div 
                    className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6"
                    style={{ backgroundColor: `${v.color}15`, color: v.color }}
                  >
                    <ValueIcon size={28} />
                  </div>
                  <h3 className="text-xl font-black text-bg-dark mb-3 font-display">{v.title}</h3>
                  <p className="text-slate-500 text-xs font-medium leading-relaxed font-main">{v.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* TEAM / STAFF */}
      <section className="max-w-7xl mx-auto px-6 lg:px-10 py-16 space-y-16">
        <div className="text-center space-y-2">
          <h2 className="text-3xl lg:text-5xl font-display font-black text-bg-dark tracking-tight text-playful-shadow">El Equipo Zapatitos</h2>
          <p className="text-slate-500 font-medium max-w-md mx-auto font-main">Profesionales especializados en coordinar y animar.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {displayEmployees.map((member, idx) => (
            <div key={idx} className="bg-white rounded-3xl overflow-hidden border border-purple-50 shadow-sm text-center group hover:shadow-xl transition-all duration-300">
              <div className="h-56 bg-slate-100 overflow-hidden relative">
                <img src={member.img} alt={member.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              </div>
              <div className="p-6">
                <h4 className="font-black text-bg-dark text-lg leading-none font-display">{member.name}</h4>
                <p className="text-xs font-black text-primary uppercase tracking-widest mt-2 font-main">{member.role}</p>
                {member.desc && (
                  <p className="text-[10px] text-slate-400 font-medium leading-relaxed mt-2 line-clamp-2">{member.desc}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ADDITIONAL GALLERY */}
      {displayGallery.length > 0 && (
        <section className="max-w-7xl mx-auto px-6 lg:px-10 py-16 space-y-16">
          <div className="text-center space-y-2">
            <h2 className="text-3xl lg:text-5xl font-display font-black text-bg-dark tracking-tight text-playful-shadow">
              Instalaciones y Momentos
            </h2>
            <p className="text-slate-500 font-medium max-w-md mx-auto font-main">
              Explora más fotos de nuestro espacio y celebraciones felices.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {displayGallery.map((item, idx) => (
              <div key={idx} className="bg-white p-4 pb-8 rounded-[2.5rem] border border-purple-50 shadow-sm hover:shadow-xl transition-all duration-300">
                <div className="aspect-[4/3] rounded-3xl overflow-hidden bg-slate-100 mb-4">
                  <img src={item.img} alt={`Gallery ${idx + 1}`} className="w-full h-full object-cover" />
                </div>
                {item.desc && (
                  <p className="text-xs text-slate-500 font-medium leading-relaxed font-main px-2">
                    {item.desc}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* CALL TO ACTION */}
      <section className="max-w-7xl mx-auto px-6 lg:px-10">
        <div className="bg-slate-900 rounded-[3rem] p-10 lg:p-16 text-white text-center relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-84 h-84 bg-primary/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-pink-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative z-10 max-w-2xl mx-auto space-y-6">
            <h2 className="text-3xl lg:text-4xl font-display font-black text-white tracking-tight">¿Hacemos Magia Juntos?</h2>
            <p className="text-slate-400 text-sm font-medium leading-relaxed font-main">
              Consúltanos cualquier duda o ingresa directamente a nuestro calendario interactivo de disponibilidad para bloquear tu fecha favorita.
            </p>
            <div className="pt-4 flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                to="/reservar"
                className="px-10 py-5 bg-gradient-to-r from-primary to-pink-500 text-white rounded-[2rem] font-black uppercase tracking-widest text-xs shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <Calendar size={14} /> Reservar Online
              </Link>
              <Link 
                to="/contacto"
                className="px-10 py-5 bg-white/10 hover:bg-white/20 border border-white/10 text-white rounded-[2rem] font-black uppercase tracking-widest text-xs transition-all"
              >
                Preguntar por WhatsApp
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default SobreNosotrosPage;


import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, Users, Clock, ArrowRight, CheckCircle2, Sparkles, Gift, Calendar 
} from 'lucide-react';
import { paquetesService, type Paquete, type Servicio } from '../../services/paquetesService';
import { authService } from '../../services/authService';
import { getServiceImageFallback, getPackageImageFallback } from '../../utils/imageFallbacks';
import { configService } from '../../services/configService';



const colors = ['#ec4899', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

const ServiciosPaquetesPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'paquetes' | 'servicios'>('paquetes');
  const [paquetes, setPaquetes] = useState<Paquete[]>([]);
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [configs, setConfigs] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [serviceFilter, setServiceFilter] = useState<'todos' | 'base' | 'extra'>('todos');

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [pData, sData] = await Promise.all([
          paquetesService.getPaquetes(),
          paquetesService.getServicios()
        ]);
        setPaquetes(pData);
        setServicios(sData);
        configService.getLandingConfig()
          .then((items) => {
            const map: Record<string, string> = {};
            items.forEach((item) => { if (item.valor) map[item.clave] = item.valor; });
            setConfigs(map);
          })
          .catch(() => setConfigs({}));
      } catch (err) {
        console.error("Error al cargar paquetes y servicios", err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const handleSelectPackage = (pkgId: number) => {
    const targetPath = `/reservar?paqueteId=${pkgId}`;
    if (authService.isAuthenticated()) {
      navigate(targetPath);
    } else {
      navigate(`/cliente/login?redirect=${encodeURIComponent(targetPath)}`);
    }
  };

  // Filter logic
  const filteredServicios = servicios.filter(s => {
    const matchesSearch = s.nombre.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (s.descripcion && s.descripcion.toLowerCase().includes(searchQuery.toLowerCase()));
    
    if (serviceFilter === 'base') return matchesSearch && !s.esExtra;
    if (serviceFilter === 'extra') return matchesSearch && s.esExtra;
    return matchesSearch;
  });

  const filteredPaquetes = paquetes.filter(p => 
    p.nombre.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (p.descripcion && p.descripcion.toLowerCase().includes(searchQuery.toLowerCase()))
  );
  const currencySymbol = configs.currency_symbol || '$';

  return (
    <div className="min-h-screen bg-bg-main flex flex-col selection:bg-primary selection:text-white pt-24">

      {/* HERO SECTION */}
      <section className="relative py-16 text-center overflow-hidden bg-gradient-to-b from-bg-main to-purple-50/20">
        <div className="absolute top-10 left-1/4 w-32 h-32 bg-pink-100/50 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-5 right-1/4 w-40 h-40 bg-purple-100/50 rounded-full blur-3xl pointer-events-none" />
        
        <div className="max-w-3xl mx-auto px-6 space-y-4 relative z-10">
          <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary/10 rounded-full border border-primary/20 shadow-sm">
            <Sparkles size={12} className="text-primary animate-pulse" />
            <span className="text-[10px] font-black text-primary uppercase tracking-[0.25em]">Explora la Magia</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-display font-black text-bg-dark tracking-tight leading-none">
            Nuestros <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-pink-500">Paquetes y Servicios</span>
          </h1>
          <p className="text-slate-500 font-medium text-sm md:text-base max-w-xl mx-auto">
            Descubre todos los planes y complementos que tenemos listos para hacer de tu fiesta infantil un evento extraordinario.
          </p>
        </div>
      </section>

      {/* MAIN CONTAINER */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-6 lg:p-10 space-y-10">
        
        {/* TABS & SEARCH BAR */}
        <div className="flex flex-col md:flex-row gap-6 justify-between items-center bg-white p-6 rounded-[2rem] border border-purple-50/50 shadow-sm">
          <div className="flex p-1.5 bg-slate-100 rounded-2xl w-full md:w-auto">
            <button
              onClick={() => { setActiveTab('paquetes'); setSearchQuery(''); }}
              className={`flex-1 md:flex-none px-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${
                activeTab === 'paquetes' 
                  ? 'bg-white text-primary shadow-md' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <span className="flex items-center gap-1.5 justify-center">
                <Gift size={14} /> Paquetes
              </span>
            </button>
            <button
              onClick={() => { setActiveTab('servicios'); setSearchQuery(''); }}
              className={`flex-1 md:flex-none px-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${
                activeTab === 'servicios' 
                  ? 'bg-white text-primary shadow-md' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <span className="flex items-center gap-1.5 justify-center">
                <Sparkles size={14} /> Servicios
              </span>
            </button>
          </div>

          <div className="flex items-center gap-4 w-full md:w-auto">
            {/* Conditional service sub-filters */}
            {activeTab === 'servicios' && (
              <div className="hidden sm:flex p-1 bg-slate-100 rounded-xl">
                {[
                  { id: 'todos', label: 'Todos' },
                  { id: 'base', label: 'Básicos' },
                  { id: 'extra', label: 'Adicionales' }
                ].map(f => (
                  <button
                    key={f.id}
                    onClick={() => setServiceFilter(f.id as any)}
                    className={`px-4 py-2 rounded-lg font-bold text-xs transition-all ${
                      serviceFilter === f.id ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            )}

            <div className="relative flex-1 md:w-72">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                placeholder={activeTab === 'paquetes' ? 'Buscar paquetes...' : 'Buscar servicios...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-12 pr-4 py-3.5 text-sm font-medium outline-none focus:bg-white focus:border-primary transition-all"
              />
            </div>
          </div>
        </div>

        {/* CONTENT RENDERING */}
        {loading ? (
          <div className="py-32 flex flex-col items-center justify-center gap-4">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] animate-pulse">Sincronizando Catálogo...</p>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            
            {/* PAQUETES TAB */}
            {activeTab === 'paquetes' && (
              <motion.div
                key="paquetes-grid"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
                className="space-y-6"
              >
                {filteredPaquetes.length > 0 ? (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {filteredPaquetes.map((p) => (
                      <div 
                        key={p.id}
                        className="bg-white rounded-[3rem] border border-purple-50/50 shadow-sm hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500 flex flex-col overflow-hidden group hover:-translate-y-2"
                      >
                        <div className="h-60 relative bg-slate-100 overflow-hidden">
                          <img 
                            src={p.imagenUrl || getPackageImageFallback(p.nombre)} 
                            alt={p.nombre} 
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" 
                          />
                          <div className="absolute top-6 left-6 flex flex-col gap-2">
                            <span className="bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest text-slate-800 flex items-center gap-1.5 shadow-sm">
                              <Users size={12}/> Hasta {p.capacidadNinos} niños
                            </span>
                            <span className="bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest text-slate-800 flex items-center gap-1.5 shadow-sm">
                              <Clock size={12}/> {p.duracionHoras} Horas de Salón
                            </span>
                          </div>
                          <div className="absolute bottom-6 left-6">
                            <span className="text-3xl font-black text-white drop-shadow-md bg-black/20 px-3 py-1 rounded-2xl">{currencySymbol}{p.precioBase.toLocaleString()}</span>
                          </div>
                        </div>

                        <div className="p-8 flex-1 flex flex-col space-y-6">
                          <div className="space-y-2">
                            <h3 className="text-2xl font-black text-bg-dark group-hover:text-primary transition-colors tracking-tight">{p.nombre}</h3>
                            <p className="text-slate-500 text-sm font-medium leading-relaxed">{p.descripcion || "Una experiencia de celebración inolvidable."}</p>
                          </div>

                          {p.servicios && p.servicios.length > 0 && (
                            <div className="space-y-3 pt-6 border-t border-purple-50">
                              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Servicios Incluidos:</h4>
                              <ul className="grid grid-cols-1 gap-2.5 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                                {p.servicios.map((s, idx) => (
                                  <li key={idx} className="flex items-center gap-2.5">
                                    <div className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center shrink-0">
                                      <CheckCircle2 size={12} />
                                    </div>
                                    <span className="text-xs font-bold text-slate-600 line-clamp-1">
                                      {s.cantidad > 1 ? `${s.cantidad}x ` : ''}{s.nombre}
                                    </span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          <button 
                            onClick={() => handleSelectPackage(p.id)}
                            className="w-full py-4.5 bg-slate-900 text-white rounded-[1.8rem] font-black uppercase tracking-widest text-xs hover:bg-primary transition-all shadow-md mt-auto flex items-center justify-center gap-2"
                          >
                            Reservar con este paquete <ArrowRight size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-20 bg-white border border-dashed border-purple-100 rounded-3xl text-slate-400 font-bold">
                    No se encontraron paquetes que coincidan con tu búsqueda.
                  </div>
                )}
              </motion.div>
            )}

            {/* SERVICIOS TAB */}
            {activeTab === 'servicios' && (
              <motion.div
                key="servicios-grid"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
                className="space-y-6"
              >
                {filteredServicios.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {filteredServicios.map((s, i) => {
                      const color = colors[i % colors.length];
                      return (
                        <div 
                          key={s.id}
                          className="group bg-white rounded-[2.5rem] border border-purple-50/50 p-6 flex flex-col shadow-sm hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500 hover:-translate-y-2 relative overflow-hidden"
                        >
                          <div className="absolute -top-8 -right-8 w-20 h-20 rounded-full opacity-0 group-hover:opacity-10 transition-opacity duration-500" style={{ backgroundColor: color }} />
                          
                          {/* Dynamic Service Card Image */}
                          <div className="h-40 w-full rounded-2xl bg-slate-100 overflow-hidden mb-5 relative border border-purple-50/50">
                            <img 
                              src={s.imagenUrl || getServiceImageFallback(s.nombre)} 
                              alt={s.nombre} 
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                            />
                          </div>

                          <div className="space-y-2 mb-6 flex-1">
                            <h3 className="font-black text-bg-dark tracking-tight leading-tight group-hover:text-primary transition-colors">{s.nombre}</h3>
                            <p className="text-slate-500 text-xs font-medium leading-relaxed line-clamp-3">{s.descripcion || "Complemento mágico para personalizar tu evento."}</p>
                          </div>

                          <div className="pt-4 border-t border-purple-50 flex items-center justify-between mt-auto">
                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-2 py-1 rounded-md">
                              {s.esExtra ? 'Servicio Extra' : 'Servicio Base'}
                            </span>
                            <span className="text-base font-black text-primary">{currencySymbol}{s.costoBase.toLocaleString()}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-20 bg-white border border-dashed border-purple-100 rounded-3xl text-slate-400 font-bold">
                    No se encontraron servicios que coincidan con tu búsqueda.
                  </div>
                )}
              </motion.div>
            )}

          </AnimatePresence>
        )}

        {/* CALL TO ACTION */}
        <section className="bg-slate-900 rounded-[3rem] p-10 lg:p-16 text-white text-center relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-84 h-84 bg-primary/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-pink-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative z-10 max-w-2xl mx-auto space-y-6">
            <h2 className="text-3xl lg:text-4xl font-display font-black text-white tracking-tight">¿Listo para Planificar la Fiesta de sus Sueños?</h2>
            <p className="text-slate-400 text-sm font-medium leading-relaxed">
              Reserva tu fecha y diseña paso a paso una celebración inolvidable para los pequeños. El equipo de Zapatitos se encargará de todo.
            </p>
            <div className="pt-4">
              <Link 
                to="/reservar"
                className="inline-flex items-center gap-3 px-10 py-5 bg-gradient-to-r from-primary to-pink-500 text-white rounded-[2rem] font-black uppercase tracking-widest text-xs shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
              >
                <Calendar size={14} /> Iniciar Proceso de Reserva <ArrowRight size={16} className="ml-1" />
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default ServiciosPaquetesPage;

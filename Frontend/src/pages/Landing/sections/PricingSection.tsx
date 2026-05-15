import { motion } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';

interface Package {
  name: string;
  price: string;
  features: string[];
  recommended: boolean;
}

interface PricingSectionProps {
  packages?: Package[];
}

const defaultPackages = [
  { name: 'Básico', price: '299', recommended: false, features: ['3 horas de salón', 'Invitaciones digitales', 'Asistencia básica', 'Limpieza incluida'] },
  { name: 'Premium', price: '499', recommended: true, features: ['5 horas de salón', 'Decoración temática', 'Catering infantil', 'Show de magia', 'Piñata premium'] },
  { name: 'VIP', price: '899', recommended: false, features: ['Día completo', 'Todo incluido', 'Show personalizado', 'Área VIP padres', 'Mesa de dulces'] }
];

const PricingSection = ({ packages }: PricingSectionProps) => {
  const displayPackages = (packages && packages.length > 0) ? packages : defaultPackages;
  return (
    <section id="paquetes" className="py-32 bg-white overflow-hidden relative">
      {/* DECO */}
      <div className="absolute top-1/2 left-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -translate-x-1/2" />
      
      <div className="container mx-auto px-6 relative z-10">
        <motion.div 
          className="max-w-2xl mx-auto text-center space-y-4 mb-20"
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <div className="inline-block px-4 py-2 bg-primary/10 rounded-full border border-primary/20">
            <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Planes & Precios</span>
          </div>
          <h2 className="text-4xl lg:text-5xl font-display font-black text-bg-dark tracking-tight">Elige el Paquete Perfecto</h2>
          <p className="text-slate-500 font-medium">Opciones flexibles diseñadas para cada tipo de celebración.</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {displayPackages.map((pkg, i) => (
            <motion.div 
              key={i} 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.2 }}
              className={`
                relative p-10 rounded-[3rem] border transition-all duration-500 flex flex-col group
                ${pkg.recommended 
                  ? 'bg-bg-dark border-bg-dark shadow-2xl shadow-slate-900/20 scale-105 z-20' 
                  : 'bg-white border-slate-100 shadow-sm hover:shadow-xl z-10'}
              `}
            >
              {pkg.recommended && (
                <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-primary text-white px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-primary/20 animate-bounce">
                  Más Elegido
                </div>
              )}
              
              <div className="mb-10 space-y-4 text-center">
                <h3 className={`text-xl font-black uppercase tracking-widest ${pkg.recommended ? 'text-primary' : 'text-slate-400'}`}>
                  {pkg.name}
                </h3>
                <div className={`flex items-center justify-center gap-1 ${pkg.recommended ? 'text-white' : 'text-bg-dark'}`}>
                  <span className="text-2xl font-bold opacity-50">$</span>
                  <span className="text-6xl font-black tracking-tighter">{pkg.price}</span>
                  <span className="text-sm font-bold opacity-50 uppercase tracking-widest ml-2">/ Evento</span>
                </div>
              </div>

              <ul className="flex-1 space-y-5 mb-10">
                {pkg.features.map((feat, fi) => (
                  <li key={fi} className="flex items-center gap-4">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${pkg.recommended ? 'bg-primary/20 text-primary' : 'bg-slate-50 text-emerald-500'}`}>
                      <CheckCircle2 size={14} />
                    </div>
                    <span className={`text-sm font-bold ${pkg.recommended ? 'text-slate-300' : 'text-slate-600'}`}>
                      {feat}
                    </span>
                  </li>
                ))}
              </ul>

              <button className={`
                w-full py-5 rounded-2xl font-black uppercase tracking-widest text-xs transition-all active:scale-95
                ${pkg.recommended 
                  ? 'bg-primary text-white shadow-lg shadow-primary/20 hover:bg-primary-hover' 
                  : 'bg-slate-50 text-slate-700 hover:bg-bg-dark hover:text-white'}
              `}>
                Seleccionar {pkg.name}
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PricingSection;

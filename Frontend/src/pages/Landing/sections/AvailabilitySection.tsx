import { motion } from 'framer-motion';
import AvailabilityCalendar from '../components/AvailabilityCalendar';

const AvailabilitySection = () => {
  return (
    <section id="disponibilidad" className="py-32 bg-slate-50 overflow-hidden">
      <div className="container mx-auto px-6">
        <motion.div 
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1 }}
          className="bg-white rounded-[3.5rem] p-10 lg:p-20 shadow-premium border border-white flex flex-col lg:flex-row items-center gap-16"
        >
          <div className="flex-1 space-y-8">
            <div className="inline-block px-4 py-2 bg-primary/10 rounded-full border border-primary/20">
              <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Disponibilidad Inmediata</span>
            </div>
            <h2 className="text-4xl lg:text-5xl font-display font-black text-bg-dark tracking-tight leading-tight">
              ¿Cuándo es tu <br /> Próximo Evento?
            </h2>
            <p className="text-lg text-slate-500 font-medium leading-relaxed">
              Consulta nuestra disponibilidad en tiempo real. Selecciona una fecha 
              y descubre los turnos disponibles para tu celebración.
            </p>
            
            <div className="grid grid-cols-2 gap-8 pt-8 border-t border-slate-50">
              <div className="space-y-1">
                <span className="text-4xl font-black text-bg-dark tracking-tighter">98%</span>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Satisfacción</p>
              </div>
              <div className="space-y-1">
                <span className="text-4xl font-black text-bg-dark tracking-tighter">+2k</span>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Eventos Exitosos</p>
              </div>
            </div>
          </div>
          
          <div className="flex-1 w-full max-w-md">
            <div className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100 shadow-inner">
              <AvailabilityCalendar />
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default AvailabilitySection;

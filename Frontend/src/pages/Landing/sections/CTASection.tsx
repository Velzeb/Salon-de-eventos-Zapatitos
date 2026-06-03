import { ArrowRight, MessageCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

interface CTASectionProps {
  title?: string;
  subtitle?: string;
  primaryText?: string;
  secondaryText?: string;
}

const CTASection = ({ title, subtitle, primaryText, secondaryText }: CTASectionProps) => {
  return (
    <section className="py-20 bg-white overflow-hidden">
      <div className="container mx-auto px-6">
        <div className="relative bg-bg-dark rounded-[4rem] p-12 lg:p-24 overflow-hidden shadow-2xl">
          {/* DECO */}
          <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-br from-primary/20 to-transparent pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-primary/20 rounded-full blur-[100px] pointer-events-none" />
          
          <div className="relative z-10 max-w-3xl mx-auto text-center space-y-10">
            <h2 className="text-4xl lg:text-6xl font-display font-black text-white tracking-tight leading-tight">
              {title || '¿Listo para organizar un evento inolvidable?'}
            </h2>
            <p className="text-lg lg:text-xl text-slate-400 font-medium leading-relaxed">
              {subtitle || 'Únete a cientos de familias que ya disfrutan de la mejor experiencia en planificación y ejecución de eventos.'}
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <Link to="/reservar" className="w-full sm:w-auto btn-primary-glow flex items-center justify-center gap-3 px-10 py-6">
                <span className="font-black uppercase tracking-widest text-sm">{primaryText || 'Comenzar Ahora'}</span>
                <ArrowRight size={20} />
              </Link>
              <Link to="/contacto" className="w-full sm:w-auto bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all rounded-[2rem] px-10 py-6 flex items-center justify-center gap-3 group">
                <MessageCircle size={20} className="group-hover:scale-110 transition-transform" />
                <span className="font-black uppercase tracking-widest text-sm">{secondaryText || 'Hablar con un asesor'}</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;

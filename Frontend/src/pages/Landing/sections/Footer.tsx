import { Mail, Phone, Heart, Share2, Globe } from 'lucide-react';

interface FooterProps {
  phone?: string;
  email?: string;
  address?: string;
  instagram?: string;
  facebook?: string;
}

const Footer = ({ phone, email, instagram, facebook }: FooterProps) => {
  return (
    <footer className="bg-slate-50 border-t border-slate-100 pt-20 pb-10 overflow-hidden">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-20 mb-20">
          <div className="space-y-6">
            <div className="flex flex-col">
              <span className="text-2xl font-display font-black text-bg-dark tracking-tighter leading-none">Zapatitos</span>
              <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mt-1">Salón de Eventos</span>
            </div>
            <p className="text-sm text-slate-500 font-medium leading-relaxed">
              Transformando celebraciones en momentos mágicos e inolvidables desde hace más de 10 años.
            </p>
            <div className="flex items-center gap-4 pt-2">
               <a href={`mailto:${email}`} className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:bg-primary hover:text-white hover:border-primary transition-all duration-300 shadow-sm">
                  <Mail size={18} />
               </a>
               <a href={`tel:${phone}`} className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:bg-primary hover:text-white hover:border-primary transition-all duration-300 shadow-sm">
                  <Phone size={18} />
               </a>
               {instagram && (
                 <a href={`https://instagram.com/${instagram}`} target="_blank" rel="noreferrer" className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:bg-[#E1306C] hover:text-white hover:border-[#E1306C] transition-all duration-300 shadow-sm">
                    <Share2 size={18} />
                 </a>
               )}
               {facebook && (
                 <a href={facebook} target="_blank" rel="noreferrer" className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:bg-[#4267B2] hover:text-white hover:border-[#4267B2] transition-all duration-300 shadow-sm">
                    <Globe size={18} />
                 </a>
               )}
            </div>
          </div>
          
          <div className="space-y-6">
            <h4 className="text-xs font-black text-bg-dark uppercase tracking-widest">Navegación</h4>
            <div className="flex flex-col gap-3">
              {['El Salón', 'Servicios', 'Paquetes', 'Contacto'].map((item) => (
                <a 
                  key={item}
                  href={`#${item.toLowerCase().replace(' ', '-')}`} 
                  className="text-sm font-bold text-slate-500 hover:text-primary transition-colors inline-block w-fit"
                >
                  {item}
                </a>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <h4 className="text-xs font-black text-bg-dark uppercase tracking-widest">Legal</h4>
            <div className="flex flex-col gap-3">
              {['Privacidad', 'Términos de Uso', 'Política de Reserva'].map((item) => (
                <a 
                  key={item}
                  href="#" 
                  className="text-sm font-bold text-slate-500 hover:text-primary transition-colors inline-block w-fit"
                >
                  {item}
                </a>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <h4 className="text-xs font-black text-bg-dark uppercase tracking-widest">Horarios</h4>
            <div className="space-y-3">
              <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm space-y-1">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Lunes a Viernes</p>
                <p className="text-sm font-black text-bg-dark">09:00 — 18:00</p>
              </div>
              <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm space-y-1 border-l-4 border-l-primary">
                <p className="text-[10px] font-black text-primary uppercase tracking-widest">Sábados y Domingos</p>
                <p className="text-sm font-black text-bg-dark">10:00 — 22:00</p>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-10 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest">
            © 2026 Zapatitos. Todos los derechos reservados.
          </p>
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
            Hecho con <Heart size={14} className="text-rose-500 fill-rose-500 animate-pulse" /> para familias felices
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

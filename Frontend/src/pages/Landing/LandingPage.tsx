import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { configService } from '../../services/configService';
import { authService } from '../../services/authService';
import logo from '../../assets/logoZapatitos.webp';

// Modular Sections
import HeroSection from './sections/HeroSection';
import ServicesSection from './sections/ServicesSection';
import SalonGallery from './sections/SalonGallery';
import AvailabilitySection from './sections/AvailabilitySection';
import PricingSection from './sections/PricingSection';
import TestimonialsSection from './sections/TestimonialsSection';
import FAQSection from './sections/FAQSection';
import AboutUsSection from './sections/AboutUsSection';
import ContactSection from './sections/ContactSection';
import CTASection from './sections/CTASection';
import Footer from './sections/Footer';

const LandingPage = () => {
  const [configs, setConfigs] = useState<Record<string, string>>({
    hero_title: 'Zapatitos — Magia en cada evento',
    hero_subtitle: 'Donde la Diversión encuentra la Elegancia',
    hero_image: '',
    promo_banner: '',
    contact_email: 'contacto@zapatitos.com',
    contact_phone: '+1 (555) 123-4567',
    contact_address: 'Calle de la Diversión 123, Ciudad Mágica',
    social_instagram: '',
    social_facebook: ''
  });
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);

    const loadConfig = async () => {
      try {
        const data = await configService.getLandingConfig();
        const map: Record<string, string> = {};
        data.forEach(d => { if(d.valor) map[d.clave] = d.valor; });
        setConfigs(prev => ({ ...prev, ...map }));
      } catch (err) {
        // Defaults are fine
      }
    };
    loadConfig();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="bg-white selection:bg-primary selection:text-white">
      {/* PROMO BANNER */}
      {configs.promo_banner && (
        <div className="bg-bg-dark py-2.5 px-6 relative z-[110]">
          <p className="text-[9px] font-black text-white text-center uppercase tracking-[0.3em] animate-pulse">
            {configs.promo_banner}
          </p>
        </div>
      )}

      {/* HEADER STICKY */}
      <header 
        className={`
          fixed inset-x-0 z-[100] transition-all duration-500
          ${configs.promo_banner ? (scrolled ? 'top-0' : 'top-[36px]') : 'top-0'}
          ${scrolled ? 'bg-white/80 backdrop-blur-xl border-b border-slate-100 py-3 shadow-premium' : 'bg-transparent py-6'}
          ${mobileMenuOpen ? 'bg-white h-screen top-0' : 'h-auto'}
        `}
      >
        <div className="container mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-3 group cursor-pointer">
            <div className="w-12 h-12 bg-white rounded-2xl shadow-xl shadow-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <img src={logo} alt="Zapatitos" className="w-8 h-8 object-contain" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-display font-black text-bg-dark tracking-tighter leading-none">Zapatitos</span>
              <span className="text-[9px] font-black text-primary uppercase tracking-[0.2em]">Salón de Eventos</span>
            </div>
          </div>

          <nav className={`
            hidden lg:flex items-center gap-8
          `}>
            {['Salón', 'Servicios', 'Nosotros', 'Paquetes', 'Contacto'].map((item) => (
              <a 
                key={item}
                href={`#${item.toLowerCase().replace(' ', '-')}`} 
                className="text-sm font-bold text-slate-600 hover:text-primary transition-colors relative group"
              >
                {item}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary group-hover:w-full transition-all duration-300" />
              </a>
            ))}
            <div className="h-4 w-[1px] bg-slate-200" />
            {!authService.isAuthenticated() ? (
              <Link 
                to="/cliente/login" 
                className="bg-bg-dark text-white px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-widest hover:bg-primary hover:scale-105 active:scale-95 transition-all shadow-lg shadow-slate-900/10"
              >
                Mi Reserva
              </Link>
            ) : (
              <Link 
                to={authService.hasRole(['Administrador', 'Empleado']) ? "/admin" : "/cliente"} 
                className="bg-primary text-white px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-widest hover:bg-bg-dark hover:scale-105 active:scale-95 transition-all shadow-lg shadow-primary/10"
              >
                {authService.hasRole(['Administrador', 'Empleado']) ? "Panel de Control" : "Mi Perfil"}
              </Link>
            )}
          </nav>

          <button 
            className="lg:hidden w-12 h-12 flex items-center justify-center text-slate-700 bg-slate-50 rounded-2xl active:scale-90 transition-all"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>

        {/* MOBILE MENU */}
        {mobileMenuOpen && (
          <div className="lg:hidden absolute top-[100%] inset-x-0 bg-white border-t border-slate-100 p-8 flex flex-col gap-6 animate-in slide-in-from-top duration-500">
            {['Salón', 'Servicios', 'Nosotros', 'Paquetes', 'Contacto'].map((item) => (
              <a 
                key={item}
                href={`#${item.toLowerCase().replace(' ', '-')}`} 
                className="text-2xl font-black text-bg-dark tracking-tighter hover:text-primary transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                {item}
              </a>
            ))}
            {!authService.isAuthenticated() ? (
              <Link 
                to="/cliente/login" 
                className="mt-4 bg-primary text-white text-center py-5 rounded-3xl font-black uppercase tracking-widest text-sm shadow-xl shadow-primary/20"
                onClick={() => setMobileMenuOpen(false)}
              >
                Mi Reserva
              </Link>
            ) : (
              <Link 
                to={authService.hasRole(['Administrador', 'Empleado']) ? "/admin" : "/cliente"} 
                className="mt-4 bg-bg-dark text-white text-center py-5 rounded-3xl font-black uppercase tracking-widest text-sm shadow-xl shadow-slate-900/20"
                onClick={() => setMobileMenuOpen(false)}
              >
                {authService.hasRole(['Administrador', 'Empleado']) ? "Panel de Control" : "Mi Perfil"}
              </Link>
            )}
          </div>
        )}
      </header>

      <main>
        <HeroSection 
          title={configs.hero_title} 
          subtitle={configs.hero_subtitle} 
          image={configs.hero_image} 
        />
        <ServicesSection />
        <SalonGallery />
        <AboutUsSection />
        <AvailabilitySection />
        <PricingSection />
        <TestimonialsSection />
        <FAQSection />
        <ContactSection 
          phone={configs.contact_phone} 
          email={configs.contact_email} 
          address={configs.contact_address} 
        />
        <CTASection />
      </main>

      <Footer 
        phone={configs.contact_phone} 
        email={configs.contact_email} 
        address={configs.contact_address} 
        instagram={configs.social_instagram}
        facebook={configs.social_facebook}
      />
    </div>
  );
};

export default LandingPage;

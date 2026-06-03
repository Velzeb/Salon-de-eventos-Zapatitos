import { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from '../../pages/Landing/sections/Footer';
import { configService } from '../../services/configService';

export interface PublicLayoutContext {
  configs: Record<string, string>;
}

const PublicLayout = () => {
  const [configs, setConfigs] = useState<Record<string, string>>({
    hero_title: 'Zapatitos — Magia en cada evento',
    hero_subtitle: 'Donde la Diversión encuentra la Elegancia',
    hero_image: '',
    promo_banner: '',
    contact_email: 'contacto@zapatitos.com',
    contact_phone: '+1 (555) 123-4567',
    contact_address: 'Calle de la Diversión 123, Ciudad Mágica',
    contact_whatsapp: '',
    social_instagram: '',
    social_facebook: '',
    social_tiktok: '',
    business_hours_weekdays: '09:00 - 18:00',
    business_hours_weekend: '10:00 - 22:00',
    whatsapp_message_template: ''
  });

  useEffect(() => {
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
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-bg-main">
      {/* NAV BAR */}
      <Navbar promoBanner={configs.promo_banner} logoSrc={configs.website_logo} />

      {/* CONTENT */}
      <div className="flex-grow">
        <Outlet context={{ configs } satisfies PublicLayoutContext} />
      </div>

      {/* FOOTER */}
      <Footer 
        phone={configs.contact_phone} 
        email={configs.contact_email} 
        address={configs.contact_address} 
        whatsapp={configs.contact_whatsapp}
        instagram={configs.social_instagram}
        facebook={configs.social_facebook}
        tiktok={configs.social_tiktok}
        weekdaysHours={configs.business_hours_weekdays}
        weekendHours={configs.business_hours_weekend}
      />
    </div>
  );
};

export default PublicLayout;

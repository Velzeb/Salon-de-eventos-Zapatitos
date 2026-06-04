import { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from '../../pages/Landing/sections/Footer';
import { configService } from '../../services/configService';
import ChatbotWidget from '../chatbot/ChatbotWidget';
import { landingDefaults } from '../../constants/landingDefaults';

export interface PublicLayoutContext {
  configs: Record<string, string>;
}

const PublicLayout = () => {
  const [configs, setConfigs] = useState<Record<string, string>>(landingDefaults);

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
      <ChatbotWidget />
    </div>
  );
};

export default PublicLayout;

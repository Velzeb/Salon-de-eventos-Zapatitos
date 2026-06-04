import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { paquetesService } from '../../services/paquetesService';
import type { PublicLayoutContext } from '../../components/layout/PublicLayout';
import { landingDefaults } from '../../constants/landingDefaults';

// Modular Sections
import HeroSection from './sections/HeroSection';
import ServicesSection from './sections/ServicesSection';
import SalonGallery from './sections/SalonGallery';
import PastEventsSection from './sections/PastEventsSection';
import AvailabilitySection from './sections/AvailabilitySection';
import PricingSection from './sections/PricingSection';
import TestimonialsSection from './sections/TestimonialsSection';
import FAQSection from './sections/FAQSection';
import AboutUsSection from './sections/AboutUsSection';
import ContactSection from './sections/ContactSection';
import CTASection from './sections/CTASection';

const LandingPage = () => {
  const { configs } = useOutletContext<PublicLayoutContext>();
  const [paquetes, setPaquetes] = useState<any[]>([]);

  useEffect(() => {
    const loadPaquetes = async () => {
      try {
        const data = await paquetesService.getPaquetes();
        setPaquetes(data);
      } catch (err) {
        console.error('Error al cargar paquetes', err);
      }
    };
    loadPaquetes();
  }, []);

  return (
    <div className="bg-bg-main selection:bg-primary selection:text-white">
      <main>
        <HeroSection
          title={configs.hero_title || landingDefaults.hero_title}
          subtitle={configs.hero_subtitle || landingDefaults.hero_subtitle}
          image={configs.hero_image}
          badge={configs.hero_badge}
        />
        <ServicesSection />
        <SalonGallery
          title={configs.salon_title}
          description={configs.salon_description}
          featuresJson={configs.salon_features_json}
          imagesJson={configs.salon_images_json}
        />

        {/* Dynamic Announcement Banner in the middle of the web */}
        {configs.middle_banner_show === 'true' && (
          <div
            className="w-full py-8 text-center text-[var(--text-main)] shadow-inner relative overflow-hidden transition-all border-y border-purple-100/50"
            style={{ backgroundColor: configs.middle_banner_bg || '#ffb7b2' }}
          >
            {/* Playful animated bubbles on the sides */}
            <div className="absolute top-1/2 -translate-y-1/2 left-10 w-6 h-6 rounded-full bg-white/40 blur-[1px] animate-bounce pointer-events-none" />
            <div className="absolute top-1/3 left-1/3 w-3 h-3 rounded-full bg-white/50 animate-pulse pointer-events-none" />
            <div className="absolute bottom-4 right-12 w-8 h-8 rounded-full bg-white/30 blur-[1px] animate-bounce pointer-events-none" style={{ animationDelay: '1s' }} />

            <div className="container mx-auto px-6 relative z-10 flex flex-col md:flex-row items-center justify-center gap-6">
              <span className="font-display font-bold text-lg md:text-xl tracking-wide flex items-center gap-2">
                🎉 {configs.middle_banner_text || '¡Tenemos novedades especiales para tu evento!'} 🎉
              </span>
              {configs.middle_banner_link && (
                <a
                  href={configs.middle_banner_link}
                  className="px-6 py-2.5 bg-white text-[10px] font-black uppercase tracking-widest rounded-full hover:scale-105 transition-transform shadow-md hover:shadow-lg inline-block text-slate-800"
                >
                  Saber Más
                </a>
              )}
            </div>
          </div>
        )}

        <PastEventsSection eventsData={configs.past_events_json} />
        <AboutUsSection
          aboutUsImage={configs.about_us_image}
          title={configs.about_us_title}
          description={configs.about_us_description}
          yearsExperience={configs.about_us_years_experience}
          valuesJson={configs.about_us_values_json}
        />
        <TestimonialsSection testimonialsJson={configs.testimonials_json} />
        <AvailabilitySection
          title={configs.availability_title}
          subtitle={configs.availability_subtitle}
          satisfaction={configs.availability_satisfaction}
          eventsCount={configs.availability_events_count}
        />
        <PricingSection
          packages={paquetes}
          recommendedPackageId={configs.recommended_package_id}
          currencySymbol={configs.currency_symbol}
          currencyLabel={configs.currency_label}
        />
        <FAQSection faqsJson={configs.faqs_json} />
        <ContactSection
          phone={configs.contact_phone}
          email={configs.contact_email}
          address={configs.contact_address}
          whatsapp={configs.contact_whatsapp}
          instagram={configs.social_instagram}
          facebook={configs.social_facebook}
          tiktok={configs.social_tiktok}
          mapsEmbedUrl={configs.maps_embed_url}
          whatsappTemplate={configs.whatsapp_message_template}
        />
        <CTASection
          title={configs.final_cta_title}
          subtitle={configs.final_cta_subtitle}
          primaryText={configs.final_cta_primary_text}
          secondaryText={configs.final_cta_secondary_text}
        />
      </main>
    </div>
  );
};

export default LandingPage;

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Minus, HelpCircle } from 'lucide-react';

const defaultFaqs = [
  {
    q: "¿Con cuánta anticipación debo reservar?",
    a: "Recomendamos reservar con al menos 2 a 3 meses de anticipación, especialmente para fines de semana."
  },
  {
    q: "¿Qué incluye el paquete básico?",
    a: "Nuestro paquete básico incluye el uso del salón por 3 horas, decoración base, invitaciones digitales y personal de asistencia."
  },
  {
    q: "¿Puedo llevar mi propio catering?",
    a: "Sí, permitimos catering externo previo acuerdo, aunque contamos con opciones gastronómicas premium propias."
  },
  {
    q: "¿Tienen estacionamiento propio?",
    a: "Contamos con un área de estacionamiento vigilada con capacidad para 20 vehículos."
  }
];

interface FAQSectionProps {
  faqsJson?: string;
}

const FAQSection = ({ faqsJson }: FAQSectionProps) => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const displayFaqs = (() => {
    if (faqsJson) {
      try {
        const parsed = JSON.parse(faqsJson);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch {
        // fallback
      }
    }
    return defaultFaqs;
  })();

  return (
    <section className="py-32 bg-bg-main overflow-hidden">
      <div className="container mx-auto px-6">
        <div className="grid lg:grid-cols-5 gap-20 items-start">
          <div className="lg:col-span-2 space-y-8">
            <div className="inline-block px-4 py-2 bg-primary/10 rounded-full border border-primary/20">
              <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Soporte & Ayuda</span>
            </div>
            <h2 className="text-4xl lg:text-5xl font-display font-bold text-[var(--text-main)] tracking-tight leading-tight text-playful-shadow">
              ¿Tienes dudas? <br/>
              <span className="text-primary">Estamos para ayudarte</span>
            </h2>
            <p className="text-lg text-slate-500 font-medium leading-relaxed">
              Aquí tienes las respuestas a las preguntas más comunes. Si necesitas más información, no dudes en contactarnos.
            </p>
            <div className="hidden lg:flex items-center justify-center p-12 bg-purple-50/50 rounded-[3rem] border border-purple-100/30 shadow-inner-soft">
              <HelpCircle size={120} className="text-purple-200/70" strokeWidth={1} />
            </div>
          </div>

          <div className="lg:col-span-3 space-y-5">
            {displayFaqs.map((faq, idx) => (
              <div
                key={idx}
                className={`
                  border-2 transition-all duration-300 overflow-hidden cursor-pointer rounded-[2.2rem]
                  ${openIndex === idx
                    ? 'bg-gradient-to-br from-[#1e1b4b] to-[#120f35] border-transparent shadow-xl shadow-purple-950/15'
                    : 'bg-white border-purple-100/60 hover:border-primary-light/50 shadow-sm'}
                `}
                onClick={() => setOpenIndex(openIndex === idx ? null : idx)}
              >
                <div className="flex items-center justify-between p-8">
                  <span className={`text-lg font-display font-bold tracking-tight ${openIndex === idx ? 'text-white' : 'text-[var(--text-main)]'}`}>
                    {faq.q}
                  </span>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all shrink-0 ml-4 ${openIndex === idx ? 'bg-primary text-white rotate-180' : 'bg-purple-50 text-purple-400'}`}>
                    {openIndex === idx ? <Minus size={20} /> : <Plus size={20} />}
                  </div>
                </div>

                <AnimatePresence>
                  {openIndex === idx && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                    >
                      <div className="px-8 pb-8 pt-0">
                        <div className="h-[1px] w-full bg-white/10 mb-6" />
                        <p className="text-slate-300 font-medium leading-relaxed">
                          {faq.a}
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default FAQSection;

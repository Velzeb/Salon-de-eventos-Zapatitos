import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Minus, HelpCircle } from 'lucide-react';

const faqs = [
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

const FAQSection = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section className="py-32 bg-white overflow-hidden">
      <div className="container mx-auto px-6">
        <div className="grid lg:grid-cols-5 gap-20 items-start">
          <div className="lg:col-span-2 space-y-8">
            <div className="inline-block px-4 py-2 bg-primary/10 rounded-full border border-primary/20">
              <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Soporte & Ayuda</span>
            </div>
            <h2 className="text-4xl lg:text-5xl font-display font-black text-bg-dark tracking-tight leading-tight">
              ¿Tienes dudas? <br/>
              <span className="text-primary">Estamos para ayudarte</span>
            </h2>
            <p className="text-lg text-slate-500 font-medium leading-relaxed">
              Aquí tienes las respuestas a las preguntas más comunes. Si necesitas más información, no dudes en contactarnos.
            </p>
            <div className="hidden lg:flex items-center justify-center p-12 bg-slate-50 rounded-[3rem] border border-slate-100">
              <HelpCircle size={120} className="text-slate-200" strokeWidth={1} />
            </div>
          </div>

          <div className="lg:col-span-3 space-y-4">
            {faqs.map((faq, idx) => (
              <div 
                key={idx} 
                className={`
                  border rounded-[2rem] transition-all duration-300 overflow-hidden cursor-pointer
                  ${openIndex === idx ? 'bg-bg-dark border-bg-dark shadow-xl' : 'bg-white border-slate-100 hover:border-primary/30'}
                `}
                onClick={() => setOpenIndex(openIndex === idx ? null : idx)}
              >
                <div className="flex items-center justify-between p-8">
                  <span className={`text-lg font-black tracking-tight ${openIndex === idx ? 'text-white' : 'text-bg-dark'}`}>
                    {faq.q}
                  </span>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${openIndex === idx ? 'bg-primary text-white rotate-180' : 'bg-slate-50 text-slate-400'}`}>
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
                        <p className="text-slate-400 font-medium leading-relaxed">
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

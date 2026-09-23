import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

const faqs = [
  { question: '¿Cómo funciona Clipealo?', answer: 'Pegas el link de tu stream o una grabación pública de Zoom sin contraseña, o subes tu archivo. Nuestra IA analiza el video completo, detecta los mejores momentos y genera clips listos para publicar con subtítulos, títulos y score de viralidad.' },
  { question: '¿Qué plataformas soporta?', answer: 'Soportamos YouTube, Twitch, Kick, Facebook, Google Drive y grabaciones públicas de Zoom sin contraseña. También puedes subir un archivo de video directamente.' },
  { question: '¿Cuánto tarda en generar los clips?', answer: 'Depende de la duración del video, pero en promedio un stream de 2 horas se procesa en menos de 10 minutos. Recibirás tus clips listos para descargar.' },
  { question: '¿Los clips incluyen subtítulos?', answer: 'Sí. Los subtítulos se generan automáticamente y sincronizados. No se requiere edición manual.' },
  { question: '¿Clipealo funciona en español?', answer: 'Clipealo está entrenada específicamente en contenido en español latino. Entiende jerga local, modismos y contexto cultural de toda LATAM.' },
  { question: '¿Cuánto cuesta Clipealo?', answer: 'Hay un plan Free y planes de pago desde S/45 al mes. En el plan anual, Básico queda en S/36 al mes. Visita precios para comparar todos los planes.' },
];

const FAQSection = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  return (
    <section id="faq" className="brand-section bg-[#f0f5fc] dark:bg-[#101b34]">
      <div className="brand-container max-w-3xl">
        <header className="mb-10 text-center"><p className="eyebrow mb-4">Resolvemos tus dudas</p><h2 className="section-title">Preguntas frecuentes</h2></header>
        <div className="space-y-3">
          {faqs.map((faq, index) => (
            <div key={faq.question} className="brand-card overflow-hidden">
              <h3>
                <button aria-expanded={openIndex === index} aria-controls={`faq-answer-${index}`} onClick={() => setOpenIndex(openIndex === index ? null : index)} className="flex w-full items-center justify-between gap-4 px-5 py-5 text-left font-bold sm:px-6">
                  <span>{faq.question}</span><ChevronDown size={19} className={`shrink-0 transition-transform ${openIndex === index ? 'rotate-180' : ''}`} />
                </button>
              </h3>
              {openIndex === index && <div id={`faq-answer-${index}`} className="border-t border-border px-5 py-4 text-sm leading-7 text-muted-foreground sm:px-6">{faq.answer}</div>}
            </div>
          ))}
        </div>
        <p className="mt-9 text-center text-sm text-muted-foreground">
          Únete a nuestro <a href="https://discord.gg/XjhXBtaK6A" target="_blank" rel="noopener noreferrer" className="font-semibold text-primary underline underline-offset-2">Discord</a> o escríbenos a{' '}
          <a href="mailto:clipealoai@gmail.com" className="font-semibold text-primary underline underline-offset-2">clipealoai@gmail.com</a> si necesitas ayuda.
        </p>
      </div>
    </section>
  );
};

export default FAQSection;

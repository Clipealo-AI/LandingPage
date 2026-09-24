import marketing from '../../messages/es/marketing.json';
import { resourceItems } from '@/data/marketingNavigation';

const faqs = Object.values(marketing.faq.items);
const contactHref = resourceItems.find((item) => item.key === 'contact')?.href ?? 'mailto:contacto@clipealo.com';
const [contactIntro, contactRemainder = ''] = marketing.faq.contact.split('<link>');
const [contactLabel = '', contactOutro = ''] = contactRemainder.split('</link>');

const FAQSection = () => (
  <section id="faq" className="brand-section bg-secondary-color">
    <div className="brand-container max-w-3xl">
      <header className="mb-10 text-center">
        <p className="eyebrow mb-4">{marketing.routeMenu.resourceLinks.faq.label}</p>
        <h2 className="section-title">{marketing.faq.title.replace('<br></br>', ' ')}</h2>
      </header>
      <div className="space-y-3">
        {faqs.map((faq) => (
          <details key={faq.q} className="faq-item">
            <summary className="faq-question">{faq.q}</summary>
            <p className="px-5 pb-5 text-sm leading-7 text-muted-foreground sm:px-6">{faq.a}</p>
          </details>
        ))}
      </div>
      <p className="mt-9 text-center text-sm text-muted-foreground">
        {contactIntro}<a href={contactHref} className="font-semibold text-primary underline underline-offset-2">{contactLabel}</a>{contactOutro}
      </p>
    </div>
  </section>
);

export default FAQSection;

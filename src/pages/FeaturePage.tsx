import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronDown, ArrowLeft } from 'lucide-react';
import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import SEOHead from '@/components/SEOHead';
import { featurePages } from '@/data/featurePages';

const BASE_URL = 'https://www.clipealo-ai.com';

const FeaturePage = () => {
  const { slug } = useParams<{ slug: string }>();
  const page = featurePages.find((p) => p.slug === slug);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  if (!page) {
    return (
      <main className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Página no encontrada</h1>
          <Link to="/funciones" className="text-primary underline">Volver a funciones</Link>
        </div>
      </main>
    );
  }

  const canonicalPath = `/funciones/${page.slug}`;
  const fullUrl = `${BASE_URL}${canonicalPath}`;

  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: page.metaTitle,
    description: page.metaDescription,
    url: fullUrl,
    datePublished: page.isoDate,
    dateModified: page.isoDate,
    publisher: {
      '@type': 'Organization',
      name: 'Clipealo',
      url: BASE_URL,
    },
    inLanguage: 'es',
  };

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: page.faqs.map((f) => ({
      '@type': 'Question',
      name: f.question,
      acceptedAnswer: { '@type': 'Answer', text: f.answer },
    })),
  };

  const combinedJsonLd = [articleJsonLd, faqJsonLd];

  return (
    <main className="min-h-screen bg-background text-foreground">
      <SEOHead
        title={page.metaTitle}
        description={page.metaDescription}
        canonicalPath={canonicalPath}
        type="website"
        jsonLd={combinedJsonLd as unknown as Record<string, unknown>}
        publishedTime={page.isoDate}
        modifiedTime={page.isoDate}
      />
      <Header />

      <article className="pt-28 pb-20 px-4">
        <div className="max-w-3xl mx-auto">
          {/* Back link */}
          <Link
            to="/funciones"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Todas las funciones
          </Link>

          {/* Publication date */}
          <p className="text-sm text-muted-foreground mb-4">
            Publicado el {page.displayDate}
          </p>

          {/* H1 */}
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-foreground leading-tight mb-8">
            {page.h1}
          </h1>

          {/* Intro */}
          <p className="text-lg text-muted-foreground leading-relaxed mb-12">
            {page.intro}
          </p>

          {/* Sections */}
          {page.sections.map((section, i) => (
            <section key={i} className="mb-10">
              <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
                {section.heading}
              </h2>
              <div className="text-base text-muted-foreground leading-relaxed whitespace-pre-line">
                {section.content.split('\n\n').map((paragraph, j) => (
                  <div key={j} className="mb-4">
                    {paragraph.split('\n').map((line, k) => {
                      const boldProcessed = line.replace(
                        /\*\*(.*?)\*\*/g,
                        '<strong class="text-foreground font-semibold">$1</strong>'
                      );
                      return (
                        <p
                          key={k}
                          className={line.startsWith('- ') ? 'pl-4' : ''}
                          dangerouslySetInnerHTML={{ __html: boldProcessed }}
                        />
                      );
                    })}
                  </div>
                ))}
              </div>
            </section>
          ))}

          {/* Internal links */}
          <div className="flex flex-wrap gap-3 mb-12">
            {page.internalLinks.map((link, i) => (
              <Link
                key={i}
                to={link.href}
                className="inline-flex items-center px-4 py-2 rounded-full border border-border text-sm font-medium text-foreground hover:bg-muted/50 transition-colors"
              >
                {link.label} →
              </Link>
            ))}
          </div>

          {/* FAQ Section */}
          <section className="mt-16">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-6">
              Preguntas frecuentes
            </h2>
            <div className="space-y-3">
              {page.faqs.map((faq, index) => (
                <div key={index}>
                  <button
                    onClick={() => setOpenFaq(openFaq === index ? null : index)}
                    className="w-full flex items-center justify-between text-left bg-background border border-border rounded-2xl px-6 py-5 hover:border-muted-foreground/30 transition-colors"
                  >
                    <span className="text-base font-semibold text-foreground pr-4">
                      {faq.question}
                    </span>
                    <motion.div
                      animate={{ rotate: openFaq === index ? 180 : 0 }}
                      transition={{ duration: 0.3 }}
                      className="flex-shrink-0"
                    >
                      <ChevronDown className="w-5 h-5 text-muted-foreground" />
                    </motion.div>
                  </button>
                  <AnimatePresence>
                    {openFaq === index && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
                        <div className="px-6 py-4 text-sm text-muted-foreground leading-relaxed">
                          {faq.answer}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          </section>
        </div>
      </article>

      <Footer />
    </main>
  );
};

export default FeaturePage;
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import marketing from '../../messages/es/marketing.json';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import SEOHead from '@/components/SEOHead';
import { appUrl, featureItems } from '@/data/marketingNavigation';
import { trackLead } from '@/lib/tracking';
import { featurePages } from '@/data/featurePages';

const BASE_URL = 'https://www.clipealo-ai.com';

function inlineContent(line: string) {
  return line.split(/(\*\*.*?\*\*)/g).map((part, index) =>
    part.startsWith('**') && part.endsWith('**')
      ? <strong key={index}>{part.slice(2, -2)}</strong>
      : part,
  );
}

function ContentBlocks({ content }: { content: string }) {
  return (
    <div className="feature-copy">
      {content.split('\n\n').map((block, index) => {
        const lines = block.split('\n');
        const isList = lines.every((line) => line.startsWith('- '));
        return isList ? (
          <ul key={index}>
            {lines.map((line, lineIndex) => <li key={lineIndex}>{inlineContent(line.slice(2))}</li>)}
          </ul>
        ) : (
          <p key={index}>{lines.map((line, lineIndex) => (
            <span key={lineIndex}>{lineIndex > 0 && <br />}{inlineContent(line)}</span>
          ))}</p>
        );
      })}
    </div>
  );
}

const FeaturePage = () => {
  const { slug } = useParams<{ slug: string }>();
  const page = featurePages.find((entry) => entry.slug === slug);
  const feature = featureItems.find((entry) => entry.slug === slug);

  if (!page || !feature) {
    return (
      <main className="min-h-screen bg-background text-foreground">
        <Header />
        <section className="marketing-not-found reference-container">
          <h1>{marketing.featurePage.notFound}</h1>
          <Link to="/funciones" className="marketing-index-pricing"><ArrowLeft aria-hidden="true" />{marketing.featurePage.all}</Link>
        </section>
        <Footer />
      </main>
    );
  }

  const canonicalPath = `/funciones/${page.slug}`;
  const fullUrl = `${BASE_URL}${canonicalPath}`;
  const Icon = feature.icon;
  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: page.metaTitle,
      description: page.metaDescription,
      url: fullUrl,
      datePublished: page.isoDate,
      dateModified: page.isoDate,
      publisher: { '@type': 'Organization', name: 'Clipealo', url: BASE_URL },
      inLanguage: 'es',
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: page.faqs.map((faq) => ({
        '@type': 'Question',
        name: faq.question,
        acceptedAnswer: { '@type': 'Answer', text: faq.answer },
      })),
    },
  ];

  return (
    <main className="min-h-screen bg-background text-foreground">
      <SEOHead
        title={page.metaTitle}
        description={page.metaDescription}
        canonicalPath={canonicalPath}
        type="website"
        jsonLd={jsonLd as unknown as Record<string, unknown>}
        publishedTime={page.isoDate}
        modifiedTime={page.isoDate}
      />
      <Header />

      <article>
        <header className="marketing-detail-hero">
          <div className="reference-container">
            <Link to="/funciones" className="marketing-back-link"><ArrowLeft aria-hidden="true" />{marketing.featurePage.all}</Link>
            <div className="marketing-detail-title">
              <span className="marketing-feature-icon"><Icon aria-hidden="true" /></span>
              <p className="eyebrow">{feature.label}</p>
              <h1>{page.h1}</h1>
              <p className="marketing-detail-intro">{page.intro}</p>
              <div className="marketing-detail-actions">
                <a href={appUrl} onClick={() => trackLead(`Funcionalidad - ${feature.key}`)} className="reference-button reference-button-primary">
                  {marketing.featurePage.try}<ArrowRight aria-hidden="true" />
                </a>
                <time dateTime={page.isoDate}>{marketing.featurePage.published.replace('{date}', page.displayDate)}</time>
              </div>
            </div>
          </div>
        </header>

        <div className="marketing-detail-content reference-container">
          <div className="marketing-detail-sections">
            {page.sections.map((section) => (
              <section key={section.heading} className="marketing-detail-section">
                <h2>{section.heading}</h2>
                <ContentBlocks content={section.content} />
              </section>
            ))}
          </div>

          <nav className="marketing-detail-related" aria-label={marketing.routeMenu.features}>
            {page.internalLinks.map((related) => (
              <Link key={related.href} to={related.href}>{related.label}<ArrowRight aria-hidden="true" /></Link>
            ))}
          </nav>

          <section className="marketing-detail-faq">
            <h2>{marketing.featurePage.faq}</h2>
            {page.faqs.map((faq) => (
              <details key={faq.question}>
                <summary>{faq.question}</summary>
                <p>{faq.answer}</p>
              </details>
            ))}
          </section>
        </div>
      </article>

      <Footer />
    </main>
  );
};

export default FeaturePage;

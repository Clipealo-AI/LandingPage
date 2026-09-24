import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import marketing from '../../messages/es/marketing.json';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import SEOHead from '@/components/SEOHead';
import { featureItems } from '@/data/marketingNavigation';

const FeaturesIndexPage = () => (
  <main className="min-h-screen bg-background text-foreground">
    <SEOHead
      title={`${marketing.routeMenu.features} — Clipealo`}
      description={marketing.featureIndex.lead}
      canonicalPath="/funciones"
    />
    <Header />

    <section className="marketing-index-hero">
      <div className="reference-container">
        <p className="eyebrow">{marketing.featureIndex.eyebrow}</p>
        <h1 className="display-font text-balance">{marketing.featureIndex.title}</h1>
        <p className="marketing-index-lead">{marketing.featureIndex.lead}</p>
      </div>
    </section>

    <section className="marketing-index-content reference-container" aria-label={marketing.routeMenu.features}>
      <div className="marketing-feature-grid">
        {featureItems.map(({ icon: Icon, label, description, slug }) => (
          <Link key={slug} to={`/funciones/${slug}`} className="marketing-feature-card">
            <span className="marketing-feature-icon"><Icon aria-hidden="true" /></span>
            <h2>{label}</h2>
            <p>{description}</p>
            <span className="marketing-feature-more">{marketing.featurePage.try}<ArrowRight aria-hidden="true" /></span>
          </Link>
        ))}
      </div>
      <div className="marketing-index-action">
        <Link to="/precios" className="marketing-index-pricing">{marketing.featureIndex.pricing}<ArrowRight aria-hidden="true" /></Link>
      </div>
    </section>

    <Footer />
  </main>
);

export default FeaturesIndexPage;

import { useEffect, useState } from 'react';
import { ArrowRight, Play, Sparkles } from 'lucide-react';
import marketing from '../../messages/es/marketing.json';
import MarketingHeader from '@/components/MarketingHeader';
import { RubiusProductPreview } from '@/components/marketing/RubiusProductPreview';
import { appUrl } from '@/data/marketingNavigation';
import { trackLead } from '@/lib/tracking';

const ReferenceLandingHome = () => (
  <>
    <MarketingHeader />
    <ReferenceHero />
  </>
);

export default ReferenceLandingHome;

function ReferenceHero() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setPrefersReducedMotion(query.matches);
    update();
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);

  const titleLines = marketing.hero.title.split('<br></br>');

  return (
    <section className="reference-hero">
      <div className="reference-hero-pattern" aria-hidden="true" />
      <div className="reference-hero-glow" aria-hidden="true" />
      <div className="reference-hero-bottom-fade" aria-hidden="true" />
      <div className="reference-container reference-hero-content">
        <div className="reference-hero-copy">
          <div className="reference-hero-badge">
            <Sparkles aria-hidden="true" />
            <span>{marketing.hero.badge}</span>
          </div>
          <div className="reference-title-frame">
            <span className="reference-title-corner top-left" aria-hidden="true" />
            <span className="reference-title-corner top-right" aria-hidden="true" />
            <span className="reference-title-corner bottom-left" aria-hidden="true" />
            <span className="reference-title-corner bottom-right" aria-hidden="true" />
            <h1>{titleLines[0]}<br />{titleLines[1]}</h1>
          </div>
          <p className="reference-hero-description">{marketing.hero.description}</p>
          <div className="reference-hero-buttons">
            <a href={appUrl} onClick={() => trackLead('Hero - Subir un video')} className="reference-button reference-button-primary">
              {marketing.actions.upload} <ArrowRight aria-hidden="true" />
            </a>
            <a href="#como-funciona" className="reference-button reference-button-secondary">
              <Play aria-hidden="true" fill="currentColor" /> {marketing.hero.howItWorks}
            </a>
          </div>
          <p className="reference-hero-claim"><span>{marketing.claim}</span></p>
        </div>
        <RubiusProductPreview prefersReducedMotion={prefersReducedMotion} />
      </div>
    </section>
  );
}

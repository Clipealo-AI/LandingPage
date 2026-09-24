import { useEffect, useState } from 'react';
import { ArrowRight, Flame, Play, Sparkles } from 'lucide-react';
import marketing from '../../messages/es/marketing.json';
import MarketingHeader from '@/components/MarketingHeader';
import { appUrl } from '@/data/marketingNavigation';
import { trackLead } from '@/lib/tracking';

const clips = [
  { title: 'El error de contratar por zona horaria', score: 94 },
  { title: 'La regla de las tres reuniones', score: 88 },
  { title: 'Documentar es un acto de respeto', score: 81 },
];

function buildWaveform(bars: number, seed = 7, landmarks = [0.22, 0.55, 0.78]) {
  let state = seed >>> 0;
  const random = () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0xffffffff;
  };

  return Array.from({ length: bars }, (_, index) => {
    const position = index / (bars - 1);
    const peak = landmarks.reduce((sum, landmark) => sum + Math.exp(-(((position - landmark) * 9) ** 2)), 0);
    return Math.round(Math.min(1, 0.28 + random() * 0.3 + peak * 0.55) * 1000) / 1000;
  });
}

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
        <ProductPreview prefersReducedMotion={prefersReducedMotion} />
      </div>
    </section>
  );
}

function ProductPreview({ prefersReducedMotion }: { prefersReducedMotion: boolean }) {
  const peaks = buildWaveform(72, 21);

  return (
    <div className="reference-product-preview">
      <div className="reference-product-shell">
        <div className="reference-product-window">
          <div className="reference-product-main">
            <div className="reference-product-video" aria-label={marketing.hero.videoPreview}>
              <div className="reference-play-button" aria-hidden="true"><Play fill="currentColor" /></div>
            </div>
            <div className="reference-wave-card">
              <div className="reference-wave-heading"><span>{marketing.hero.detectedMoments}</span><span className="reference-score"><Flame aria-hidden="true" /> 94</span></div>
              <div className={`reference-waveform ${prefersReducedMotion ? 'is-reduced' : ''}`} aria-hidden="true">
                {peaks.map((height, index) => <span key={index} style={{ height: `${Math.max(6, height * 100)}%` }} />)}
                <i />
              </div>
            </div>
          </div>
          <ul className="reference-clip-list" aria-label={marketing.hero.suggestedClips}>
            {clips.map((clip, index) => (
              <li className="reference-clip-card" key={clip.title}>
                <span className={`reference-clip-thumb thumb-${index}`} aria-hidden="true" />
                <span className="reference-clip-copy">
                  <strong>{clip.title}</strong>
                  <small>{index === 2 ? '1:1' : '9:16'} · {marketing.hero.withCaptions}</small>
                </span>
                <span className="reference-score"><Flame aria-hidden="true" /> {clip.score}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

import { ArrowRight, Check, Video } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import marketing from '../../../messages/es/marketing.json';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import SEOHead from '@/components/SEOHead';
import type { LucideIcon } from 'lucide-react';

export interface MetricItem {
  value: string;
  label: string;
}

export interface ContentTypeItem {
  icon: LucideIcon;
  label: string;
  description: string;
}

export interface PlatformItem {
  name: string;
  note: string;
}

export interface SolutionStep {
  title: string;
  description: string;
}

export interface PlanItem {
  name: string;
  price: string;
  description: string;
  highlighted?: boolean;
}

export interface UseCasePageData {
  hero: {
    emoji: string;
    tagline: string;
    title: string;
    description: string;
    ctaText: string;
    ctaHref: string;
    image: string;
  };
  context?: {
    title: string;
    stat: string;
    description: string;
  };
  problem: {
    title: string;
    subtitle: string;
    description: string;
  };
  solution: {
    title?: string;
    steps: SolutionStep[];
  };
  highlight?: {
    title: string;
    description: string;
  };
  contentTypes: {
    title: string;
    items: ContentTypeItem[];
  };
  platforms?: {
    title: string;
    items: PlatformItem[];
  };
  metrics: MetricItem[];
  plans?: {
    title: string;
    items: PlanItem[];
  };
  bottomCTA: {
    title: string;
    subtitle: string;
    ctaText: string;
    ctaHref: string;
  };
}

function ActionLink({ href, children, className }: { href: string; children: React.ReactNode; className: string }) {
  return href.startsWith('http') ? (
    <a href={href} target="_blank" rel="noopener noreferrer" className={className}>{children}</a>
  ) : (
    <Link to={href} className={className}>{children}</Link>
  );
}

const UseCasePageTemplate = ({ data }: { data: UseCasePageData }) => {
  const location = useLocation();

  return (
    <main className="min-h-screen bg-background text-foreground">
      <SEOHead
        title={`${data.hero.title} — Clipealo`}
        description={data.hero.description}
        canonicalPath={location.pathname}
      />
      <Header />

      <header className="marketing-case-hero">
        <div className="reference-container marketing-case-layout">
          <div className="marketing-case-copy">
            <p className="marketing-case-eyebrow"><Video aria-hidden="true" />{data.hero.tagline}</p>
            <h1>{data.hero.title}</h1>
            <p className="marketing-case-description">{data.hero.description}</p>
            <ActionLink href={data.hero.ctaHref} className="reference-button reference-button-primary">
              {data.hero.ctaText}<ArrowRight aria-hidden="true" />
            </ActionLink>
          </div>
          <div className="marketing-case-image">
            <img src={data.hero.image} alt={data.hero.tagline} />
          </div>
        </div>
      </header>

      {data.context && (
        <section className="marketing-case-context">
          <div className="reference-container">
            <p className="marketing-case-stat">{data.context.stat}</p>
            <h2>{data.context.title}</h2>
            <p>{data.context.description}</p>
          </div>
        </section>
      )}

      <section className="marketing-case-problem reference-container">
        <div>
          <p className="eyebrow">{data.hero.tagline}</p>
          <h2>{data.problem.title}</h2>
          <p className="marketing-case-subtitle">{data.problem.subtitle}</p>
        </div>
        <p>{data.problem.description}</p>
      </section>

      <section className="marketing-case-section marketing-case-alt">
        <div className="reference-container">
          <h2>{data.solution.title}</h2>
          <div className="marketing-case-steps">
            {data.solution.steps.map((step, index) => (
              <article key={step.title} className="marketing-case-card">
                <span className="marketing-case-step">{String(index + 1).padStart(2, '0')}</span>
                <h3>{step.title}</h3>
                <p>{step.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {data.highlight && (
        <section className="marketing-case-highlight reference-container">
          <h2>{data.highlight.title}</h2>
          <p>{data.highlight.description}</p>
        </section>
      )}

      <section className="marketing-case-section reference-container">
        <h2>{data.contentTypes.title}</h2>
        <div className="marketing-case-grid">
          {data.contentTypes.items.map((item) => {
            const Icon = item.icon;
            return (
              <article key={item.label} className="marketing-case-card marketing-case-type">
                <Icon aria-hidden="true" />
                <div><h3>{item.label}</h3><p>{item.description}</p></div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="marketing-case-section marketing-case-alt">
        <div className="reference-container">
          <h2>{marketing.casePage.impact}</h2>
          <div className="marketing-case-metrics">
            {data.metrics.map((metric) => (
              <article key={metric.label} className="marketing-case-card">
                <p className="marketing-case-metric">{metric.value}</p>
                <p>{metric.label}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {data.platforms && (
        <section className="marketing-case-section reference-container">
          <h2>{data.platforms.title}</h2>
          <div className="marketing-case-grid">
            {data.platforms.items.map((platform) => (
              <article key={platform.name} className="marketing-case-card marketing-case-platform">
                <Check aria-hidden="true" />
                <div><h3>{platform.name}</h3><p>{platform.note}</p></div>
              </article>
            ))}
          </div>
        </section>
      )}

      {data.plans && (
        <section className="marketing-case-section marketing-case-alt">
          <div className="reference-container">
            <h2>{data.plans.title}</h2>
            <div className="marketing-case-plans">
              {data.plans.items.map((plan) => (
                <article key={plan.name} className={`marketing-case-card${plan.highlighted ? ' is-highlighted' : ''}`}>
                  <h3>{plan.name}</h3>
                  <p className="marketing-case-metric">{plan.price}</p>
                  <p>{plan.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="reference-closing-cta">
        <div className="reference-closing-cta-pattern" aria-hidden="true" />
        <div className="reference-closing-cta-content">
          <h2 className="display-font">{data.bottomCTA.title}</h2>
          <p>{data.bottomCTA.subtitle}</p>
          <ActionLink href={data.bottomCTA.ctaHref} className="reference-closing-cta-button">
            {data.bottomCTA.ctaText}<ArrowRight aria-hidden="true" />
          </ActionLink>
        </div>
      </section>

      <Footer />
    </main>
  );
};

export default UseCasePageTemplate;

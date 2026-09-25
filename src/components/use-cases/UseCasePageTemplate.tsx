import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowRight, Check } from 'lucide-react';
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

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

const stagger = {
  visible: { transition: { staggerChildren: 0.1 } },
};

const UseCasePageTemplate = ({ data }: { data: UseCasePageData }) => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleCTA = (href: string) => {
    if (href.startsWith('http')) {
      window.open(href, '_blank');
    } else {
      navigate(href);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SEOHead
        title={`${data.hero.title} — Clipealo`}
        description={data.hero.description}
        canonicalPath={location.pathname}
      />
      <Header />

      {/* Hero */}
      <section className="relative pt-28 md:pt-36 pb-16 md:pb-24 overflow-hidden">
        <div className="absolute inset-0 gradient-glow-bg" />
        <div className="absolute inset-0 grid-pattern opacity-30" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div initial="hidden" animate="visible" variants={stagger}>
              <motion.p variants={fadeUp} className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">
                {data.hero.emoji} {data.hero.tagline}
              </motion.p>
              <motion.h1 variants={fadeUp} className="text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight mb-6">
                <span className="gradient-text">{data.hero.title}</span>
              </motion.h1>
              <motion.p variants={fadeUp} className="text-lg md:text-xl text-muted-foreground leading-relaxed mb-8 max-w-xl">
                {data.hero.description}
              </motion.p>
              <motion.div variants={fadeUp}>
                <button
                  onClick={() => handleCTA(data.hero.ctaHref)}
                  className="btn-cta flex items-center gap-2"
                >
                  {data.hero.ctaText}
                  <ArrowRight className="w-5 h-5" />
                </button>
              </motion.div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="relative hidden lg:block"
            >
              <div className="rounded-2xl overflow-hidden border border-border shadow-2xl shadow-black/50">
                <img src={data.hero.image} alt={data.hero.tagline} className="w-full h-auto" />
              </div>
              <div className="absolute -inset-4 bg-gradient-to-r from-[hsl(var(--color-pink)/0.15)] to-[hsl(var(--color-purple)/0.15)] rounded-3xl blur-3xl -z-10" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Context / Market */}
      {data.context && (
        <section className="py-16 md:py-24 bg-secondary-color">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.3 }}
              variants={stagger}
              className="text-center"
            >
              <motion.p variants={fadeUp} className="text-5xl md:text-7xl font-extrabold gradient-text mb-6">
                {data.context.stat}
              </motion.p>
              <motion.h2 variants={fadeUp} className="text-2xl md:text-3xl font-bold mb-4">
                {data.context.title}
              </motion.h2>
              <motion.p variants={fadeUp} className="text-muted-foreground text-lg leading-relaxed max-w-3xl mx-auto">
                {data.context.description}
              </motion.p>
            </motion.div>
          </div>
        </section>
      )}

      {/* Problem */}
      <section className="py-16 md:py-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={stagger}
          >
            <motion.div variants={fadeUp} className="inline-block px-4 py-1.5 rounded-full border border-destructive/30 bg-destructive/10 text-destructive text-sm font-medium mb-6">
              El problema
            </motion.div>
            <motion.h2 variants={fadeUp} className="text-3xl md:text-4xl font-bold mb-4">
              {data.problem.title}
            </motion.h2>
            <motion.p variants={fadeUp} className="text-xl text-muted-foreground font-medium mb-4">
              {data.problem.subtitle}
            </motion.p>
            <motion.p variants={fadeUp} className="text-muted-foreground text-lg leading-relaxed max-w-3xl">
              {data.problem.description}
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* Solution */}
      <section className="py-16 md:py-24 bg-secondary-color">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={stagger}
          >
            <motion.div variants={fadeUp} className="inline-block px-4 py-1.5 rounded-full border border-accent/30 bg-accent/10 text-accent text-sm font-medium mb-6">
              La solución
            </motion.div>
            {data.solution.title && (
              <motion.h2 variants={fadeUp} className="text-3xl md:text-4xl font-bold mb-10">
                {data.solution.title}
              </motion.h2>
            )}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {data.solution.steps.map((step, i) => (
                <motion.div
                  key={i}
                  variants={fadeUp}
                  className="feature-card group"
                >
                  <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center text-foreground font-bold text-lg mb-4">
                    {i + 1}
                  </div>
                  <h3 className="text-lg font-bold mb-2">{step.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{step.description}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Highlight */}
      {data.highlight && (
        <section className="py-16 md:py-24">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.3 }}
              variants={stagger}
              className="relative p-8 md:p-12 rounded-2xl border border-secondary/30 bg-secondary/5"
            >
              <div className="absolute -inset-1 bg-gradient-to-r from-[hsl(var(--color-pink)/0.1)] to-[hsl(var(--color-purple)/0.1)] rounded-2xl blur-xl -z-10" />
              <motion.h2 variants={fadeUp} className="text-2xl md:text-3xl font-bold mb-4 gradient-text-pink-purple">
                {data.highlight.title}
              </motion.h2>
              <motion.p variants={fadeUp} className="text-muted-foreground text-lg leading-relaxed">
                {data.highlight.description}
              </motion.p>
            </motion.div>
          </div>
        </section>
      )}

      {/* Content Types */}
      <section className="py-16 md:py-24 bg-secondary-color">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={stagger}
          >
            <motion.h2 variants={fadeUp} className="text-3xl md:text-4xl font-bold mb-10">
              {data.contentTypes.title}
            </motion.h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.contentTypes.items.map((item, i) => {
                const Icon = item.icon;
                const colors = [
                  'text-[hsl(var(--color-pink))]',
                  'text-[hsl(var(--color-purple))]',
                  'text-[hsl(var(--color-cyan))]',
                  'text-[hsl(var(--color-blue))]',
                ];
                return (
                  <motion.div
                    key={i}
                    variants={fadeUp}
                    className="flex items-start gap-3 p-4 rounded-xl bg-card border border-border hover:border-border-hover transition-colors"
                  >
                    <Icon className={`w-5 h-5 mt-0.5 flex-shrink-0 ${colors[i % 4]}`} />
                    <div>
                      <p className="font-semibold text-sm">{item.label}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Metrics */}
      <section className="py-16 md:py-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={stagger}
          >
            <motion.h2 variants={fadeUp} className="text-3xl md:text-4xl font-bold mb-10 text-center">
              Métricas de impacto
            </motion.h2>
            <div className="grid sm:grid-cols-3 gap-6">
              {data.metrics.map((metric, i) => (
                <motion.div
                  key={i}
                  variants={fadeUp}
                  className="text-center p-6 rounded-2xl bg-card border border-border"
                >
                  <p className="text-3xl md:text-4xl font-extrabold gradient-text mb-2">{metric.value}</p>
                  <p className="text-sm text-muted-foreground">{metric.label}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Platforms */}
      {data.platforms && (
        <section className="py-16 md:py-24 bg-secondary-color">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.3 }}
              variants={stagger}
            >
              <motion.h2 variants={fadeUp} className="text-3xl md:text-4xl font-bold mb-8">
                {data.platforms.title}
              </motion.h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {data.platforms.items.map((platform, i) => (
                  <motion.div
                    key={i}
                    variants={fadeUp}
                    className="flex items-center gap-3 p-4 rounded-xl bg-card border border-border"
                  >
                    <Check className="w-5 h-5 text-accent flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-sm">{platform.name}</p>
                      <p className="text-xs text-muted-foreground">{platform.note}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>
      )}

      {/* Plans */}
      {data.plans && (
        <section className="py-16 md:py-24">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.3 }}
              variants={stagger}
            >
              <motion.h2 variants={fadeUp} className="text-3xl md:text-4xl font-bold mb-8">
                {data.plans.title}
              </motion.h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {data.plans.items.map((plan, i) => (
                  <motion.div
                    key={i}
                    variants={fadeUp}
                    className={`p-6 rounded-2xl border ${
                      plan.highlighted
                        ? 'border-secondary bg-secondary/5 shadow-lg shadow-[hsl(var(--color-purple)/0.2)]'
                        : 'border-border bg-card'
                    }`}
                  >
                    <h3 className="text-lg font-bold mb-1">{plan.name}</h3>
                    <p className="text-2xl font-extrabold gradient-text mb-3">{plan.price}</p>
                    <p className="text-sm text-muted-foreground">{plan.description}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>
      )}

      {/* Testimonial placeholder */}
      <section className="py-16 md:py-24 bg-secondary-color">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={fadeUp}
            className="p-8 md:p-12 rounded-2xl border border-border bg-card text-center"
          >
            <div className="w-16 h-16 rounded-full bg-muted mx-auto mb-4" />
            <p className="text-lg italic text-muted-foreground mb-4">
              "Próximamente — testimonios reales de usuarios de Clipealo."
            </p>
            <p className="text-sm text-muted-foreground">— Beta tester, Clipealo</p>
          </motion.div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-20 md:py-32 relative overflow-hidden">
        <div className="absolute inset-0 gradient-glow-bg" />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={stagger}
          >
            <motion.h2 variants={fadeUp} className="text-3xl md:text-5xl font-extrabold mb-4">
              {data.bottomCTA.title}
            </motion.h2>
            <motion.p variants={fadeUp} className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              {data.bottomCTA.subtitle}
            </motion.p>
            <motion.div variants={fadeUp}>
              <button
                onClick={() => handleCTA(data.bottomCTA.ctaHref)}
                className="btn-cta inline-flex items-center gap-2"
              >
                {data.bottomCTA.ctaText}
                <ArrowRight className="w-5 h-5" />
              </button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default UseCasePageTemplate;

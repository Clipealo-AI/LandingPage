import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Coins, Clock, ChevronDown, Upload } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import SEOHead from '@/components/SEOHead';
import { trackInitiateCheckout } from '@/lib/tracking';

interface FeatureGroup {
  title: string;
  items: Array<{ text: string; included?: boolean }>;
}

interface Plan {
  name: string;
  tagline: string;
  monthlyPEN: number;   // Soles per month
  monthlyUSD: number;   // USD per month
  annualPEN: number;    // Soles per month when billed annually
  annualUSD: number;    // USD per month when billed annually
  baseCredits: number;  // Base credits per month included
  configurable?: boolean; // Allow user to add extra credits
  cta: string;
  ctaHref: string;
  popular?: boolean;
  featured?: boolean;
  platforms: PlatformKey[];
  groups: FeatureGroup[];
}

type PlatformKey = 'youtube' | 'twitch' | 'kick' | 'facebook' | 'drive';

const PLATFORM_META: Record<PlatformKey, { label: string; color: string; render: () => JSX.Element }> = {
  youtube: {
    label: 'YouTube',
    color: '#FF0033',
    render: () => (
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
      </svg>
    ),
  },
  twitch: {
    label: 'Twitch',
    color: '#9146FF',
    render: () => (
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z" />
      </svg>
    ),
  },
  kick: {
    label: 'Kick',
    color: '#53FC18',
    render: () => (
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M0 0v24h7.06v-4.953h2.353v2.353h2.353V24h7.058v-4.953h-2.353v-2.353h-2.353v-2.353h-2.353v-2.353h2.353V9.589h2.353V7.236h2.353V2.353h-2.353V0h-7.058v2.353H9.413v2.353H7.06V7.06H4.706V0Z" />
      </svg>
    ),
  },
  facebook: {
    label: 'Facebook',
    color: '#1877F2',
    render: () => (
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    ),
  },
  drive: {
    label: 'Google Drive',
    color: '#1FA463',
    render: () => (
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M12.01 1.485c-2.082 0-3.754.02-3.743.047.01.02 1.708 3.001 3.774 6.62l3.76 6.574h3.76c2.081 0 3.753-.02 3.742-.047-.005-.02-1.708-3.001-3.775-6.62l-3.76-6.574zm-4.76 1.73a789.828 789.861 0 0 0-3.63 6.319L0 15.868l1.89 3.298 1.885 3.297 3.62-6.335 3.618-6.33-1.88-3.287C8.1 4.704 7.255 3.22 7.25 3.214zm2.259 12.653-.203.348c-.114.198-.96 1.672-1.88 3.287a423.93 423.948 0 0 1-1.698 2.97c-.01.026 3.24.042 7.222.042h7.244l1.796-3.157c.992-1.734 1.85-3.23 1.906-3.323l.104-.167z" />
      </svg>
    ),
  },
};

const plans: Plan[] = [
  {
    name: 'Free',
    tagline: 'Para probar Clipealo',
    monthlyPEN: 0,
    monthlyUSD: 0,
    annualPEN: 0,
    annualUSD: 0,
    baseCredits: 30,
    cta: 'Comenzar gratis',
    ctaHref: 'https://app.clipealo-ai.com/?utm_source=landing_organico&utm_medium=clic_boton',
    platforms: ['youtube'],
    groups: [
      {
        title: 'VOD',
        items: [
          { text: '30 min de procesamiento', included: true },
        ],
      },
      {
        title: 'EDITOR',
        items: [
          { text: 'Export 720p · 5 clips/mes', included: true },
          { text: 'Con marca de agua', included: true },
          { text: '500 MB storage', included: true },
        ],
      },
      {
        title: 'SOCIAL POSTING',
        items: [
          { text: '3 posts/mes · YT, FB, Kick…', included: true },
          { text: 'Sin scheduling', included: false },
        ],
      },
    ],
  },
  {
    name: 'Básico',
    tagline: 'Creadores en crecimiento',
    monthlyPEN: 45,
    monthlyUSD: 12.5,
    annualPEN: 36,
    annualUSD: 10,
    baseCredits: 300, configurable: true,
    cta: 'Empezar',
    ctaHref: 'https://app.clipealo-ai.com/plan',
    platforms: ['youtube', 'kick', 'twitch', 'manual'],
    groups: [
      {
        title: 'VOD',
        items: [
          { text: '5h de procesamiento', included: true },
        ],
      },
      {
        title: 'EDITOR',
        items: [
          { text: 'Export 1080p · 30 clips/mes', included: true },
          { text: 'Sin marca de agua', included: true },
          { text: '5 GB storage · 30 días', included: true },
        ],
      },
      {
        title: 'SOCIAL POSTING',
        items: [
          { text: '15 posts/mes · YT, FB, Kick…', included: true },
          { text: 'Sin scheduling', included: false },
        ],
      },
    ],
  },
  {
    name: 'Estándar',
    tagline: 'Creadores profesionales',
    monthlyPEN: 90,
    monthlyUSD: 25,
    annualPEN: 72,
    annualUSD: 20,
    baseCredits: 600, configurable: true,
    cta: 'Empezar',
    ctaHref: 'https://app.clipealo-ai.com/plan',
    popular: true,
    featured: true,
    platforms: ['youtube', 'kick', 'twitch', 'manual', 'facebook'],
    groups: [
      {
        title: 'VOD',
        items: [
          { text: '10h de procesamiento', included: true },
        ],
      },
      {
        title: 'EDITOR',
        items: [
          { text: 'Export 1080p · 100 clips/mes', included: true },
          { text: 'Sin marca de agua · Brand kit', included: true },
          { text: '20 GB storage · 90 días', included: true },
        ],
      },
      {
        title: 'SOCIAL POSTING',
        items: [
          { text: '50 posts/mes + scheduling', included: true },
          { text: 'Config. de público por red', included: true },
        ],
      },
      {
        title: 'ANALYTICS',
        items: [{ text: 'Analytics TikTok incluido', included: true }],
      },
    ],
  },
  {
    name: 'Premium',
    tagline: 'Agencias y equipos',
    monthlyPEN: 180,
    monthlyUSD: 50,
    annualPEN: 144,
    annualUSD: 40,
    baseCredits: 1200, configurable: true,
    cta: 'Empezar',
    ctaHref: 'https://app.clipealo-ai.com/plan',
    platforms: ['youtube', 'kick', 'twitch', 'manual', 'facebook', 'drive'],
    groups: [
      {
        title: 'VOD',
        items: [
          { text: '20h de procesamiento', included: true },
        ],
      },
      {
        title: 'EDITOR',
        items: [
          { text: 'Export 4K · ilimitado clips', included: true },
          { text: 'Sin marca de agua · Brand kit', included: true },
          { text: '100 GB storage · 90 días', included: true },
        ],
      },
      {
        title: 'SOCIAL POSTING',
        items: [
          { text: 'Ilimitado + scheduling', included: true },
          { text: 'Config. de público por red', included: true },
        ],
      },
      {
        title: 'ANALYTICS',
        items: [{ text: 'Analytics TikTok incluido', included: true }],
      },
    ],
  },
];

const enterprisePlan = {
  name: 'Empresarial',
  tagline: 'Agencias, publishers y marcas',
  cta: 'Contactar',
  ctaHref: 'mailto:contacto@clipealo.com',
  groups: [
    {
      title: 'INCLUYE',
      items: [
        { text: 'Todo lo del plan Premium', included: true },
        { text: 'Créditos según volumen negociado', included: true },
        { text: 'Multi-usuario y multi-canal', included: true },
        { text: 'Branding completo multi-marca', included: true },
        { text: 'SLA de procesamiento garantizado', included: true },
        { text: 'Clipero dedicado por vertical', included: true },
      ],
    },
    {
      title: 'EXTRAS',
      items: [
        { text: 'Flujo de aprobación de clips', included: true },
        { text: 'White label disponible', included: true },
      ],
    },
  ],
};

const PricingPage = () => {
  const [isAnnual, setIsAnnual] = useState(false);
  const [currency, setCurrency] = useState<'PEN' | 'USD'>('PEN');
  // Extra credits per plan (added on top of baseCredits)
  const [extraCredits, setExtraCredits] = useState<Record<string, number>>({});

  // Per-credit rate (matches credit pack pricing)
  const PER_CREDIT_PEN = 0.092;
  const PER_CREDIT_USD = 0.025;
  const EXTRA_STEPS = [0, 60, 180, 300, 600];

  const formatHours = (credits: number) => {
    const h = credits / 60;
    if (h < 1) return `${Math.round(h * 60)} min`;
    return Number.isInteger(h) ? `${h} h` : `${h.toFixed(1)} h`;
  };
  const fmt = (v: number) => (Number.isInteger(v) ? v.toString() : v.toFixed(2));

  const symbol = currency === 'PEN' ? 'S/' : '$';

  const planKeyMap: Record<string, string> = {
    'Básico': 'basico',
    'Estándar': 'estandar',
    'Premium': 'premium',
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SEOHead
        title="Precios — Planes Clipealo desde S/45/mes"
        description="Planes Clipealo para creadores, agencias y equipos. Desde S/45/mes. Clips automáticos con IA para TikTok, Reels y Shorts. Sin tarjeta de crédito."
        canonicalPath="/precios"
      />
      <Header />
      <main className="pt-28 pb-24 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Title */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-10"
          >
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
              Precios simples, sin sorpresas
            </h1>
            <p className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto">
              Elige el plan que se adapta a tu volumen. Cancela cuando quieras.
            </p>
          </motion.div>

          {/* Toggles */}
          <div className="flex flex-col items-center gap-3 mb-12">
            <div className="inline-flex items-center gap-3 bg-card border border-border rounded-full p-1">
              <button
                onClick={() => setIsAnnual(false)}
                className={`text-sm font-medium px-5 py-2 rounded-full transition-colors ${
                  !isAnnual ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Mensual
              </button>
              <button
                onClick={() => setIsAnnual(true)}
                className={`text-sm font-medium px-5 py-2 rounded-full transition-colors flex items-center gap-2 ${
                  isAnnual ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Anual
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  isAnnual ? 'bg-background/20 text-background' : 'bg-secondary/20 text-secondary'
                }`}>
                  20% off
                </span>
              </button>
            </div>

            <div className="inline-flex items-center bg-card border border-border rounded-full p-1">
              <button
                onClick={() => setCurrency('PEN')}
                className={`text-xs font-semibold px-4 py-1.5 rounded-full transition-colors ${
                  currency === 'PEN' ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                🇵🇪 Soles
              </button>
              <button
                onClick={() => setCurrency('USD')}
                className={`text-xs font-semibold px-4 py-1.5 rounded-full transition-colors ${
                  currency === 'USD' ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                🇺🇸 Dólares
              </button>
            </div>
          </div>

          {/* Plans grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
            {plans.map((plan, idx) => {
              const basePen = isAnnual ? plan.annualPEN : plan.monthlyPEN;
              const baseUsd = isAnnual ? plan.annualUSD : plan.monthlyUSD;
              const extra = extraCredits[plan.name] ?? 0;
              const pen = basePen + extra * PER_CREDIT_PEN;
              const usd = baseUsd + extra * PER_CREDIT_USD;
              const totalCredits = plan.baseCredits + extra;
              return (
                <motion.div
                  key={plan.name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.06 }}
                  className={`relative rounded-2xl p-7 flex flex-col bg-card transition-all ${
                    plan.featured
                      ? 'border-2 border-primary shadow-[0_0_50px_-12px_hsla(350,95%,62%,0.35)]'
                      : 'border border-border hover:border-border-hover'
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="px-3 py-1 text-[10px] font-bold tracking-wider uppercase rounded-full gradient-primary text-foreground">
                        Más popular
                      </span>
                    </div>
                  )}

                  {/* Header */}
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-1">{plan.name}</h3>
                    <p className="text-xs text-muted-foreground">{plan.tagline}</p>
                  </div>

                  {/* Price */}
                  <div className="mb-5 min-h-[80px]">
                    <div className="flex items-baseline gap-1.5" data-product-price={currency === 'PEN' ? pen : usd} data-currency={currency}>
                      <span className="text-4xl font-bold tracking-tight" data-price-value={currency === 'PEN' ? pen : usd}>
                        {symbol}{fmt(currency === 'PEN' ? pen : usd)}
                      </span>
                      <span className="text-sm text-muted-foreground">/mes</span>
                    </div>
                    {plan.monthlyPEN > 0 && (
                      <p className="text-xs text-muted-foreground mt-1.5">
                        {isAnnual ? 'Facturado anualmente' : 'Facturado mensualmente'}
                        {extra > 0 && ` · base ${symbol}${fmt(currency === 'PEN' ? basePen : baseUsd)} + ${extra} créd.`}
                      </p>
                    )}
                  </div>

                  {/* Credits configurator */}
                  <div className="mb-5">
                    <p className="text-[11px] text-muted-foreground mb-1.5">1 crédito = 1 minuto de video</p>
                    {plan.configurable ? (
                      <div className="relative">
                        <select
                          value={extra}
                          onChange={(e) => setExtraCredits((s) => ({ ...s, [plan.name]: Number(e.target.value) }))}
                          className="w-full appearance-none bg-background border border-border rounded-lg px-3 py-2.5 pr-9 text-sm font-medium text-foreground hover:border-border-hover focus:outline-none focus:border-primary cursor-pointer"
                        >
                          {EXTRA_STEPS.map((step) => {
                            const total = plan.baseCredits + step;
                            return (
                              <option key={step} value={step}>
                                {total.toLocaleString('es-PE')} créditos / mes · ≈ {formatHours(total)}
                              </option>
                            );
                          })}
                        </select>
                        <ChevronDown className="w-4 h-4 text-muted-foreground absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                    ) : (
                      <div className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm font-medium text-foreground/90 flex items-center gap-2">
                        <Coins className="w-4 h-4 text-primary" />
                        {totalCredits.toLocaleString('es-PE')} créditos / mes · ≈ {formatHours(totalCredits)}
                      </div>
                    )}
                  </div>

                  {/* CTA */}
                  <button
                    onClick={() => {
                      trackInitiateCheckout({
                        value: currency === 'PEN' ? pen : usd,
                        contentName: `Plan ${plan.name}`,
                        contentId: planKeyMap[plan.name] ?? plan.name.toLowerCase(),
                      });
                      window.location.href = plan.ctaHref;
                    }}
                    className={`w-full py-2.5 rounded-lg font-medium text-sm transition-all mb-6 ${
                      plan.featured
                        ? 'gradient-primary text-foreground hover:opacity-90'
                        : 'border border-border bg-background hover:bg-muted text-foreground'
                    }`}
                  >
                    {plan.cta}
                  </button>

                  {/* Feature groups */}
                  <div className="space-y-5 text-sm">
                    {plan.groups.map((group) => (
                      <div key={group.title}>
                        <p className="text-[10px] font-semibold tracking-[0.15em] text-muted-foreground/70 mb-2.5">
                          {group.title}
                        </p>
                        <ul className="space-y-2">
                          {group.items.map((item, i) => (
                            <li key={i} className="flex items-start gap-2.5">
                              {item.included !== false ? (
                                <span className="w-4 h-4 mt-0.5 flex-shrink-0 rounded-full bg-secondary/15 inline-flex items-center justify-center">
                                  <Check className="w-3 h-3 text-secondary" strokeWidth={3} />
                                </span>
                              ) : (
                                <span className="w-4 h-4 mt-0.5 flex-shrink-0 rounded-full bg-muted/40 inline-flex items-center justify-center">
                                  <XIcon className="w-3 h-3 text-muted-foreground/60" strokeWidth={3} />
                                </span>
                              )}
                              <span className={item.included === false ? 'text-muted-foreground/60 line-through decoration-muted-foreground/40' : 'text-foreground/90'}>
                                {item.text}
                              </span>
                            </li>
                          ))}
                        </ul>
                        {group.title === 'VOD' && plan.platforms.length > 0 && (
                          <div className="mt-3 flex flex-wrap items-center gap-2">
                            {plan.platforms.map((p) => {
                              const meta = PLATFORM_META[p];
                              return (
                                <span
                                  key={p}
                                  title={meta.label}
                                  aria-label={meta.label}
                                  className="w-7 h-7 rounded-md bg-background border border-border inline-flex items-center justify-center p-1.5"
                                  style={{ color: meta.color }}
                                >
                                  {meta.render()}
                                </span>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Enterprise */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="rounded-2xl border border-border bg-card p-8 md:p-10 mb-16"
          >
            <div className="grid md:grid-cols-3 gap-8 items-start">
              <div className="md:col-span-1">
                <span className="text-[10px] font-bold tracking-[0.2em] text-primary uppercase">
                  ● Empresarial
                </span>
                <h3 className="text-2xl font-bold mt-2 mb-2">{enterprisePlan.name}</h3>
                <p className="text-sm text-muted-foreground mb-5">{enterprisePlan.tagline}</p>
                <div className="mb-5">
                  <span className="text-3xl font-bold">A consultar</span>
                  <p className="text-xs text-muted-foreground mt-1.5">Propuesta personalizada en 24 horas.</p>
                </div>
                <a
                  href={enterprisePlan.ctaHref}
                  className="inline-flex items-center justify-center w-full md:w-auto px-6 py-2.5 rounded-lg font-medium text-sm gradient-primary text-foreground hover:opacity-90 transition-all"
                >
                  {enterprisePlan.cta} →
                </a>
              </div>
              <div className="md:col-span-2 grid sm:grid-cols-2 gap-6 text-sm">
                {enterprisePlan.groups.map((group) => (
                  <div key={group.title}>
                    <p className="text-[10px] font-semibold tracking-[0.15em] text-muted-foreground/70 mb-3">
                      {group.title}
                    </p>
                    <ul className="space-y-2.5">
                      {group.items.map((item, i) => (
                        <li key={i} className="flex items-start gap-2.5">
                          <Check className="w-4 h-4 mt-0.5 flex-shrink-0 text-secondary" strokeWidth={2.5} />
                          <span className="text-foreground/85">{item.text}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Credit packs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-12"
          >
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold mb-2">Paquetes de créditos</h2>
              <p className="text-sm text-muted-foreground">
                Recarga créditos cuando los necesites · 60 créditos = 1 hora de video
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 max-w-4xl mx-auto">
              {[
                { credits: 60, hours: 1, pen: 5.5, usd: 1.5 },
                { credits: 180, hours: 3, pen: 16.5, usd: 4.6 },
                { credits: 300, hours: 5, pen: 27.5, usd: 7.65, popular: true },
              ].map((pack) => (
                <div
                  key={pack.credits}
                  className={`relative rounded-2xl p-6 bg-card transition-all ${
                    pack.popular
                      ? 'border-2 border-primary'
                      : 'border border-border hover:border-border-hover'
                  }`}
                >
                  {pack.popular && (
                    <span className="absolute -top-2.5 right-4 px-2.5 py-0.5 text-[10px] font-bold rounded-full gradient-primary text-foreground">
                      Popular
                    </span>
                  )}
                  <div className="mb-3">
                    <span className="text-3xl font-bold text-primary">{pack.credits}</span>
                    <span className="text-sm text-muted-foreground ml-1.5">créditos</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-4">
                    <Clock className="w-3.5 h-3.5" />
                    <span>≈ {pack.hours} {pack.hours === 1 ? 'hora' : 'horas'}</span>
                  </div>
                  <div className="mb-5" data-product-price={currency === 'PEN' ? pack.pen : pack.usd} data-currency={currency}>
                    <span className="text-2xl font-bold" data-price-value={currency === 'PEN' ? pack.pen : pack.usd}>
                      {symbol}{currency === 'PEN' ? pack.pen.toFixed(2) : pack.usd.toFixed(2)}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      trackInitiateCheckout({
                        value: currency === 'PEN' ? pack.pen : pack.usd,
                        contentName: `${pack.credits} créditos`,
                        contentId: `credits_${pack.credits}`,
                      });
                      window.location.href = 'https://app.clipealo-ai.com/plan';
                    }}
                    className={`w-full py-2.5 rounded-lg font-medium text-sm transition-all ${
                      pack.popular
                        ? 'gradient-primary text-foreground hover:opacity-90'
                        : 'border border-border bg-background hover:bg-muted text-foreground'
                    }`}
                  >
                    Comprar
                  </button>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Footer note */}
          <p className="text-center text-xs text-muted-foreground">
            Todos los planes incluyen cancelación en cualquier momento · Pago seguro · Facturación en {currency === 'PEN' ? 'soles peruanos' : 'dólares estadounidenses'}
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default PricingPage;

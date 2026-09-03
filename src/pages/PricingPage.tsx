import { useState, Fragment } from 'react';
import { motion } from 'framer-motion';
import { Check, Coins, Clock, ChevronDown, Upload, X as XIcon } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import SEOHead from '@/components/SEOHead';
import { trackInitiateCheckout } from '@/lib/tracking';
import zoomIcon from '@/assets/icons/zoom.svg';

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

type PlatformKey = 'youtube' | 'twitch' | 'kick' | 'facebook' | 'drive' | 'zoom' | 'tiktok' | 'instagram' | 'linkedin' | 'x';

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
  zoom: {
    label: 'Zoom (grabaciones públicas)',
    color: '#0B5CFF',
    render: () => <img src={zoomIcon} alt="" aria-hidden="true" className="w-full h-full" />,
  },
  tiktok: {
    label: 'TikTok',
    color: '#000000',
    render: () => (
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
      </svg>
    ),
  },
  instagram: {
    label: 'Instagram',
    color: '#E4405F',
    render: () => (
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678c-3.405 0-6.162 2.76-6.162 6.162 0 3.405 2.76 6.162 6.162 6.162 3.405 0 6.162-2.76 6.162-6.162 0-3.405-2.76-6.162-6.162-6.162zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405c0 .795-.646 1.44-1.44 1.44-.795 0-1.44-.646-1.44-1.44 0-.794.646-1.439 1.44-1.439.793-.001 1.44.645 1.44 1.439z" />
      </svg>
    ),
  },
  linkedin: {
    label: 'LinkedIn',
    color: '#0A66C2',
    render: () => (
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.063 2.063 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
      </svg>
    ),
  },
  x: {
    label: 'X',
    color: 'hsl(var(--foreground))',
    render: () => (
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
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
    platforms: ['youtube', 'zoom'],
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
    platforms: ['youtube', 'kick', 'twitch', 'zoom'],
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
    platforms: ['youtube', 'kick', 'twitch', 'facebook', 'zoom'],
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
    platforms: ['youtube', 'kick', 'twitch', 'facebook', 'drive', 'zoom'],
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
  return <PricingPageInner />;
};

// ---------- Comparison Table ----------
type Cell = string | boolean | { kind: 'platforms'; keys: PlatformKey[]; manual?: boolean };

interface Row {
  label: string;
  values: [Cell, Cell, Cell, Cell]; // Free, Básico, Estándar, Premium
}

interface RowGroup {
  title: string;
  rows: Row[];
}

const COMPARISON_GROUPS: RowGroup[] = [
  {
    title: 'Generación de clips con IA',
    rows: [
      { label: 'Créditos mensuales', values: ['30', '300', '600', '1,200'] },
      { label: 'Horas de video procesables', values: ['30 min', '5 h', '10 h', '20 h'] },
      {
        label: 'Trae videos desde',
        values: [
          { kind: 'platforms', keys: ['youtube', 'zoom'] },
          { kind: 'platforms', keys: ['youtube', 'kick', 'twitch', 'zoom'], manual: true },
          { kind: 'platforms', keys: ['youtube', 'kick', 'twitch', 'facebook', 'zoom'], manual: true },
          { kind: 'platforms', keys: ['youtube', 'kick', 'twitch', 'facebook', 'drive', 'zoom'], manual: true },
        ],
      },
    ],
  },
  {
    title: 'Editor de video',
    rows: [
      { label: 'Sin marca de agua', values: [false, true, true, true] },
      { label: 'Calidad de descarga', values: ['720p', '1080p', '1080p', '1080p + 4K'] },
      { label: 'Clips descargables / mes', values: ['5', '30', '100', 'Ilimitado'] },
      { label: 'Almacenamiento', values: ['500 MB', '5 GB · 30 días', '20 GB · 90 días', '100 GB · 90 días'] },
      { label: 'Formatos de exportación', values: ['9:16', '9:16 · 1:1 · 16:9 · 4:5', '9:16 · 1:1 · 16:9 · 4:5', '9:16 · 1:1 · 16:9 · 4:5'] },
      { label: 'Plantilla de marca propia', values: [false, false, true, true] },
    ],
  },
  {
    title: 'Publicación en redes sociales',
    rows: [
      { label: 'Publicaciones / mes', values: ['3', '15', '50', 'Ilimitado'] },
      {
        label: 'Publica en',
        values: [
          { kind: 'platforms', keys: ['youtube', 'tiktok'] },
          { kind: 'platforms', keys: ['x', 'linkedin', 'facebook', 'instagram', 'tiktok', 'youtube'] },
          { kind: 'platforms', keys: ['x', 'linkedin', 'facebook', 'instagram', 'tiktok', 'youtube'] },
          { kind: 'platforms', keys: ['x', 'linkedin', 'facebook', 'instagram', 'tiktok', 'youtube'] },
        ],
      },
      { label: 'Programa tus publicaciones', values: [false, false, true, true] },
      { label: 'Define tu audiencia por red social', values: [false, false, true, true] },
    ],
  },
  {
    title: 'Soporte',
    rows: [
      { label: 'Comunidad Discord', values: [true, true, true, true] },
      { label: 'Soporte por email', values: [false, true, true, true] },
      { label: 'Atención prioritaria por WhatsApp', values: [false, false, false, true] },
    ],
  },
];

const PLAN_HEADERS = ['Free', 'Básico', 'Estándar', 'Premium'] as const;
const FEATURED_INDEX = 2; // Estándar

const renderCell = (v: Cell) => {
  if (typeof v === 'boolean') {
    return v ? (
      <Check className="w-4 h-4 text-secondary mx-auto" strokeWidth={3} />
    ) : (
      <XIcon className="w-4 h-4 text-muted-foreground/50 mx-auto" strokeWidth={2.5} />
    );
  }
  if (typeof v === 'string') {
    return <span className="text-sm text-foreground/90">{v}</span>;
  }
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex flex-wrap items-center justify-center gap-1.5">
        {v.keys.map((k) => {
          const meta = PLATFORM_META[k];
          return (
            <span
              key={k}
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
      {v.manual && (
        <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
          <Upload className="w-3 h-3" />
          <span>+ Subida manual</span>
        </div>
      )}
    </div>
  );
};

const ComparisonTable = () => {
  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left px-6 py-5 w-[34%]" />
              {PLAN_HEADERS.map((name, i) => (
                <th
                  key={name}
                  className={`text-center px-4 py-5 text-base font-semibold ${
                    i === FEATURED_INDEX ? 'text-primary bg-primary/5' : 'text-foreground'
                  }`}
                >
                  {name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {COMPARISON_GROUPS.map((group) => (
              <Fragment key={group.title}>
                <tr className="bg-muted/30">
                  <td
                    colSpan={5}
                    className="px-6 py-2.5 text-[10px] font-bold tracking-[0.18em] uppercase text-muted-foreground"
                  >
                    {group.title}
                  </td>
                </tr>
                {group.rows.map((row) => (
                  <tr key={row.label} className="border-t border-border/60">
                    <td className="px-6 py-4 text-foreground/85 align-middle">{row.label}</td>
                    {row.values.map((v, i) => (
                      <td
                        key={i}
                        className={`px-4 py-4 text-center align-middle ${
                          i === FEATURED_INDEX ? 'bg-primary/5' : ''
                        }`}
                      >
                        {renderCell(v)}
                      </td>
                    ))}
                  </tr>
                ))}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const PricingPageInner = () => {
  const [isAnnual, setIsAnnual] = useState(false);
  const [currency, setCurrency] = useState<'PEN' | 'USD'>('PEN');
  // Extra credits per plan (added on top of baseCredits)
  const [extraCredits, setExtraCredits] = useState<Record<string, number>>({});

  // Per-credit rate (matches credit pack pricing)
  const PER_CREDIT_PEN = 0.092;
  const PER_CREDIT_USD = 0.025;
  const MAX_CREDITS = 6200;
  const STEP_SIZE = 400;
  const buildSteps = (base: number) => {
    const steps: number[] = [0];
    let next = Math.ceil(base / STEP_SIZE) * STEP_SIZE - base;
    if (next <= 0) next = STEP_SIZE;
    while (base + next <= MAX_CREDITS) {
      steps.push(next);
      next += STEP_SIZE;
    }
    return steps;
  };

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
                          {buildSteps(plan.baseCredits).map((step) => {
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
                          {group.items.filter((it) => it.included !== false).map((item, i) => (
                            <li key={i} className="flex items-start gap-2.5">
                              <span className="w-4 h-4 mt-0.5 flex-shrink-0 rounded-full bg-secondary/15 inline-flex items-center justify-center">
                                <Check className="w-3 h-3 text-secondary" strokeWidth={3} />
                              </span>
                              <span className="text-foreground/90">{item.text}</span>
                            </li>
                          ))}
                        </ul>
                        {group.title === 'VOD' && plan.platforms.length > 0 && (
                          <div className="mt-3 space-y-2">
                            <div className="flex flex-wrap items-center gap-2">
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
                            {plan.name !== 'Free' && (
                              <div className="flex items-center gap-2 text-xs text-foreground/80">
                                <Upload className="w-3.5 h-3.5 text-secondary" strokeWidth={2.5} />
                                <span>+ Subida manual de video</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Compara tus planes — full comparison table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-16"
          >
            <div className="text-center mb-8">
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">
                Compara tus planes
              </h2>
              <p className="text-sm md:text-base text-muted-foreground max-w-2xl mx-auto">
                Detalle completo de lo que incluye cada plan, lado a lado.
              </p>
            </div>
            <ComparisonTable />
          </motion.div>

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

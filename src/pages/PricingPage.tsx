import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Check, Coins, Clock } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import SEOHead from '@/components/SEOHead';
import CountdownTimer from '@/components/CountdownTimer';
import platformYoutube from '@/assets/platform-youtube.png';
import platformTwitch from '@/assets/platform-twitch.png';
import platformKick from '@/assets/platform-kick.png';
import { trackInitiateCheckout } from '@/lib/tracking';

const DiscordSvg = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 inline-block text-[#5865F2]">
    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057.1 18.08.11 18.1.132 18.11a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
  </svg>
);

const TikTokSvg = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5 inline-block">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
  </svg>
);

const YTShortsSvg = () => (
  <svg viewBox="0 0 24 24" fill="#FF0000" className="w-3.5 h-3.5 inline-block">
    <path d="M10 14.65v-5.3L15 12l-5 2.65zm7.77-4.33-1.2-.5L18 9.06c1.84-.96 2.53-3.23 1.56-5.06s-3.24-2.53-5.07-1.56L6 6.94c-1.29.68-2.07 2.04-2 3.49.07 1.42.93 2.67 2.22 3.25.03.01 1.2.5 1.2.5L6 14.93c-1.83.97-2.53 3.24-1.56 5.07.97 1.83 3.24 2.53 5.07 1.56l8.5-4.5c1.29-.68 2.06-2.04 1.99-3.49-.07-1.42-.94-2.68-2.23-3.25z"/>
  </svg>
);

const InstagramSvg = () => (
  <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 inline-block">
    <defs>
      <linearGradient id="ig-grad" x1="0%" y1="100%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#feda75"/>
        <stop offset="25%" stopColor="#fa7e1e"/>
        <stop offset="50%" stopColor="#d62976"/>
        <stop offset="75%" stopColor="#962fbf"/>
        <stop offset="100%" stopColor="#4f5bd5"/>
      </linearGradient>
    </defs>
    <path fill="url(#ig-grad)" d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/>
  </svg>
);

const plans = [
  {
    icon: '🎮',
    name: 'Free',
    tagline: 'Pruébalo sin tarjeta',
    monthlyPrice: 0,
    annualPrice: 0,
    annualBilled: null,
    savings: null,
    cta: 'Prueba Clipealo',
    popular: false,
    highlighted: false,
    platforms: ['YouTube'],
    hoursLabel: 'CRÉDITOS POR MES',
    hours: [
      { label: '60 créditos', value: '≈ 1h' },
    ],
    hoursTotal: '60 créditos/mes',
    includesCopy: 'Ideal para probar la plataforma sin compromiso.',
    features: [
      { text: 'Subida manual' },
      { text: 'Análisis de audio' },
      { text: 'Reconocimiento facial', soon: true },
      { text: 'Título, descripción y Razón del clip' },
      { text: 'Prompt de momentos específicos' },
      { text: '3 días almacenamiento' },
    ],
    addons: [
      { label: 'Recarga de créditos (60 créditos = 1h)', value: 'S/.5.50' },
    ],
    services: [
      { text: 'Comunidad Discord', icon: 'discord' },
      { text: 'Recursos para crecer tu canal' },
    ],
  },
  {
    icon: '⚡',
    name: 'Básico',
    tagline: 'Para el creador que arranca',
    monthlyPrice: 35,
    annualPrice: 28,
    annualBilled: 'S/.336/año',
    savings: 'S/.84',
    cta: 'Comenzar',
    popular: false,
    highlighted: false,
    platforms: ['YouTube', 'Twitch'],
    hoursLabel: 'CRÉDITOS POR MES',
    hours: [
      { label: '420 créditos', value: '≈ 7h' },
    ],
    hoursTotal: '420 créditos/mes',
    includesCopy: 'Todo para empezar a crear clips profesionales.',
    features: [
      { text: 'Subida manual' },
      { text: 'Análisis de audio' },
      { text: 'Reconocimiento facial', soon: true },
      { text: 'Título, descripción y Razón del clip' },
      { text: 'Prompt de momentos específicos' },
      { text: 'Editor básico (recorte + subtítulos)' },
      { text: 'Sin marca de agua' },
      { text: '10 GB · 30 días almacenamiento' },
      { text: 'Soporte por email' },
      { text: 'Publicar desde Clipealo a TikTok', soon: true, icon: 'tiktok' },
    ],
    addons: [
      { label: 'Recarga de créditos (60 créditos = 1h)', value: 'S/.5.00' },
    ],
    services: [
      { text: 'Comunidad Discord', icon: 'discord' },
      { text: 'Soporte por email' },
    ],
  },
  {
    icon: '🚀',
    name: 'Estándar',
    tagline: 'Para el streamer activo',
    monthlyPrice: 72,
    annualPrice: 58,
    annualBilled: 'S/.696/año',
    savings: 'S/.168',
    cta: 'Comenzar',
    popular: true,
    highlighted: true,
    platforms: ['YouTube', 'Twitch', 'Kick'],
    hoursLabel: 'CRÉDITOS POR MES',
    hours: [
      { label: '900 créditos', value: '≈ 15h' },
    ],
    hoursTotal: '900 créditos/mes',
    includesCopy: 'El kit completo para streamers que crean contenido constante.',
    features: [
      { text: 'Subida manual' },
      { text: 'Análisis de audio' },
      { text: 'Reconocimiento facial', soon: true },
      { text: 'Título, descripción y Razón del clip' },
      { text: 'Prompt de momentos específicos' },
      { text: 'Editor básico completo' },
      { text: 'Editor de subtítulos animados', soon: true },
      { text: 'Reframing automático vertical/horizontal', soon: true },
      { text: 'Sin marca de agua' },
      { text: 'Marca de agua personalizada con @handle' },
      { text: '25 GB · 90 días almacenamiento' },
      { text: 'Publicar desde Clipealo a TikTok + YouTube Shorts + Instagram', soon: true, icon: 'social' },
      { text: 'Analytics de clips', soon: true },
    ],
    addons: [
      { label: 'Créditos adicionales (60 créditos = 1h)', value: 'S/.5.00' },
      { label: 'Redes sociales adicionales', value: 'Próximamente' },
    ],
    services: [
      { text: 'Comunidad Discord', icon: 'discord' },
      { text: 'Email prioritario' },
      { text: 'Acceso anticipado a nuevas features' },
    ],
  },
  {
    icon: '💎',
    name: 'Premium',
    tagline: 'Para alto volumen',
    monthlyPrice: 126,
    annualPrice: 101,
    annualBilled: 'S/.1,212/año',
    savings: 'S/.300',
    cta: 'Comenzar',
    popular: false,
    highlighted: false,
    platforms: ['YouTube', 'Twitch', 'Kick'],
    hoursLabel: 'CRÉDITOS POR MES',
    hours: [
      { label: '1800 créditos', value: '≈ 30h' },
    ],
    hoursTotal: '1800 créditos/mes',
    includesCopy: 'Máximo rendimiento para creadores de alto volumen.',
    features: [
      { text: 'Todo lo de Estándar', highlight: true },
      { text: 'Historial de proyectos ilimitado' },
      { text: '75 GB · 90 días almacenamiento' },
      { text: 'Branding completo por canal' },
      { text: 'Editor avanzado completo', soon: true },
      { text: 'Hasta 6 cuentas sociales', soon: true },
      { text: 'Hasta 3 usuarios', soon: true },
      { text: 'Analytics completo + tendencias', soon: true },
    ],
    addons: [
      { label: 'Recarga de créditos (60 créditos = 1h)', value: 'S/.5.00' },
      { label: 'Usuarios adicionales', value: 'Próximamente' },
    ],
    services: [
      { text: 'Comunidad Discord', icon: 'discord' },
      { text: 'Email prioritario' },
      { text: 'Soporte por WhatsApp' },
      { text: 'Acceso anticipado a todas las features' },
    ],
  },
];

const platformIcons: Record<string, React.ReactNode> = {
  YouTube: <img src={platformYoutube} alt="YouTube" className="w-6 h-6 object-contain" />,
  Twitch: (
    <svg viewBox="0 0 256 268" className="w-6 h-6" fill="none">
      <path d="M17.458 0L0 46.556v185.81h63.983V268h46.555l35.874-35.874h53.805L256 176.343V0H17.458zm23.259 23.265h192.024v139.95l-40.739 40.738h-69.446l-35.874 35.874v-35.874H40.717V23.265zm69.44 104.63h23.265V69.49h-23.264v58.404zm63.983 0h23.264V69.49h-23.264v58.404z" fill="#9146FF"/>
    </svg>
  ),
  Kick: <img src={platformKick} alt="Kick" className="w-6 h-6 object-contain rounded" />,
};

const PricingPage = () => {
  const [isAnnual, setIsAnnual] = useState(true);
  const navigate = useNavigate();

  const planKeyMap: Record<string, string> = {
    'Básico': 'basico',
    'Estándar': 'estandar',
    'Premium': 'premium',
  };


  return (
    <div className="min-h-screen bg-background text-foreground">
      <SEOHead
        title="Precios - Planes de Clipealo para Streamers y Cliperos"
        description="Planes desde gratis hasta premium para crear clips virales con IA. YouTube, Twitch y Kick. Desde S/.0/mes con 60 minutos incluidos. Sin tarjeta de crédito."
        canonicalPath="/precios"
      />
      <Header />
      <main className="pt-28 pb-20 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Title */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-10"
          >
            <h1 className="text-4xl md:text-6xl font-extrabold mb-4">
              <span className="gradient-text">Precios</span>
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Elige el plan que mejor se adapte a tu contenido.
            </p>
          </motion.div>

          {/* Toggle */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex items-center justify-center gap-4 mb-12"
          >
            <button
              onClick={() => setIsAnnual(false)}
              className={`text-sm font-semibold px-4 py-2 rounded-full transition-colors ${!isAnnual ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground'}`}
            >
              Mensual
            </button>
            <button
              onClick={() => setIsAnnual(true)}
              className={`text-sm font-semibold px-4 py-2 rounded-full transition-colors ${isAnnual ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground'}`}
            >
              Anual
            </button>
            {isAnnual && (
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-secondary/20 text-secondary border border-secondary/30">
                Ahorra hasta 20%
              </span>
            )}
          </motion.div>

          {/* Plan Cards - Básico, Estándar, Premium + Enterprise */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-12">
            {plans.filter(p => p.name !== 'Free').map((plan, idx) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.08 }}
                className={`relative rounded-2xl border p-6 flex flex-col ${
                  plan.popular
                    ? 'border-primary bg-card shadow-[0_0_40px_hsla(350,95%,62%,0.15)]'
                    : 'border-border bg-card'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <span className="px-4 py-1 text-xs font-bold rounded-full gradient-primary text-foreground">
                      ⭐ MÁS POPULAR
                    </span>
                  </div>
                )}

                {/* Header */}
                <div className="mb-5 min-h-[72px]">
                  <span className="text-2xl">{plan.icon}</span>
                  <h3 className="text-xl font-bold mt-1">{plan.name}</h3>
                  <p className="text-sm text-muted-foreground">{plan.tagline}</p>
                </div>

                {/* Price */}
                <div className="mb-5 min-h-[100px]">
                  <div className="flex items-baseline gap-1" data-product-price={isAnnual ? plan.annualPrice : plan.monthlyPrice} data-currency="PEN">
                    <span className="text-sm text-muted-foreground">S/.</span>
                    <span className="text-5xl font-extrabold" data-price-value={isAnnual ? plan.annualPrice : plan.monthlyPrice}>
                      {isAnnual ? plan.annualPrice : plan.monthlyPrice}
                    </span>
                    <span className="text-sm text-muted-foreground">/mes</span>
                  </div>
                  {isAnnual && plan.annualBilled && (
                    <>
                      <p className="text-xs text-muted-foreground mt-1">
                        Facturado {plan.annualBilled}
                      </p>
                      <span className="inline-block text-xs font-semibold mt-1 px-2 py-0.5 rounded-full bg-secondary/20 text-secondary border border-secondary/30">
                        + Ahorras {plan.savings} al año
                      </span>
                    </>
                  )}
                </div>

                {/* CTA */}
                <button
                  onClick={() => {
                    const price = isAnnual ? plan.annualPrice : plan.monthlyPrice;
                    trackInitiateCheckout({
                      value: price,
                      contentName: `Plan ${plan.name}`,
                      contentId: planKeyMap[plan.name],
                    });
                    navigate(`/checkout?type=plan&plan=${planKeyMap[plan.name]}&billing=${isAnnual ? 'annual' : 'monthly'}`);
                  }}
                  className={`w-full py-3 rounded-xl font-semibold text-sm transition-all mb-6 ${
                    plan.highlighted
                      ? 'gradient-primary text-foreground hover:opacity-90'
                      : 'border border-border bg-background hover:bg-muted text-foreground'
                  }`}
                >
                  {plan.cta}
                </button>

                {/* Hours */}
                <div className="bg-background/50 border border-border rounded-xl p-4 mb-5">
                  <p className="text-[10px] font-bold tracking-widest text-muted-foreground mb-2 uppercase flex items-center gap-1.5">
                    <Coins className="w-4 h-4 text-primary" />
                    {plan.hoursLabel}
                  </p>
                  {plan.hours.map((h) => (
                    <div key={h.label} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{h.label}</span>
                      <span className="font-semibold text-primary">{h.value}</span>
                    </div>
                  ))}
                  <div className="flex justify-between text-sm mt-2 pt-2 border-t border-border">
                    <span className="font-bold text-foreground">TOTAL</span>
                    <span className="font-bold text-primary">{plan.hoursTotal}</span>
                  </div>
                </div>

                {/* Features */}
                <div className="mb-5 flex-1">
                  <p className="text-[10px] font-bold tracking-widest text-muted-foreground mb-1 uppercase">
                    Incluye
                  </p>
                  <p className="text-xs text-muted-foreground mb-3">{plan.includesCopy}</p>

                  {/* Platforms */}
                  <div className="mb-4 min-h-[52px]">
                    <p className="text-[10px] font-bold tracking-widest text-muted-foreground mb-2 uppercase">
                      Plataformas
                    </p>
                    <div className="flex gap-2">
                      {plan.platforms.map((p) => (
                        <span key={p}>{platformIcons[p]}</span>
                      ))}
                    </div>
                  </div>

                  <ul className="space-y-2">
                    {plan.features.map((f, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <Check className="w-4 h-4 mt-0.5 flex-shrink-0 text-secondary" />
                        <span className={f.highlight ? 'text-secondary font-semibold' : ''}>
                          {f.text}
                          {f.icon === 'tiktok' && <span className="ml-1"><TikTokSvg /></span>}
                          {f.icon === 'social' && (
                            <span className="ml-1 inline-flex gap-1 align-middle">
                              <TikTokSvg /><YTShortsSvg /><InstagramSvg />
                            </span>
                          )}
                          {f.soon && (
                            <span className="ml-1.5 text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-medium">
                              pronto
                            </span>
                          )}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Add-ons */}
                <div className="mb-5">
                  <p className="text-[10px] font-bold tracking-widest text-muted-foreground mb-2 uppercase">
                    Add-ons
                  </p>
                  {plan.addons.map((a) => (
                    <div key={a.label} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{a.label}</span>
                      <span className="font-semibold text-primary">{a.value}</span>
                    </div>
                  ))}
                </div>

                {/* Services */}
                <div>
                  <p className="text-[10px] font-bold tracking-widest text-muted-foreground mb-2 uppercase">
                    Servicios
                  </p>
                  <ul className="space-y-1.5">
                    {plan.services.map((s) => (
                      <li key={s.text} className="flex items-center gap-2 text-sm">
                        <Check className="w-3.5 h-3.5 flex-shrink-0 text-secondary" />
                        <span className="flex items-center gap-1.5">
                          {s.text}
                          {s.icon === 'discord' && <DiscordSvg />}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            ))}

            {/* Enterprise card */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.24 }}
              className="relative rounded-2xl border border-border bg-card p-6 flex flex-col"
            >
              <div className="mb-5 min-h-[72px]">
                <span className="text-xs font-bold tracking-widest text-secondary uppercase">
                  ● EMPRESARIAL
                </span>
                <h3 className="text-xl font-bold mt-1">Empresarial</h3>
                <p className="text-sm text-muted-foreground leading-snug">Para agencias de contenido, agencias de growth, casas de apuestas, estudios de videojuegos, publishers, canales televisivos, marcas de gaming y agencias de gaming.</p>
              </div>

              <div className="mb-5 min-h-[100px]">
                <span className="text-2xl font-bold text-muted-foreground">A consultar</span>
                <p className="text-xs text-muted-foreground mt-2">Cuéntanos tu caso y te enviamos una propuesta en 24 horas.</p>
              </div>

              <a
                href="mailto:contacto@clipealo.com"
                className="w-full py-3 rounded-xl font-semibold text-sm border border-primary text-primary hover:bg-primary/10 transition-all mb-6 text-center block"
              >
                Contactar →
              </a>

              <div className="mb-5">
                <p className="text-[10px] font-bold tracking-widest text-muted-foreground mb-1 uppercase">
                  Incluye
                </p>
                <ul className="space-y-2 mt-2">
                  {[
                    { text: 'Todo lo de Premium', highlight: true },
                    { text: 'Créditos según volumen negociado' },
                    { text: 'Canales simultáneos ilimitados' },
                    { text: 'Multi-usuario custom' },
                    { text: 'Branding completo multi-canal' },
                    { text: 'SLA de procesamiento garantizado' },
                    { text: 'Analytics avanzado + exportable', soon: true },
                  ].map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <Check className="w-4 h-4 mt-0.5 flex-shrink-0 text-secondary" />
                      <span className={f.highlight ? 'text-secondary font-semibold' : ''}>
                        {f.text}
                        {f.soon && (
                          <span className="ml-1.5 text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-medium">
                            pronto
                          </span>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mb-5">
                <p className="text-[10px] font-bold tracking-widest text-muted-foreground mb-1 uppercase">
                  Add-ons
                </p>
                <ul className="space-y-2 mt-2">
                  {[
                    'Flujo de aprobación de clips',
                    'White label',
                  ].map((text) => (
                    <li key={text} className="flex items-start gap-2 text-sm">
                      <Check className="w-4 h-4 mt-0.5 flex-shrink-0 text-secondary" />
                      <span>{text}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <p className="text-[10px] font-bold tracking-widest text-muted-foreground mb-1 uppercase">
                  Servicios
                </p>
                <ul className="space-y-2 mt-2">
                  {[
                    'Clips con tu marca del contenido de todos tus streamers patrocinados',
                    'Clipero especializado dedicado por vertical — fútbol, gaming, entretenimiento o apuestas',
                  ].map((text) => (
                    <li key={text} className="flex items-start gap-2 text-sm">
                      <Check className="w-4 h-4 mt-0.5 flex-shrink-0 text-secondary" />
                      <span>{text}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          </div>

          {/* Free plan row */}
          <div className="max-w-md mx-auto mb-12">
            {(() => {
              const plan = plans.find(p => p.name === 'Free')!;
              return (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="rounded-2xl border border-border bg-card p-8 md:p-10 flex flex-col justify-between"
                >
                  <div>
                    <span className="text-2xl">{plan.icon}</span>
                    <h3 className="text-2xl font-bold mt-1">{plan.name}</h3>
                    <p className="text-sm text-muted-foreground mb-4">{plan.tagline}</p>

                    <div className="flex items-baseline gap-1 mb-4">
                      <span className="text-sm text-muted-foreground">S/.</span>
                      <span className="text-5xl font-extrabold">0</span>
                      <span className="text-sm text-muted-foreground">/mes</span>
                    </div>

                    <p className="text-xs text-muted-foreground mb-4">{plan.includesCopy}</p>

                    <ul className="space-y-2 mb-4">
                      {plan.features.map((f, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <Check className="w-4 h-4 mt-0.5 flex-shrink-0 text-secondary" />
                          <span>
                            {f.text}
                            {f.soon && (
                              <span className="ml-1.5 text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-medium">
                                pronto
                              </span>
                            )}
                          </span>
                        </li>
                      ))}
                    </ul>
                   </div>

                    <p className="text-xs text-muted-foreground mb-4">
                      ⚠️ El plan Free solo incluye YouTube como plataforma.
                    </p>

                  <a
                    href="https://app.clipealo-ai.com/"
                    className="w-full py-3 rounded-xl font-semibold text-sm border border-border bg-background hover:bg-muted text-foreground transition-all text-center block"
                  >
                    Prueba Clipealo
                  </a>
                </motion.div>
              );
            })()}
          </div>

          {/* Credit Packs Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-12"
          >
            <div className="flex items-center gap-3 mb-2">
              <Coins className="w-6 h-6 text-primary" />
              <h2 className="text-2xl font-bold">Paquetes de Créditos</h2>
            </div>
            <p className="text-sm text-muted-foreground mb-2">
              Compra paquetes de créditos y úsalos cuando quieras (1 crédito = 1 minuto · 60 créditos = 1 hora)
            </p>
            <p className="text-xs text-muted-foreground mb-8">
              ⚠️ Sin un plan activo, los créditos solo pueden usarse con YouTube.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8 max-w-4xl mx-auto">
              {[
                { credits: 60, hours: 1, price: 5.50, perCredit: '0.092', popular: false },
                { credits: 180, hours: 3, price: 16.50, perCredit: '0.092', popular: false },
                { credits: 300, hours: 5, price: 27.50, perCredit: '0.092', popular: true },
              ].map((pack) => (
                <motion.div
                  key={pack.credits}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className={`relative rounded-2xl border p-6 flex flex-col ${
                    pack.popular
                      ? 'border-primary bg-card shadow-[0_0_30px_hsla(350,95%,62%,0.12)]'
                      : 'border-border bg-card'
                  }`}
                >
                  {pack.popular && (
                    <div className="absolute -top-3 right-4">
                      <span className="px-3 py-1 text-[10px] font-bold rounded-full gradient-primary text-foreground">
                        Popular
                      </span>
                    </div>
                  )}

                  <div className="mb-4">
                    <span className="text-4xl font-extrabold text-primary">{pack.credits}</span>
                    <span className="text-lg text-muted-foreground ml-1">créditos</span>
                  </div>

                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-4">
                    <Clock className="w-4 h-4" />
                    <span>≈ {pack.hours} {pack.hours === 1 ? 'hora' : 'horas'}</span>
                  </div>

                  <div className="mb-1" data-product-price={pack.price} data-currency="PEN">
                    <span className="text-sm text-muted-foreground">S/.</span>
                    <span className="text-3xl font-extrabold ml-0.5" data-price-value={pack.price}>{pack.price.toFixed(2)}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-5">S/.{pack.perCredit} por crédito</p>

                  <button
                    onClick={() => {
                      trackInitiateCheckout({
                        value: pack.price,
                        contentName: `${pack.credits} créditos`,
                        contentId: `credits_${pack.credits}`,
                      });
                      navigate(`/checkout?type=credits&credits=${pack.credits}`);
                    }}
                    className={`w-full py-3 rounded-xl font-semibold text-sm transition-all ${
                    pack.popular
                      ? 'gradient-primary text-foreground hover:opacity-90'
                      : 'border border-border bg-background hover:bg-muted text-foreground'
                   }`}>
                    Comprar
                  </button>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Countdown Banner */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="rounded-2xl border border-border bg-card p-6 text-center mb-10"
          >
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 text-sm">
              <span>🕐 <strong>Precio de salida de mercado.</strong> Solo disponible por</span>
              <CountdownTimer />
            </div>
          </motion.div>

          {/* Footer note */}
          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              💡 <strong className="text-foreground">Precio de salida de mercado.</strong>{' '}
              <span className="text-primary">Disponible solo por tiempo limitado antes del precio oficial.</span>
            </p>
            <p className="text-xs text-muted-foreground">
              Todos los planes incluyen cancelación en cualquier momento · Pago seguro · Facturación en soles peruanos
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default PricingPage;

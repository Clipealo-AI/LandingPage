import { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Check, Coins, Clock, Minus, Plus, MessageCircle, ArrowLeft } from 'lucide-react';
import yapeQr from '@/assets/yape-qr.png';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { trackInitiateCheckout } from '@/lib/tracking';

type CheckoutType = 'plan' | 'credits';

interface PlanInfo {
  icon: string;
  name: string;
  tagline: string;
  monthlyPrice: number;
  annualPrice: number;
  annualBilled: string;
  savings: string;
  credits: number;
  hours: number;
}

const plansData: Record<string, PlanInfo> = {
  basico: {
    icon: '⚡',
    name: 'Básico',
    tagline: 'Para el creador que arranca',
    monthlyPrice: 40,
    annualPrice: 32,
    annualBilled: 'S/.384/año',
    savings: 'S/.96',
    credits: 480,
    hours: 8,
  },
  estandar: {
    icon: '🚀',
    name: 'Estándar',
    tagline: 'Para el streamer activo',
    monthlyPrice: 72,
    annualPrice: 58,
    annualBilled: 'S/.696/año',
    savings: 'S/.168',
    credits: 900,
    hours: 15,
  },
  premium: {
    icon: '💎',
    name: 'Premium',
    tagline: 'Para alto volumen',
    monthlyPrice: 126,
    annualPrice: 101,
    annualBilled: 'S/.1,212/año',
    savings: 'S/.300',
    credits: 1800,
    hours: 30,
  },
};

const creditPacks = [
  { credits: 60, hours: 1, price: 5.50 },
  { credits: 180, hours: 3, price: 16.50 },
  { credits: 300, hours: 5, price: 27.50 },
];

const CREDIT_PRICE = 5.50; // price per 60 credits


const CheckoutPage = () => {
  const [searchParams] = useSearchParams();
  const type = (searchParams.get('type') || 'plan') as CheckoutType;
  const planKey = searchParams.get('plan') || '';
  const billing = searchParams.get('billing') || 'annual';
  const packCredits = parseInt(searchParams.get('credits') || '0', 10);

  const plan = plansData[planKey];
  const creditPack = creditPacks.find(p => p.credits === packCredits);

  const [extraCredits, setExtraCredits] = useState(0);
  
  const extraBlocks = extraCredits / 60;

  const addCredits = () => setExtraCredits(prev => prev + 60);
  const removeCredits = () => setExtraCredits(prev => Math.max(0, prev - 60));

  // Calculate base price
  let basePrice = 0;
  let baseName = '';
  let baseDescription = '';

  if (type === 'plan' && plan) {
    basePrice = billing === 'annual'
      ? parseFloat((plan.annualPrice * 12).toFixed(2))
      : plan.monthlyPrice;
    baseName = `Plan ${plan.name}`;
    baseDescription = billing === 'annual' ? 'Facturación anual' : 'Facturación mensual';
  } else if (type === 'credits' && creditPack) {
    basePrice = creditPack.price;
    baseName = `${creditPack.credits} créditos`;
    baseDescription = `≈ ${creditPack.hours} ${creditPack.hours === 1 ? 'hora' : 'horas'}`;
  }

  const extraCost = extraBlocks * CREDIT_PRICE;
  const totalPrice = basePrice + extraCost;


  if ((type === 'plan' && !plan) || (type === 'credits' && !creditPack)) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Header />
        <main className="pt-28 pb-20 px-4 text-center">
          <h1 className="text-2xl font-bold mb-4">Plan no encontrado</h1>
          <Link to="/precios" className="text-primary underline">Volver a precios</Link>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main className="pt-28 pb-20 px-4">
        <div className="max-w-5xl mx-auto">
          {/* Back link */}
          <Link to="/precios" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Volver a precios
          </Link>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* LEFT COLUMN */}
            <div className="space-y-6">
              {/* Plan/Pack Summary */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl border border-border bg-card p-6"
              >
                {type === 'plan' && plan && (
                  <>
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <span className="text-2xl">{plan.icon}</span>
                        <h2 className="text-2xl font-bold mt-1">{plan.name}</h2>
                        <p className="text-sm text-muted-foreground">{plan.tagline}</p>
                      </div>
                      <div className="text-right">
                        <div className="flex items-baseline gap-1">
                          <span className="text-sm text-muted-foreground">S/.</span>
                          <span className="text-4xl font-extrabold">
                            {billing === 'annual' ? plan.annualPrice : plan.monthlyPrice}
                          </span>
                          <span className="text-sm text-muted-foreground">/mes</span>
                        </div>
                        {billing === 'annual' && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Facturado {plan.annualBilled}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="border-t border-border pt-4 space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Créditos incluidos</span>
                        <span className="font-semibold text-primary">{plan.credits}/mes</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Facturación</span>
                        <span className="font-semibold">{billing === 'annual' ? 'Anual' : 'Mensual'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Plan {plan.name}</span>
                        <span className="font-semibold">{billing === 'annual' ? plan.annualBilled : `S/.${plan.monthlyPrice}/mes`}</span>
                      </div>
                    </div>

                    {billing === 'annual' && (
                      <div className="mt-4 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-secondary/10 border border-secondary/20">
                        <Check className="w-4 h-4 text-secondary flex-shrink-0" />
                        <span className="text-sm font-semibold text-secondary">
                          Ahorras {plan.savings} al año vs plan mensual
                        </span>
                      </div>
                    )}
                  </>
                )}

                {type === 'credits' && creditPack && (
                  <>
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <Coins className="w-8 h-8 text-primary mb-1" />
                        <h2 className="text-2xl font-bold">{creditPack.credits} créditos</h2>
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-1">
                          <Clock className="w-4 h-4" />
                          <span>≈ {creditPack.hours} {creditPack.hours === 1 ? 'hora' : 'horas'}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-baseline gap-1">
                          <span className="text-sm text-muted-foreground">S/.</span>
                          <span className="text-4xl font-extrabold">{creditPack.price.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </motion.div>

              {/* Extra Credits Section */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="rounded-2xl border border-border bg-card p-6"
              >
                <h3 className="text-lg font-bold mb-1">¿Quieres más créditos?</h3>
                <p className="text-sm text-muted-foreground mb-5">
                  Añade créditos adicionales a <span className="text-primary font-semibold">S/.5.50</span> por cada 60 créditos (1 hora)
                </p>

                {/* Quick add buttons */}
                <div className="flex flex-wrap gap-2 mb-5">
                  {[60, 120, 300, 600].map(amount => (
                    <button
                      key={amount}
                      onClick={() => setExtraCredits(amount)}
                      className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                        extraCredits === amount
                          ? 'gradient-primary text-foreground'
                          : 'border border-border bg-background hover:bg-muted text-foreground'
                      }`}
                    >
                      +{amount} créditos
                    </button>
                  ))}
                </div>

                {/* Counter */}
                <div className="flex items-center justify-center gap-6 py-4">
                  <button
                    onClick={removeCredits}
                    className="w-10 h-10 rounded-xl border border-border bg-background hover:bg-muted flex items-center justify-center transition-colors"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <div className="text-center">
                    <span className="text-4xl font-extrabold text-primary">{extraCredits}</span>
                    <p className="text-xs text-muted-foreground mt-1">créditos extra (≈ {extraBlocks}h)</p>
                  </div>
                  <button
                    onClick={addCredits}
                    className="w-10 h-10 rounded-xl border border-border bg-background hover:bg-muted flex items-center justify-center transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                {extraCredits > 0 && (
                  <div className="mt-3 text-center text-sm text-muted-foreground">
                    +S/.{extraCost.toFixed(2)} adicional
                  </div>
                )}
              </motion.div>

              {/* How it works */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="rounded-2xl border border-border bg-card p-6"
              >
                <h3 className="text-lg font-bold mb-5">¿Cómo funciona?</h3>
                <div className="space-y-5">
                  {[
                    {
                      step: 1,
                      title: 'Revisa tu pedido',
                      desc: 'Verifica el plan y los créditos extra que quieras agregar.',
                    },
                     {
                      step: 2,
                      title: 'Paga con Yape',
                      desc: 'Escanea el QR con tu app de Yape y envía el comprobante por WhatsApp.',
                    },
                    {
                      step: 3,
                      title: 'Activación inmediata',
                      desc: 'Para planes, la activación es automática. Para créditos extra, se activan en menos de 24h.',
                    },
                  ].map(s => (
                    <div key={s.step} className="flex items-start gap-4">
                      <span className="flex-shrink-0 w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-sm font-bold text-foreground">
                        {s.step}
                      </span>
                      <div>
                        <p className="font-bold text-sm">{s.title}</p>
                        <p className="text-sm text-muted-foreground">{s.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>

            {/* RIGHT COLUMN */}
            <div className="space-y-6">
              {/* Order Summary */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
                className="rounded-2xl border border-border bg-card p-6 text-center"
              >
                <h3 className="text-lg font-bold mb-1">Resumen de pago</h3>
                <p className="text-sm text-muted-foreground mb-5">
                  Revisa tu pedido antes de pagar
                </p>

                <div className="space-y-3 text-sm text-left mb-5">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{baseName}</span>
                    <span className="font-semibold">S/.{basePrice.toFixed(2)}</span>
                  </div>
                  {extraCredits > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">+{extraCredits} créditos extra</span>
                      <span className="font-semibold">S/.{extraCost.toFixed(2)}</span>
                    </div>
                  )}
                </div>

                {/* Total */}
                <div className="border-t border-border pt-5">
                  <p className="text-sm text-muted-foreground mb-1">Total a pagar</p>
                  <p className="text-5xl font-extrabold text-foreground">
                    S/.{totalPrice.toFixed(2)}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {baseName} · {baseDescription}
                    {extraCredits > 0 && ` + ${extraCredits} créditos extra`}
                  </p>
                </div>
              </motion.div>

              {/* Payment - Yape Only */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="rounded-2xl border border-border bg-card overflow-hidden"
              >
                <h3 className="text-sm font-bold text-muted-foreground px-6 pt-5 pb-3 uppercase tracking-widest">
                  Método de pago
                </h3>

                <div className="px-6 pb-6 space-y-4">
                  <p className="text-sm text-muted-foreground text-center">
                    Escanea el QR con tu app de Yape por <span className="text-primary font-semibold">S/.{totalPrice.toFixed(2)}</span>
                  </p>
                  <div className="flex justify-center">
                    <img
                      src={yapeQr}
                      alt="QR de Yape para pagar"
                      className="w-48 h-48 rounded-xl object-contain"
                    />
                  </div>
                  <a
                    href={`https://wa.me/51906160948?text=${encodeURIComponent(
                      `¡Hola! Acabo de realizar el pago por Yape para:\n📦 ${baseName}${extraCredits > 0 ? ` + ${extraCredits} créditos extra` : ''}\n💰 Total: S/.${totalPrice.toFixed(2)}\nAdjunto mi comprobante.`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => {
                      trackInitiateCheckout({
                        value: totalPrice,
                        contentName: baseName + (extraCredits > 0 ? ` + ${extraCredits} créditos extra` : ''),
                        contentId: type === 'plan' ? planKey : `credits_${packCredits}`,
                      });
                    }}
                    className="flex items-center justify-center gap-3 w-full py-3.5 rounded-xl font-bold text-sm text-white transition-all hover:opacity-90"
                    style={{ background: 'linear-gradient(135deg, #25D366, #128C7E)' }}
                  >
                    <MessageCircle className="w-4 h-4" />
                    Enviar comprobante por WhatsApp
                  </a>
                  <p className="text-xs text-muted-foreground text-center">
                    Activación manual · Respuesta en menos de 24h
                  </p>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default CheckoutPage;

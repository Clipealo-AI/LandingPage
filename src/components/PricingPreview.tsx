import { ArrowRight, Check } from 'lucide-react';
import { Link } from 'react-router-dom';
import { planCatalog } from '@/data/pricing';

const paidPlans = [planCatalog.basico, planCatalog.estandar, planCatalog.premium];

const PricingPreview = () => (
  <section id="precios" className="brand-section bg-background">
    <div className="brand-container">
      <header className="mx-auto mb-12 max-w-3xl text-center">
        <p className="eyebrow mb-4">Empieza a tu ritmo</p>
        <h2 className="section-title">Precios claros. Más tiempo para crear.</h2>
        <p className="section-description mt-5">Prueba Clipealo gratis y elige un plan cuando quieras ampliar tu producción.</p>
      </header>
      <div className="grid gap-4 md:grid-cols-3">
        {paidPlans.map((plan) => (
          <article key={plan.name} className={`brand-card flex flex-col p-6 ${plan.name === 'Estándar' ? 'border-2 border-primary shadow-lg shadow-primary/10' : ''}`}>
            {plan.name === 'Estándar' && <span className="eyebrow mb-3">Más popular</span>}
            <h3 className="text-lg font-bold">{plan.name}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{plan.name === 'Básico' ? 'Creadores en crecimiento' : plan.name === 'Estándar' ? 'Creadores profesionales' : 'Agencias y equipos'}</p>
            <p className="mt-6 flex items-baseline gap-1"><span className="text-4xl font-bold tracking-tight">S/{plan.monthlyPEN}</span><span className="text-sm text-muted-foreground">/mes</span></p>
            <p className="mt-1 text-xs text-muted-foreground">o S/{plan.annualPEN}/mes con pago anual</p>
            <ul className="mt-6 flex-1 space-y-3 text-sm">
              {[`${plan.credits.toLocaleString('es-PE')} créditos al mes`, plan.name === 'Premium' ? 'Herramientas para equipos' : 'Clips automáticos con IA', 'Subtítulos y exportación'].map((item) => <li className="flex items-start gap-2" key={item}><Check size={16} className="mt-0.5 shrink-0 text-primary" />{item}</li>)}
            </ul>
            <a href={`https://app.clipealo-ai.com/plan?plan=${plan.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')}`} className={`mt-7 inline-flex min-h-11 items-center justify-center rounded-lg px-4 text-sm font-bold ${plan.name === 'Estándar' ? 'brand-button' : 'brand-button brand-button-outline'}`}>Elegir {plan.name}</a>
          </article>
        ))}
      </div>
      <div className="mt-8 text-center"><Link to="/precios" className="inline-flex items-center gap-2 font-semibold text-primary hover:underline">Ver todos los planes y paquetes de créditos <ArrowRight size={16} /></Link></div>
    </div>
  </section>
);

export default PricingPreview;

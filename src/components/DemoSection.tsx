import { Link } from 'react-router-dom';
import marketing from '../../messages/es/marketing.json';
import { featureItems } from '@/data/marketingNavigation';

const DemoSection = () => (
  <section id="funciones" className="brand-section bg-background">
    <div className="brand-container">
      <header className="mx-auto mb-12 max-w-3xl text-center">
        <p className="eyebrow mb-4">{marketing.features.eyebrow}</p>
        <h2 className="section-title text-balance">{marketing.features.title.replace('<br></br>', ' ')}</h2>
        <p className="section-description mt-5">{marketing.features.lead}</p>
      </header>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {featureItems.map(({ icon: Icon, label, description, slug }) => (
          <Link to={`/funciones/${slug}`} key={slug} className="brand-card group flex min-h-52 flex-col p-6 transition duration-200 hover:-translate-y-1 hover:border-primary/35">
            <span className="mb-5 grid h-11 w-11 place-items-center rounded-xl bg-secondary text-primary"><Icon size={21} aria-hidden="true" /></span>
            <h3 className="text-lg font-bold tracking-tight">{label}</h3>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
          </Link>
        ))}
      </div>
    </div>
  </section>
);

export default DemoSection;

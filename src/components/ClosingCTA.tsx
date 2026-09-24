import { ArrowRight } from 'lucide-react';
import marketing from '../../messages/es/marketing.json';
import { appUrl } from '@/data/marketingNavigation';
import { trackLead } from '@/lib/tracking';

const ClosingCTA = () => (
  <section className="reference-closing-cta">
    <div className="reference-closing-cta-pattern" aria-hidden="true" />
    <div className="reference-closing-cta-content">
      <h2 className="display-font">{marketing.cta.title}</h2>
      <p>{marketing.cta.lead}</p>
      <a href={appUrl} onClick={() => trackLead('Landing - CTA final')} className="reference-closing-cta-button">
        {marketing.actions.upload} <ArrowRight aria-hidden="true" />
      </a>
    </div>
  </section>
);

export default ClosingCTA;

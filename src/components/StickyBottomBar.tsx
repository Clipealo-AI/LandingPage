import { useEffect, useState } from 'react';
import { ArrowRight, Link2 } from 'lucide-react';
import { trackLead } from '@/lib/tracking';

const APP_URL = 'https://app.clipealo-ai.com/?utm_source=landing_organico&utm_medium=clic_boton';

const StickyBottomBar = () => {
  const [visible, setVisible] = useState(false);
  const [atFooter, setAtFooter] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 420);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    const footer = document.querySelector('footer');
    if (!footer) return () => window.removeEventListener('scroll', onScroll);
    const observer = new IntersectionObserver(([entry]) => setAtFooter(entry.isIntersecting), { threshold: 0.08 });
    observer.observe(footer);
    return () => { window.removeEventListener('scroll', onScroll); observer.disconnect(); };
  }, []);

  return (
    <div className={`sticky-cta ${visible && !atFooter ? 'sticky-cta-visible' : ''}`} aria-hidden={!visible || atFooter}>
      <div className="sticky-cta-content">
        <span className="hidden items-center gap-2 text-sm text-white/70 sm:flex"><Link2 size={16} /> Pega el link de tu video y empieza</span>
        <a href={APP_URL} tabIndex={visible && !atFooter ? 0 : -1} onClick={() => trackLead('Landing - CTA fijo')} className="brand-button w-full sm:w-auto">Haz clips <ArrowRight size={16} /></a>
      </div>
    </div>
  );
};

export default StickyBottomBar;

import { ArrowRight, Sparkles } from 'lucide-react';
import { trackLead } from '@/lib/tracking';

const ClosingCTA = () => (
  <section className="px-5 pb-20 pt-4 sm:pb-28">
    <div className="brand-container relative overflow-hidden rounded-[1.7rem] bg-[#121f38] px-6 py-14 text-center text-white sm:px-12 sm:py-20">
      <div className="pattern-corners absolute inset-0 opacity-60" aria-hidden="true" />
      <div className="relative mx-auto max-w-3xl">
        <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[.06] px-4 py-2 text-xs font-semibold text-white/75"><Sparkles size={14} className="text-[#fd8854]" />Tu próximo clip empieza aquí</p>
        <h2 className="display-font text-balance text-[clamp(2rem,5vw,4rem)] leading-tight">Dale una nueva vida a cada video.</h2>
        <p className="mx-auto mt-5 max-w-xl leading-7 text-white/70">Pruébalo con tu contenido. La IA encuentra los momentos que vale la pena compartir.</p>
        <a href="https://app.clipealo-ai.com/?utm_source=landing_organico&utm_medium=clic_boton" onClick={() => trackLead('Landing - CTA final')} className="brand-button mt-8">Prueba Clipealo <ArrowRight size={17} /></a>
      </div>
    </div>
  </section>
);

export default ClosingCTA;

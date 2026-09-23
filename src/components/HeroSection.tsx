import { useReducedMotion } from 'framer-motion';
import { ArrowDown, ArrowRight, Check, Link2, Upload, WandSparkles } from 'lucide-react';
import { trackLead } from '@/lib/tracking';
import demoVideo from '@/assets/demo-preview.webm';
import demoPoster from '@/assets/demo-preview-poster.webp';

const APP_URL = 'https://app.clipealo-ai.com/?utm_source=landing_organico&utm_medium=clic_boton';

const HeroSection = () => {
  const prefersReducedMotion = useReducedMotion();
  return (
  <section className="hero-stage px-5 pt-20 pb-24 sm:pt-24 sm:pb-28">
    <div className="hero-glow" aria-hidden="true" />
    <div className="pattern-corners absolute inset-0 -z-0 pointer-events-none" aria-hidden="true" />
    <div className="relative z-10 max-w-6xl mx-auto text-center">
      <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[.06] px-4 py-2 text-xs sm:text-sm text-white/80 mb-8">
        <WandSparkles size={15} className="text-[#fd8854]" />
        <span>Herramienta de clips con IA #1 para streamers LATAM</span>
      </div>
      <div className="-mt-4 mb-7 flex items-center justify-center gap-1.5" aria-label="Disponible en Latinoamérica">
        {['pe','mx','ar','co','ec','cl','br','ve','uy','bo'].map((country) => <img key={country} src={`https://flagcdn.com/w40/${country}.png`} alt="" title={country.toUpperCase()} className="h-3.5 w-5 rounded-[2px] object-cover" width="20" height="14" loading="lazy" />)}
      </div>
      <h1 className="display-font mx-auto max-w-5xl text-[clamp(2.3rem,7.2vw,6.4rem)] leading-[1.02] text-balance">
        1 stream largo,<br />10 clips virales.<br /><span className="text-[#fd5e1c]">Tu contenido, al toque.</span>
      </h1>
      <p className="mx-auto mt-7 max-w-2xl text-base leading-7 text-[#c3cee0] sm:text-lg sm:leading-8">
        Clipealo convierte streams, podcasts, webinars y grabaciones públicas de Zoom en clips cortos listos para publicar.
      </p>
      <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
        <a href={APP_URL} onClick={() => trackLead('Hero - Prueba Clipealo')} className="brand-button min-h-12 px-6">
          Prueba Clipealo <ArrowRight size={17} />
        </a>
        <a href={APP_URL} onClick={() => trackLead('Hero - Cargar archivos')} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/[.05] px-6 font-semibold text-white transition hover:bg-white/10">
          <Upload size={17} /> Cargar archivos
        </a>
      </div>
      <ul className="mt-6 flex flex-wrap justify-center gap-x-5 gap-y-2 text-xs text-[#b5c1d5] sm:text-sm">
        {['Sin tarjeta', 'Ahorra horas de edición', 'Publica más contenido'].map((text) => (
          <li key={text} className="inline-flex items-center gap-1.5"><Check size={14} className="text-[#55d8c4]" />{text}</li>
        ))}
      </ul>

      <div className="hero-frame mx-auto mt-14 max-w-5xl text-left">
        <div className="hero-frame-bar">
          <span className="h-2.5 w-2.5 rounded-full bg-[#fd5e1c]" />
          <span className="h-2.5 w-2.5 rounded-full bg-white/25" />
          <span className="h-2.5 w-2.5 rounded-full bg-white/25" />
          <span className="ml-2">cli pealo.ai / proyectos</span>
          <span className="ml-auto inline-flex items-center gap-1.5 text-[#7de1d1]"><WandSparkles size={13} />Momentos encontrados</span>
        </div>
        <div className="demo-window">
          <div className="demo-video overflow-hidden p-0">
            <video className="h-full w-full object-cover" autoPlay={!prefersReducedMotion} controls muted loop playsInline preload="none" poster={demoPoster} aria-label="Vista previa de Clipealo detectando y editando clips de un video">
              <source src={demoVideo} type="video/webm" />
              <img src={demoPoster} alt="Vista previa de Clipealo detectando clips de un video" />
            </video>
          </div>
          <div className="demo-clip-list">
            {[
              ['01', 'El momento más épico', '00:42 · 9:16'],
              ['02', 'La reacción inesperada', '01:18 · 9:16'],
              ['03', 'El cierre perfecto', '02:06 · 16:9'],
            ].map(([number, title, info]) => (
              <div className="demo-clip" key={number}>
                <div className="demo-clip-thumb grid place-items-center text-xs font-bold">{number}</div>
                <span className="min-w-0 flex-1"><strong className="block truncate text-white">{title}</strong><small className="text-white/55">{info}</small></span>
                <Check size={16} className="text-[#7de1d1]" />
              </div>
            ))}
            <div className="hidden sm:flex items-center gap-2 rounded-xl border border-white/10 bg-white/[.04] p-3 text-xs text-white/65">
              <Link2 size={15} /> Video analizado · clips listos para revisar
            </div>
          </div>
        </div>
      </div>
      <a href="#funciones" className="mt-8 inline-flex items-center gap-2 text-sm text-white/55 hover:text-white/85">Conoce Clipealo <ArrowDown size={15} /></a>
    </div>
  </section>
  );
};

export default HeroSection;

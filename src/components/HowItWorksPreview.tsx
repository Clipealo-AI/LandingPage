import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import howStep1 from '@/assets/how-step-1.png';
import howStep2 from '@/assets/how-step-2.png';
import howStep3 from '@/assets/how-step-3.png';

const steps = [
  { image: howStep1, number: '01', title: 'Pega el link de tu transmisión o sube tu video', description: 'Coloca un enlace de YouTube, Twitch, Kick, Facebook, Drive o una grabación pública de Zoom sin contraseña. También puedes subir tu archivo.' },
  { image: howStep2, number: '02', title: 'La IA detecta los mejores momentos', description: 'Nuestra IA analiza tu transmisión completa, detecta los momentos de mayor impacto y genera hasta 10 clips listos con título, descripción y hashtags.' },
  { image: howStep3, number: '03', title: 'Publica directo en TikTok, Reels y Shorts', description: 'Tus clips salen en formato 9:16 con subtítulos automáticos incluidos. Publícalos directamente desde Clipealo sin editar y sin salir de la plataforma.' },
];

const HowItWorksPreview = () => (
  <section id="como-funciona" className="brand-section bg-background">
    <div className="brand-container">
      <header className="mx-auto mb-14 max-w-3xl text-center">
        <p className="eyebrow mb-4">¿Cómo funciona Clipealo?</p>
        <h2 className="section-title text-balance">Tu siguiente publicación empieza con un video</h2>
      </header>
      <div className="grid gap-10 md:grid-cols-3 md:gap-6">
        {steps.map((step) => (
          <article key={step.number} className="relative flex flex-col items-center text-center">
            <div className="mb-6 flex aspect-[16/10] w-full items-center justify-center overflow-hidden rounded-2xl bg-[#f0f5fc] p-4 dark:bg-[#101b34]">
              <img src={step.image} alt={step.title} className="h-full w-full object-contain" loading="lazy" />
            </div>
            <span className="mb-4 grid h-11 w-11 place-items-center rounded-full bg-[#121f38] font-mono text-sm font-bold text-white dark:bg-[#dce9ff] dark:text-[#121f38]">{step.number}</span>
            <h3 className="max-w-sm text-xl font-bold tracking-tight">{step.title}</h3>
            <p className="mt-3 max-w-sm text-sm leading-6 text-muted-foreground">{step.description}</p>
          </article>
        ))}
      </div>
      <div className="mt-10 text-center"><Link to="/funciones" className="inline-flex items-center gap-2 font-semibold text-primary hover:underline">Explora todas las funciones <ArrowRight size={16} /></Link></div>
    </div>
  </section>
);

export default HowItWorksPreview;

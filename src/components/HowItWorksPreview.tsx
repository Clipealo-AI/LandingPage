import { motion } from 'framer-motion';
import howStep1 from '@/assets/how-step-1.png';
import howStep2 from '@/assets/how-step-2.png';
import howStep3 from '@/assets/how-step-3.png';

const steps = [
  {
    image: howStep1,
    number: '1',
    title: 'Pega el link de tu transmisión o sube tu video',
    description: 'Coloca el enlace de tu stream de Kick, Twitch o YouTube. También puedes subir tu archivo directamente.',
  },
  {
    image: howStep2,
    number: '2',
    title: 'La IA detecta los mejores momentos',
    description: 'Nuestra IA analiza tu transmisión completa, detecta los momentos de mayor impacto y genera hasta 10 clips listos con título, descripción y hashtags.',
  },
  {
    image: howStep3,
    number: '3',
    title: 'Publica directo en TikTok, Reels y Shorts',
    description: 'Tus clips salen en formato 9:16 con subtítulos automáticos incluidos. Publícalos directamente desde Clipealo sin editar y sin salir de la plataforma.',
  },
];

const HowItWorksPreview = () => {
  return (
    <section className="relative py-20 px-4">
      <div className="relative z-10 max-w-6xl mx-auto">
        {/* Header */}
        <motion.p
          initial={false}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center text-xs sm:text-sm font-bold uppercase tracking-[0.2em] text-muted-foreground mb-14"
        >
          ¿Cómo funciona Clipealo?
        </motion.p>

        {/* Steps grid */}
        <div className="grid md:grid-cols-3 gap-8 md:gap-8 gap-y-16">
          {steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              className="flex flex-col items-center text-center"
            >
              {/* Image - aspect ratio fixed for visual balance across columns */}
              <div className="w-full aspect-[16/10] mb-8 flex items-center justify-center">
                <img
                  src={step.image}
                  alt={step.title}
                  className="w-full h-full object-contain"
                  loading="lazy"
                />
              </div>

              {/* Step number */}
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center mb-4 text-white font-bold text-base"
                style={{ backgroundColor: 'hsl(var(--color-pink))' }}
              >
                {step.number}
              </div>

              {/* Title */}
              <h3 className="text-lg md:text-xl font-bold text-foreground mb-3 max-w-xs">
                {step.title}
              </h3>

              {/* Description */}
              <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
                {step.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorksPreview;

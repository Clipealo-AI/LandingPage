import { motion } from 'framer-motion';
import { Link2, Sparkles, Download, RefreshCw } from 'lucide-react';
import stepLink from '@/assets/step-link.png';
import stepProcessing from '@/assets/step-processing.png';
import stepClips from '@/assets/step-clips.png';

const steps = [
  {
    image: stepLink,
    icon: Link2,
    title: 'Pega tu link',
    description: 'Coloca el enlace de tu stream de Kick, Twitch o YouTube. También puedes subir tu archivo directamente.',
    color: 'text-cyan',
  },
  {
    image: stepProcessing,
    icon: Sparkles,
    title: 'La IA genera clips',
    description: 'Nuestra IA analiza tu video completo, detecta los mejores momentos y genera clips listos para publicar.',
    color: 'text-pink',
  },
  {
    image: stepClips,
    icon: Download,
    title: 'Descarga y publica',
    description: 'Revisa cada clip con su score de viralidad. Descarga y publica en todas tus redes con 1 clic.',
    color: 'text-purple',
  },
];

const HowItWorksPreview = () => {
  return (
    <section className="relative py-16 px-4 overflow-hidden">
      <div className="relative z-10 max-w-6xl mx-auto">
        {/* Header */}
        <motion.p
          initial={false}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center text-xs sm:text-sm font-bold uppercase tracking-[0.2em] text-muted-foreground mb-10"
        >
          Pon tu link de Kick, Twitch, YouTube o sube tu archivo
        </motion.p>

        {/* Card with gradient background */}
        <motion.div
          initial={false}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="rounded-3xl p-8 sm:p-12"
          style={{
            background: 'linear-gradient(135deg, hsl(0 0% 18% / 0.6), hsl(0 0% 12% / 0.8), hsl(0 0% 15% / 0.6))',
          }}
        >
          {/* Steps Row */}
          <div className="grid md:grid-cols-3 gap-8 items-start">
            {steps.map((step, index) => (
              <div key={index} className="relative flex flex-col items-center">
                {/* Image */}
                <div className="relative w-full mb-6">
                  <div className="rounded-2xl overflow-hidden border border-border/30 shadow-lg">
                    <img
                      src={step.image}
                      alt={step.title}
                      className="w-full h-auto object-cover"
                    />
                  </div>
                </div>

                {/* Label */}
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <step.icon className={`w-5 h-5 ${step.color}`} />
                    <h3 className="text-lg font-bold text-foreground">{step.title}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed max-w-xs mx-auto">
                    {step.description}
                  </p>
                </div>

                {/* Arrow connector (between steps) */}
                {index < steps.length - 1 && (
                  <div className="hidden md:flex absolute -right-4 top-[30%] z-10 items-center gap-1">
                    <span className="w-6 border-t border-dashed border-muted-foreground/30" />
                    <RefreshCw className="w-4 h-4 text-muted-foreground/40" />
                    <span className="w-6 border-t border-dashed border-muted-foreground/30" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default HowItWorksPreview;

import { motion } from 'framer-motion';
import { Link2, Upload } from 'lucide-react';
import { trackLead } from '@/lib/tracking';

interface HeroSectionProps {
  onFreeClick?: () => void;
}

const HeroSection = ({ onFreeClick }: HeroSectionProps) => {

  return (
    <section className="relative min-h-[80vh] flex flex-col items-center justify-center px-4 sm:px-6 pt-28 pb-16 overflow-hidden">
      {/* Background Glow */}
      <div className="absolute inset-0 gradient-glow-bg pointer-events-none" />
      <div className="absolute inset-0 grid-pattern opacity-30 pointer-events-none" />

      <div className="relative z-10 w-full max-w-5xl mx-auto text-center">
        {/* Top badge */}
        <motion.div
          initial={false}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center justify-center gap-3 mb-6 flex-wrap"
        >
          <span className="text-xs sm:text-sm font-bold uppercase tracking-[0.2em] text-secondary">
            Herramienta de clips con IA #1 para streamers LATAM
          </span>
          <span className="flex items-center gap-1.5">
            {['pe','mx','ar','co','ec','cl','br','ve','uy','bo'].map((code) => (
              <img
                key={code}
                src={`https://flagcdn.com/w40/${code}.png`}
                alt={code.toUpperCase()}
                className="w-5 h-3.5 rounded-[2px] object-cover"
              />
            ))}
          </span>
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={false}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.6 }}
          className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold leading-[1.1] mb-6"
        >
          <span className="text-foreground">1 stream largo, 10 clips virales.</span>
          <br />
          <span className="gradient-text">Tu contenido, al toque.</span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={false}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto mb-10"
        >
          Clipealo convierte tus streams largos en clips cortos y los publica en todas las plataformas con un solo clic.
        </motion.p>

        {/* URL Input Bar */}
        <motion.div
          initial={false}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.6 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-0 max-w-2xl mx-auto"
        >
          {/* Input + Button group */}
          <div className="flex items-center w-full sm:w-auto bg-muted/50 border border-border rounded-full px-2 py-1.5 gap-2">
            <div className="flex items-center gap-2 px-3 text-muted-foreground flex-1 min-w-0">
              <Link2 className="w-4 h-4 flex-shrink-0" />
              <span className="text-sm truncate">Colocar un enlace de tu stream...</span>
            </div>
            <a
              href="https://app.clipealo-ai.com/?utm_source=landing_organico&utm_medium=clic_boton"
              onClick={() => trackLead('Hero - Prueba Clipealo')}
              className="px-5 py-2.5 bg-foreground text-background rounded-full font-semibold text-sm whitespace-nowrap hover:bg-foreground/90 transition-colors"
            >
              Prueba Clipealo
            </a>
          </div>

          <span className="text-muted-foreground text-sm mx-3 hidden sm:inline">o</span>

          <button
            onClick={() => {
              trackLead('Hero - Cargar archivos');
              onFreeClick?.();
            }}
            className="px-5 py-2.5 border border-border rounded-full font-semibold text-sm text-foreground hover:bg-muted/50 transition-colors whitespace-nowrap"
          >
            <span className="flex items-center gap-2">
              <Upload className="w-4 h-4" />
              Cargar archivos
            </span>
          </button>
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;

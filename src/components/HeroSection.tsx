import { motion } from 'framer-motion';
import { Link2, Upload } from 'lucide-react';
import { trackLead } from '@/lib/tracking';
import heroBg from '@/assets/hero-bg.jpg';

const HeroSection = () => {
  return (
    <section className="relative min-h-[90vh] flex items-center px-4 sm:px-6 pt-28 pb-16 overflow-hidden">
      {/* Background image */}
      <div className="absolute inset-0 pointer-events-none">
        <img
          src={heroBg}
          alt="Streamer creando clips virales con Clipealo"
          className="w-full h-full object-cover object-right"
          width={1920}
          height={1080}
        />
        {/* Overlays for legibility */}
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-background/20" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/40" />
        <div className="absolute inset-0 grid-pattern opacity-20" />
      </div>

      <div className="relative z-10 w-full max-w-7xl mx-auto">
        <div className="max-w-2xl">
          {/* Top badge */}
          <motion.div
            initial={false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center gap-3 mb-6 flex-wrap"
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
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold leading-[1.05] mb-6"
          >
            <span className="text-foreground">1 stream largo,</span>
            <br />
            <span className="text-foreground">10 clips virales.</span>
            <br />
            <span className="gradient-text">Tu contenido, al toque.</span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="text-base sm:text-lg text-muted-foreground max-w-xl mb-10"
          >
            Clipealo convierte tus streams largos en clips cortos y los publica en todas las plataformas con un solo clic.
          </motion.p>

          {/* URL Input Bar */}
          <motion.div
            initial={false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.6 }}
            className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-0"
          >
            {/* Input + Button group */}
            <div className="flex items-center w-full sm:w-auto bg-muted/60 backdrop-blur-md border border-border rounded-full px-2 py-1.5 gap-2 shadow-[0_0_40px_rgba(255,45,120,0.15)]">
              <div className="flex items-center gap-2 px-3 text-muted-foreground flex-1 min-w-0">
                <Link2 className="w-4 h-4 flex-shrink-0" />
                <span className="text-sm truncate">Colocar un enlace de tu stream...</span>
              </div>
              <a
                href="https://app.clipealo-ai.com/?utm_source=landing_organico&utm_medium=clic_boton"
                onClick={() => trackLead('Hero - Prueba Clipealo')}
                className="px-5 py-2.5 bg-gradient-to-r from-pink to-purple text-white rounded-full font-semibold text-sm whitespace-nowrap hover:opacity-90 transition-opacity shadow-lg shadow-pink/30"
              >
                Prueba Clipealo
              </a>
            </div>

            <span className="text-muted-foreground text-sm mx-3 hidden sm:inline">o</span>

            <a
              href="https://app.clipealo-ai.com/?utm_source=landing_organico&utm_medium=clic_boton"
              onClick={() => trackLead('Hero - Cargar archivos')}
              className="px-5 py-2.5 border border-border bg-background/40 backdrop-blur-md rounded-full font-semibold text-sm text-foreground hover:bg-muted/50 transition-colors whitespace-nowrap"
            >
              <span className="flex items-center gap-2">
                <Upload className="w-4 h-4" />
                Cargar archivos
              </span>
            </a>
          </motion.div>

          {/* Trust line */}
          <motion.p
            initial={false}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="text-xs text-muted-foreground mt-6"
          >
            Sin tarjeta · Ahorra horas de edición · Publica más contenido
          </motion.p>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;

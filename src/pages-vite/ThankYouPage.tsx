import { motion } from 'framer-motion';
import { ExternalLink } from 'lucide-react';
import Footer from '@/components/Footer';
import Logo from '@/assets/clipealo-logo.svg';
import HeroImage from '@/assets/thankyou-hero.jpg';

// Discord icon
const DiscordIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
  </svg>
);

const ThankYouPage = () => {
  const position = 5;

  return (
    <main className="min-h-screen bg-background text-foreground">
      {/* Hero Section with Image - Compact */}
      <section className="relative min-h-[50vh] sm:min-h-[55vh] md:min-h-[60vh] overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0">
          <img 
            src={HeroImage} 
            alt="Streamer setup" 
            className="w-full h-full object-cover object-right sm:object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/90 sm:via-background/80 to-background/60 sm:to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 sm:via-background/50 to-transparent" />
        </div>

        {/* Content */}
        <div className="relative z-10 h-full min-h-[50vh] sm:min-h-[55vh] md:min-h-[60vh] flex items-center">
          <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10 md:py-12">
            <div className="max-w-xl">
              {/* Logo */}
              <motion.img
                src={Logo}
                alt="Clipealo"
                className="h-8 sm:h-10 md:h-12 mb-3 sm:mb-4 logo-glow"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              />

              {/* Success Badge */}
              <motion.div
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/20 border border-green-500/50 mb-3 sm:mb-4"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2, duration: 0.5 }}
              >
                <span className="text-green-400 text-lg sm:text-xl">✓</span>
                <span className="text-green-400 font-semibold text-xs uppercase tracking-wide">Registro exitoso</span>
              </motion.div>

              {/* Main Heading */}
              <motion.h1
                className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold mb-2 sm:mb-3 leading-tight"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.6 }}
              >
                <span className="gradient-text">¡ESTÁS EN LA LISTA!</span>
              </motion.h1>

              {/* Position info */}
              <motion.div
                className="flex items-center gap-2 mb-2 sm:mb-3"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.6 }}
              >
                <p className="text-base sm:text-lg md:text-xl text-foreground">
                  Estás en el puesto <span className="font-extrabold text-accent text-xl sm:text-2xl">#{position}</span> de la lista de espera
                </p>
              </motion.div>

              {/* Info */}
              <motion.p
                className="text-xs sm:text-sm text-muted-foreground mb-4 sm:mb-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.6 }}
              >
                Cuando tengamos novedades y precios, serás de los primeros en saberlo. 🚀
              </motion.p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-4 sm:py-6 md:py-8 px-4 bg-gradient-to-b from-background to-card/50">
        <div className="max-w-3xl mx-auto">
          <motion.p
            className="text-base sm:text-lg md:text-xl text-muted-foreground text-center mb-4 sm:mb-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.6 }}
          >
            Mientras tanto 👇
          </motion.p>

          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.6 }}
          >
            {/* Discord Button */}
            <a href="https://discord.gg/XjhXBtaK6A" target="_blank" rel="noopener noreferrer" className="group">
              <div className="relative overflow-hidden rounded-xl border-2 border-transparent bg-gradient-to-r from-pink-500 to-secondary p-[2px] transition-all duration-300 hover:shadow-[0_0_40px_rgba(193,36,227,0.5)] hover:-translate-y-1">
                <div className="bg-card rounded-[10px] p-4 sm:p-5 h-full flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-r from-pink-500 to-secondary flex items-center justify-center flex-shrink-0">
                    <DiscordIcon className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-left">
                    <h3 className="text-base sm:text-lg font-bold text-foreground">🚀 ÚNETE AL DISCORD</h3>
                    <p className="text-muted-foreground text-xs sm:text-sm">Entérate primero de todo</p>
                  </div>
                </div>
              </div>
            </a>

            {/* YouTube Button */}
            <a href="https://www.youtube.com/watch?v=lluBnFuX_ro" target="_blank" rel="noopener noreferrer" className="group">
              <div className="relative overflow-hidden rounded-xl border-2 border-border bg-card/50 backdrop-blur-sm transition-all duration-300 hover:border-accent hover:shadow-[0_0_30px_rgba(51,245,242,0.3)] hover:-translate-y-1 h-full">
                <div className="p-4 sm:p-5 flex items-center gap-4 h-full">
                  <div className="w-12 h-12 rounded-full bg-card border-2 border-accent flex items-center justify-center flex-shrink-0">
                    <span className="text-xl">▶️</span>
                  </div>
                  <div className="text-left">
                    <h3 className="text-base sm:text-lg font-semibold text-foreground flex items-center gap-2">
                      <span>VER EVOLUCIÓN</span>
                      <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-accent transition-colors" />
                    </h3>
                    <p className="text-muted-foreground text-xs sm:text-sm">Conoce cómo empezó Clipealo</p>
                  </div>
                </div>
              </div>
            </a>
          </motion.div>

          <motion.p
            className="text-center text-muted-foreground text-xs mt-4 sm:mt-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9, duration: 0.6 }}
          >
            Únete a la comunidad de streamers LATAM que ya están esperando Clipealo 🎮
          </motion.p>
        </div>
      </section>

      <Footer />
    </main>
  );
};

export default ThankYouPage;

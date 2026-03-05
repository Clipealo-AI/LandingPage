import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import Header from '@/components/Header';
import HeroSection from '@/components/HeroSection';
import DemoSection from '@/components/DemoSection';
import TestimonialsSection from '@/components/TestimonialsSection';
import HowItWorksPreview from '@/components/HowItWorksPreview';
import FAQSection from '@/components/FAQSection';
import WaitlistFormSection from '@/components/WaitlistFormSection';
import Footer from '@/components/Footer';
import SEOHead from '@/components/SEOHead';

const Index = () => {
  const [searchParams] = useSearchParams();
  const [showWaitlist, setShowWaitlist] = useState(false);

  const revealWaitlist = () => {
    setShowWaitlist(true);
    setTimeout(() => {
      document.querySelector('#aplicar-beta')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  useEffect(() => {
    if (searchParams.get('free') === '1') {
      revealWaitlist();
    }
  }, [searchParams]);

  return (
    <main className="min-h-screen bg-background text-foreground">
      <SEOHead
        title="Clipealo - Clips Virales Automáticos con IA para Streamers y Cliperos LATAM"
        description="Herramienta de IA #1 en LATAM para crear clips virales de YouTube, Twitch y Kick. Detecta los mejores momentos, corta con precisión y prepara clips para TikTok, Reels y Shorts. 60 minutos gratis."
        canonicalPath="/"
      />
      <Header />
      <HeroSection onFreeClick={revealWaitlist} />
      <DemoSection />
      <TestimonialsSection />
      <HowItWorksPreview />
      <FAQSection />
      {showWaitlist && <WaitlistFormSection />}
      <Footer />
    </main>
  );
};

export default Index;

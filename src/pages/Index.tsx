import Header from '@/components/Header';
import HeroSection from '@/components/HeroSection';
import DemoSection from '@/components/DemoSection';
import TestimonialsSection from '@/components/TestimonialsSection';
import HowItWorksPreview from '@/components/HowItWorksPreview';
import FAQSection from '@/components/FAQSection';
import Footer from '@/components/Footer';
import SEOHead from '@/components/SEOHead';
import StickyBottomBar from '@/components/StickyBottomBar';

const Index = () => {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <SEOHead
        title="Clipealo - Clips Virales Automáticos con IA para Streamers y Cliperos LATAM"
        description="Herramienta de IA #1 en LATAM para crear clips virales de YouTube, Twitch y Kick. Detecta los mejores momentos, corta con precisión y prepara clips para TikTok, Reels y Shorts. 60 minutos gratis."
        canonicalPath="/"
      />
      <Header />
      <HeroSection />
      <DemoSection />
      <TestimonialsSection />
      <HowItWorksPreview />
      <FAQSection />
      <Footer />
      <StickyBottomBar />
    </main>
  );
};

export default Index;

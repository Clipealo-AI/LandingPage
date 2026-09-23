import Header from '@/components/Header';
import HeroSection from '@/components/HeroSection';
import DemoSection from '@/components/DemoSection';
import TestimonialsSection from '@/components/TestimonialsSection';
import HowItWorksPreview from '@/components/HowItWorksPreview';
import FAQSection from '@/components/FAQSection';
import Footer from '@/components/Footer';
import SEOHead from '@/components/SEOHead';
import StickyBottomBar from '@/components/StickyBottomBar';
import PlatformStrip from '@/components/PlatformStrip';
import PricingPreview from '@/components/PricingPreview';
import ClosingCTA from '@/components/ClosingCTA';

const Index = () => {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <SEOHead
        title="Clipealo — Clips con IA para Agencias, Editores y Cliperos"
        description="Convierte streams, podcasts y videos en clips listos para TikTok, Reels y Shorts. Crea más contenido con la IA de Clipealo. Planes desde S/45 al mes."
        canonicalPath="/"
      />
      <Header />
      <HeroSection />
      <PlatformStrip />
      <DemoSection />
      <TestimonialsSection />
      <HowItWorksPreview />
      <PricingPreview />
      <FAQSection />
      <ClosingCTA />
      <Footer />
      <StickyBottomBar />
    </main>
  );
};

export default Index;

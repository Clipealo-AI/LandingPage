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
        title="Clipealo — Clips con IA para Agencias, Editores y Cliperos"
        description="Clipealo detecta los mejores momentos de tus videos y genera clips listos para TikTok, Reels y Shorts. Para agencias y cliperos en LATAM. Desde S/.35/mes."
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

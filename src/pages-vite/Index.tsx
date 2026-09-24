import ReferenceLandingHome from '@/components/ReferenceLandingHome';
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
        title="Clipealo — De videos largos a grandes clips"
        description="Sube el video completo. La IA encuentra los momentos que la gente ve hasta el final y te los devuelve en 9:16, con subtítulos."
        canonicalPath="/"
      />
      <ReferenceLandingHome />
      <TestimonialsSection />
      <DemoSection />
      <HowItWorksPreview />
      <PlatformStrip />
      <PricingPreview />
      <FAQSection />
      <ClosingCTA />
      <Footer />
      <StickyBottomBar />
    </main>
  );
};

export default Index;

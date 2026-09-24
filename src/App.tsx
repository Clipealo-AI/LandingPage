import { lazy, Suspense, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import Index from "./pages-vite/Index";

const ThankYouPage = lazy(() => import("./pages-vite/ThankYouPage"));
const PricingPage = lazy(() => import("./pages-vite/PricingPage"));
const CheckoutPage = lazy(() => import("./pages-vite/CheckoutPage"));
const NotFound = lazy(() => import("./pages-vite/NotFound"));
const BlogPage = lazy(() => import("./pages-vite/BlogPage"));
const BlogArticlePage = lazy(() => import("./pages-vite/BlogArticlePage"));
const PrivacyPolicyPage = lazy(() => import("./pages-vite/PrivacyPolicyPage"));
const TermsPage = lazy(() => import("./pages-vite/TermsPage"));
const FeaturesIndexPage = lazy(() => import("./pages-vite/FeaturesIndexPage"));
const FeaturePage = lazy(() => import("./pages-vite/FeaturePage"));
const CliperosPage = lazy(() => import("./pages-vite/use-cases/CliperosPage"));
const StreamersPage = lazy(() => import("./pages-vite/use-cases/StreamersPage"));
const PodcastersPage = lazy(() => import("./pages-vite/use-cases/PodcastersPage"));
const CoachesPage = lazy(() => import("./pages-vite/use-cases/CoachesPage"));
const CreadoresPage = lazy(() => import("./pages-vite/use-cases/CreadoresPage"));
const ComunidadesPage = lazy(() => import("./pages-vite/use-cases/ComunidadesPage"));
const AgenciasPage = lazy(() => import("./pages-vite/use-cases/AgenciasPage"));
const MarcasPage = lazy(() => import("./pages-vite/use-cases/MarcasPage"));

const queryClient = new QueryClient();

function ScrollToRouteTarget() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (!hash) {
      window.scrollTo(0, 0);
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      document.getElementById(decodeURIComponent(hash.slice(1)))?.scrollIntoView({ block: "start" });
    });

    return () => window.cancelAnimationFrame(frame);
  }, [pathname, hash]);

  return null;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ScrollToRouteTarget />
        <Suspense fallback={<div className="min-h-screen bg-background" aria-busy="true" />}>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/thankyoupage" element={<ThankYouPage />} />
            <Route path="/precios" element={<PricingPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/casos/cliperos" element={<CliperosPage />} />
            <Route path="/casos/streamers" element={<StreamersPage />} />
            <Route path="/casos/podcasters" element={<PodcastersPage />} />
            <Route path="/casos/coaches" element={<CoachesPage />} />
            <Route path="/casos/creadores" element={<CreadoresPage />} />
            <Route path="/casos/comunidades" element={<ComunidadesPage />} />
            <Route path="/casos/agencias" element={<AgenciasPage />} />
            <Route path="/casos/marcas" element={<MarcasPage />} />
            <Route path="/blog" element={<BlogPage />} />
            <Route path="/blog/:slug" element={<BlogArticlePage />} />
            <Route path="/funciones" element={<FeaturesIndexPage />} />
            <Route path="/funciones/:slug" element={<FeaturePage />} />
            <Route path="/politica-de-privacidad" element={<PrivacyPolicyPage />} />
            <Route path="/terminos-y-condiciones" element={<TermsPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

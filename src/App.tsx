import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import ThankYouPage from "./pages/ThankYouPage";
import PricingPage from "./pages/PricingPage";
import CheckoutPage from "./pages/CheckoutPage";
import NotFound from "./pages/NotFound";
import BlogPage from "./pages/BlogPage";
import BlogArticlePage from "./pages/BlogArticlePage";
import PrivacyPolicyPage from "./pages/PrivacyPolicyPage";
import TermsPage from "./pages/TermsPage";
import FeaturesIndexPage from "./pages/FeaturesIndexPage";
import FeaturePage from "./pages/FeaturePage";
import CliperosPage from "./pages/use-cases/CliperosPage";
import StreamersPage from "./pages/use-cases/StreamersPage";
import PodcastersPage from "./pages/use-cases/PodcastersPage";
import CoachesPage from "./pages/use-cases/CoachesPage";
import CreadoresPage from "./pages/use-cases/CreadoresPage";
import ComunidadesPage from "./pages/use-cases/ComunidadesPage";
import AgenciasPage from "./pages/use-cases/AgenciasPage";
import MarcasPage from "./pages/use-cases/MarcasPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
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
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

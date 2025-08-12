import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import Header from "@/components/layout/Header";
import Landing from "./pages/Landing";
import Wardrobe from "./pages/Wardrobe";
import AddItemWizard from "./pages/AddItemWizard";
import Recommandations from "./pages/Recommandations";
import Historique from "./pages/Historique";
import Profil from "./pages/Profil";
import NotFound from "./pages/NotFound";
import Bienvenue from "./pages/Bienvenue";
import CookieBanner, { openCookieSettings } from "@/components/CookieBanner";
import MentionsLegales from "./pages/MentionsLegales";
import PolitiqueConfidentialite from "./pages/PolitiqueConfidentialite";
import PolitiqueCookies from "./pages/PolitiqueCookies";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <HelmetProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 px-4 py-2 rounded bg-primary text-primary-foreground">
            Aller au contenu principal
          </a>
          <Header />
          <main id="main-content">
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/bienvenue" element={<Bienvenue />} />
              <Route path="/garde-robe" element={<Wardrobe />} />
              <Route path="/ajout" element={<AddItemWizard />} />
              <Route path="/recommandations" element={<Recommandations />} />
              <Route path="/historique" element={<Historique />} />
              <Route path="/profil" element={<Profil />} />
              <Route path="/mentions-legales" element={<MentionsLegales />} />
              <Route path="/politique-confidentialite" element={<PolitiqueConfidentialite />} />
              <Route path="/politique-cookies" element={<PolitiqueCookies />} />
              {/* OLD APP HOME (optional) */}
              <Route path="/app" element={<Recommandations />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
          <CookieBanner />
        </BrowserRouter>
      </TooltipProvider>
    </HelmetProvider>
  </QueryClientProvider>
);

export default App;

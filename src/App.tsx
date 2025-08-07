import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Header from "@/components/layout/Header";
import Index from "./pages/Index";
import Wardrobe from "./pages/Wardrobe";
import AddItemWizard from "./pages/AddItemWizard";
import Recommandations from "./pages/Recommandations";
import Historique from "./pages/Historique";
import Profil from "./pages/Profil";
import NotFound from "./pages/NotFound";
import Bienvenue from "./pages/Bienvenue";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Header />
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/bienvenue" element={<Bienvenue />} />
          <Route path="/garde-robe" element={<Wardrobe />} />
          <Route path="/ajout" element={<AddItemWizard />} />
          <Route path="/recommandations" element={<Recommandations />} />
          <Route path="/historique" element={<Historique />} />
          <Route path="/profil" element={<Profil />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

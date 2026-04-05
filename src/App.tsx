import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppLayout } from "@/components/layout/AppLayout";
import { useRealtimeSync } from "@/hooks/useSupabaseData";
import Dashboard from "./pages/Dashboard";
import Lives from "./pages/Lives";
import Finanzas from "./pages/Finanzas";
import KPIsFinancieros from "./pages/KPIsFinancieros";
import AgentesIA from "./pages/AgentesIA";
import Ventas from "./pages/Ventas";
import CreativosYPauta from "./pages/CreativosYPauta";
import OrganicoSocial from "./pages/OrganicoSocial";
import Objetivos from "./pages/Objetivos";
import Configuracion from "./pages/Configuracion";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function AppContent() {
  useRealtimeSync();
  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/ventas" element={<Ventas />} />
        <Route path="/lives" element={<Lives />} />
        <Route path="/creativos" element={<CreativosYPauta />} />
        <Route path="/organico" element={<OrganicoSocial />} />
        <Route path="/finanzas" element={<Finanzas />} />
        <Route path="/kpis" element={<KPIsFinancieros />} />
        <Route path="/objetivos" element={<Objetivos />} />
        
        <Route path="/agentes" element={<AgentesIA />} />
        <Route path="/configuracion" element={<Configuracion />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AppLayout>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

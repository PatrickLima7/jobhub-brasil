import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/ProtectedRoute";
import CompanyLayout from "@/layouts/CompanyLayout";
import FreelancerLayout from "@/layouts/FreelancerLayout";
import Auth from "@/pages/Auth";
import CompanyDashboard from "@/pages/company/Dashboard";
import PublicarVaga from "@/pages/company/PublicarVaga";
import MinhasVagas from "@/pages/company/MinhasVagas";
import UltimosContratados from "@/pages/company/UltimosContratados";
import MinhaEmpresa from "@/pages/company/MinhaEmpresa";
import VagasDisponiveis from "@/pages/freelancer/VagasDisponiveis";
import MinhasCandidaturas from "@/pages/freelancer/MinhasCandidaturas";
import MeuPerfil from "@/pages/freelancer/MeuPerfil";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Navigate to="/auth" replace />} />
            <Route path="/auth" element={<Auth />} />

            <Route path="/empresa" element={<ProtectedRoute requiredRole="company"><CompanyLayout /></ProtectedRoute>}>
              <Route index element={<CompanyDashboard />} />
              <Route path="publicar" element={<PublicarVaga />} />
              <Route path="vagas" element={<MinhasVagas />} />
              <Route path="contratados" element={<UltimosContratados />} />
              <Route path="perfil" element={<MinhaEmpresa />} />
            </Route>

            <Route path="/freelancer" element={<ProtectedRoute requiredRole="freelancer"><FreelancerLayout /></ProtectedRoute>}>
              <Route index element={<VagasDisponiveis />} />
              <Route path="candidaturas" element={<MinhasCandidaturas />} />
              <Route path="perfil" element={<MeuPerfil />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;


import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import Index from "./pages/Index";
import ProjectPage from "./pages/ProjectPage";
import GenerateContent from "./pages/GenerateContent";
import Templates from "./pages/Templates";
import ChatWithReports from "./pages/ChatWithReports";
import ReportsPage from "./pages/Reports"; // Ajout de l'import pour la page des rapports
import SpellCheckerPage from "./pages/SpellCheckerPage"; // Ajout de l'import pour le correcteur
import DashboardPage from "./pages/DashboardPage"; // Ajout de l'import pour le Dashboard
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";

const queryClient = new QueryClient();

// Composant pour protéger les routes
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
  
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  return <>{children}</>;
};

const App = () => {
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    // Vérifier si l'utilisateur est déjà connecté au chargement de l'app
    const checkAuth = async () => {
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulation d'une vérification
      setIsLoading(false);
    };
    
    checkAuth();
  }, []);
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">RAEDIFICARE</h1>
          <div className="animate-pulse text-neutral-500">Chargement...</div>
        </div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
            <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} /> {/* Ajout de la route pour le dashboard */}
            <Route path="/project/:id" element={<ProtectedRoute><ProjectPage /></ProtectedRoute>} />
            <Route path="/generate-content" element={<ProtectedRoute><GenerateContent /></ProtectedRoute>} />
            <Route path="/templates" element={<ProtectedRoute><Templates /></ProtectedRoute>} />
            <Route path="/reports" element={<ProtectedRoute><ReportsPage /></ProtectedRoute>} /> {/* Ajout de la route pour les rapports */}
            <Route path="/chat-reports" element={<ProtectedRoute><ChatWithReports /></ProtectedRoute>} />
            <Route path="/spell-checker" element={<ProtectedRoute><SpellCheckerPage /></ProtectedRoute>} /> {/* Ajout de la route pour le correcteur */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;

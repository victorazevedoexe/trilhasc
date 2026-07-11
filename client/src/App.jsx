import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { PerfilProvider, usePerfil } from './contexts/PerfilContext';

import Login from './pages/Login';
import Cadastro from './pages/Cadastro';
import SeletorPerfis from './pages/SeletorPerfis';
import CriarPerfil from './pages/CriarPerfil';
import AppLayout from './components/AppLayout';
import Dashboard from './pages/Dashboard';
import Documentos from './pages/Documentos';
import Trilha from './pages/Trilha';
import Frequencia from './pages/Frequencia';
import ModulosDesafios from './pages/ModulosDesafios';
import DashboardTitular from './pages/DashboardTitular';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30000 } },
});

function RequireAuth({ children }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
}

function RequirePerfil({ children }) {
  const { isAuthenticated } = useAuth();
  const { perfilAtivo } = usePerfil();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!perfilAtivo) return <Navigate to="/perfis" replace />;
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/cadastro" element={<Cadastro />} />
      <Route path="/perfis" element={<RequireAuth><SeletorPerfis /></RequireAuth>} />
      <Route path="/perfis/novo" element={<RequireAuth><CriarPerfil /></RequireAuth>} />
      <Route path="/" element={<RequirePerfil><AppLayout /></RequirePerfil>}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="documentos" element={<Documentos />} />
        <Route path="trilha" element={<Trilha />} />
        <Route path="frequencia" element={<Frequencia />} />
        <Route path="modulos" element={<ModulosDesafios />} />
        <Route path="grupo" element={<DashboardTitular />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <PerfilProvider>
          <BrowserRouter>
            <AppRoutes />
            <Toaster
              position="top-right"
              toastOptions={{
                style: { background: '#0D3B38', color: '#F0FDFA', border: '1px solid rgba(14,165,233,0.2)', borderRadius: '12px', fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '14px' },
                success: { iconTheme: { primary: '#22C55E', secondary: '#0D3B38' } },
                error: { iconTheme: { primary: '#EF4444', secondary: '#0D3B38' } },
              }}
            />
          </BrowserRouter>
        </PerfilProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { usePerfil } from '../contexts/PerfilContext';
import { useState } from 'react';
import {
  LayoutDashboard, FileText, BookOpen, Calendar, Zap,
  Users, LogOut, ChevronRight, Menu, X, Waves
} from 'lucide-react';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Painel' },
  { to: '/documentos', icon: FileText, label: 'Documentos' },
  { to: '/trilha', icon: BookOpen, label: 'Trilha' },
  { to: '/frequencia', icon: Calendar, label: 'Frequência' },
  { to: '/modulos', icon: Zap, label: 'Módulos & Desafios' },
];

export default function AppLayout() {
  const { logout, conta } = useAuth();
  const { perfilAtivo, limparPerfil } = usePerfil();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/login'); };
  const handleTrocarPerfil = () => { limparPerfil(); navigate('/perfis'); };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-5 py-6 border-b border-cerulean-500/10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-cerulean flex items-center justify-center shadow-glow-cerulean">
            <Waves size={18} className="text-white" />
          </div>
          <div>
            <div className="text-sm font-bold text-text-primary font-display leading-tight">Trilhas Inova 3</div>
            <div className="text-xs text-text-muted">SECTI/FAPEMA · MA</div>
          </div>
        </div>
      </div>

      {/* Perfil ativo */}
      <button
        onClick={handleTrocarPerfil}
        className="mx-3 mt-4 p-3 rounded-xl bg-bg-elevated border border-cerulean-500/15 hover:border-cerulean-500/30 transition-all group text-left"
        aria-label="Trocar perfil ativo"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-cerulean flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
            {perfilAtivo?.nome?.[0]?.toUpperCase() || '?'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-text-primary truncate">{perfilAtivo?.nome || 'Perfil'}</div>
            <div className="text-xs text-text-muted capitalize">{perfilAtivo?.papel || ''}</div>
          </div>
          <ChevronRight size={14} className="text-text-subtle group-hover:text-cerulean-400 transition-colors flex-shrink-0" />
        </div>
      </button>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1" aria-label="Navegação principal">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) => isActive ? 'nav-link-active' : 'nav-link'}
          >
            <Icon size={18} aria-hidden="true" />
            <span>{label}</span>
          </NavLink>
        ))}

        {perfilAtivo?.papel === 'titular' && (
          <NavLink
            to="/grupo"
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) => isActive ? 'nav-link-active' : 'nav-link'}
          >
            <Users size={18} aria-hidden="true" />
            <span>Painel do Grupo</span>
          </NavLink>
        )}
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 border-t border-cerulean-500/10 space-y-1">
        <div className="px-4 py-2 text-xs text-text-subtle truncate">{conta?.email}</div>
        <button onClick={handleLogout} className="nav-link w-full text-status-danger hover:bg-status-danger/10 hover:text-status-danger">
          <LogOut size={16} aria-hidden="true" />
          <span>Sair da conta</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-bg-deep flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar desktop */}
      <aside className="hidden lg:flex flex-col w-64 bg-bg-surface border-r border-cerulean-500/10 h-screen sticky top-0 overflow-y-auto">
        <SidebarContent />
      </aside>

      {/* Sidebar mobile drawer */}
      <aside
        className={`fixed top-0 left-0 h-full w-72 bg-bg-surface border-r border-cerulean-500/10 z-50 lg:hidden transform transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} overflow-y-auto`}
        aria-label="Menu lateral"
      >
        <div className="absolute top-4 right-4">
          <button onClick={() => setSidebarOpen(false)} className="btn-ghost btn w-9 h-9 !p-0 rounded-full" aria-label="Fechar menu">
            <X size={18} />
          </button>
        </div>
        <SidebarContent />
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile header */}
        <header className="lg:hidden sticky top-0 z-30 bg-bg-surface/90 backdrop-blur-md border-b border-cerulean-500/10 px-4 py-3 flex items-center gap-3">
          <button onClick={() => setSidebarOpen(true)} className="btn-ghost btn w-9 h-9 !p-0 rounded-xl" aria-label="Abrir menu">
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-gradient-cerulean flex items-center justify-center">
              <Waves size={14} className="text-white" />
            </div>
            <span className="text-sm font-bold text-text-primary font-display truncate">Trilhas Inova 3</span>
          </div>
          <div className="w-7 h-7 rounded-full bg-gradient-cerulean flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {perfilAtivo?.nome?.[0]?.toUpperCase() || '?'}
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 md:p-6 max-w-5xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

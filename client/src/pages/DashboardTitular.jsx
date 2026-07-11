import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { usePerfil } from '../contexts/PerfilContext';
import * as api from '../api';
import { Users, Crown, BookOpen, FileText, Calendar, ShieldOff } from 'lucide-react';

function ProgressBar({ value, color = 'cerulean' }) {
  return (
    <div className="progress-track">
      <div className={color === 'gold' ? 'progress-fill-gold' : 'progress-fill'} style={{ width: `${value}%` }} role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={100} />
    </div>
  );
}

export default function DashboardTitular() {
  const { perfilAtivo } = usePerfil();
  const navigate = useNavigate();

  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard-grupo'],
    queryFn: api.obterDashboardGrupo,
  });

  if (error?.response?.status === 403) {
    return (
      <div className="flex flex-col items-center justify-center min-h-64 gap-4 animate-fade-in">
        <div className="w-16 h-16 rounded-2xl bg-status-danger/10 flex items-center justify-center">
          <ShieldOff size={32} className="text-status-danger" />
        </div>
        <h2 className="text-lg font-bold text-text-primary font-display">Acesso restrito</h2>
        <p className="text-sm text-text-muted text-center">Este painel é exclusivo para o perfil <strong>titular</strong> da conta.</p>
        <button onClick={() => navigate('/dashboard')} className="btn-outline">Voltar ao painel</button>
      </div>
    );
  }

  const grupo = data?.data?.perfis || [];
  const total = data?.data?.total || 0;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="section-header">
        <div className="section-icon"><Users size={18} /></div>
        <h1 className="section-title">Painel do Grupo</h1>
      </div>

      <div className="flex items-center gap-3 p-4 rounded-xl bg-gold-400/10 border border-gold-400/20">
        <Crown size={18} className="text-gold-400" />
        <div>
          <div className="text-sm font-semibold text-text-primary">{total} perfil(s) na conta</div>
          <div className="text-xs text-text-muted">Visão resumida — sem acesso a arquivos de outros perfis</div>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="skeleton h-28 rounded-xl2" />)}</div>
      ) : grupo.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon"><Users size={32} /></div>
          <p className="text-sm text-text-muted">Nenhum perfil na conta ainda.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {grupo.map(p => (
            <div key={p.id} className="card card-body">
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0 ${p.papel === 'titular' ? 'bg-gradient-gold' : 'bg-gradient-cerulean'}`}>
                  {p.nome[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-text-primary truncate">{p.nome}</span>
                    {p.papel === 'titular' && <Crown size={13} className="text-gold-400 flex-shrink-0" aria-label="Titular" />}
                  </div>
                  <div className="text-xs text-text-muted">
                    {p.trilha_slug ? p.trilha_slug.replace(/-/g, ' ') : 'Trilha não selecionada'}
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-xs text-text-muted mb-1.5">
                    <span className="flex items-center gap-1"><FileText size={11} />Documentos</span>
                    <span className="font-medium text-text-primary">{p.pct_documentos}%</span>
                  </div>
                  <ProgressBar value={p.pct_documentos} />
                </div>
                <div>
                  <div className="flex justify-between text-xs text-text-muted mb-1.5">
                    <span className="flex items-center gap-1"><Calendar size={11} />Frequência</span>
                    <span className="font-medium text-text-primary">{p.pct_frequencia}%</span>
                  </div>
                  <ProgressBar value={p.pct_frequencia} color="gold" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="alert-info text-xs">
        <ShieldOff size={14} className="flex-shrink-0" />
        <span>Por segurança, este painel mostra apenas o progresso resumido. Arquivos e documentos de outros perfis não são exibidos aqui.</span>
      </div>
    </div>
  );
}

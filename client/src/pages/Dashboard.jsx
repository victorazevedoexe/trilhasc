import { useQuery } from '@tanstack/react-query';
import { usePerfil } from '../contexts/PerfilContext';
import * as api from '../api';
import CountdownWidget from '../components/CountdownWidget';
import {
  FileText, BookOpen, Calendar, Zap, TrendingUp,
  AlertTriangle, CheckCircle, Clock
} from 'lucide-react';

function StatCard({ icon: Icon, label, value, subtitle, accent = 'cerulean', alert = false }) {
  const accentClass = {
    cerulean: 'bg-cerulean-500/15 text-cerulean-400',
    gold: 'bg-gold-400/15 text-gold-400',
    success: 'bg-status-success/15 text-status-success',
    danger: 'bg-status-danger/15 text-status-danger',
  }[accent];

  return (
    <div className={`card card-body flex items-start gap-4 ${alert ? 'border-status-danger/30 bg-status-danger/5' : ''}`}>
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${accentClass}`}>
        <Icon size={20} aria-hidden="true" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-xs text-text-muted font-medium uppercase tracking-wider mb-1">{label}</div>
        <div className="text-2xl font-bold text-text-primary font-display leading-none">{value}</div>
        {subtitle && <div className="text-xs text-text-muted mt-1.5">{subtitle}</div>}
      </div>
    </div>
  );
}

function ProgressCard({ label, pct, icon: Icon, to }) {
  return (
    <div className="card card-body">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Icon size={16} className="text-cerulean-400" aria-hidden="true" />
          <span className="text-sm font-semibold text-text-primary">{label}</span>
        </div>
        <span className="text-lg font-bold text-gradient-cerulean font-display">{pct}%</span>
      </div>
      <div className="progress-track">
        <div className="progress-fill" style={{ width: `${pct}%` }} role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} />
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { perfilAtivo } = usePerfil();
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard', perfilAtivo?.id],
    queryFn: () => api.obterDashboard(perfilAtivo.id),
    enabled: !!perfilAtivo?.id,
  });

  const d = data?.data;

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="skeleton h-8 w-48 rounded-xl" />
        <div className="grid grid-cols-2 gap-3">
          {[1,2,3,4].map(i => <div key={i} className="skeleton h-24 rounded-xl2" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-xl2 bg-gradient-card border border-cerulean-500/15 p-6">
        <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-cerulean-500/10 blur-2xl pointer-events-none" aria-hidden="true" />
        <div className="relative">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold text-cerulean-400 uppercase tracking-wider">Olá,</span>
          </div>
          <h1 className="text-2xl font-bold text-text-primary font-display">{d?.perfil?.nome || perfilAtivo?.nome}</h1>
          <p className="text-sm text-text-muted mt-1">
            {d?.trilha ? (
              <>Trilha: <span className="text-cerulean-400 font-medium">{d.trilha.nome}</span> · {d.trilha.carga_horaria_horas}h</>
            ) : (
              <span className="text-status-warning">Trilha não selecionada — <a href="/trilha" className="underline">escolher agora</a></span>
            )}
          </p>
        </div>
        {/* Progresso geral */}
        <div className="mt-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-text-muted font-medium">Progresso geral do programa</span>
            <span className="text-sm font-bold text-gradient-gold font-display">{d?.progresso_geral ?? 0}%</span>
          </div>
          <div className="progress-track h-3">
            <div className="progress-fill-gold h-3" style={{ width: `${d?.progresso_geral ?? 0}%` }} role="progressbar" aria-valuenow={d?.progresso_geral ?? 0} aria-valuemin={0} aria-valuemax={100} />
          </div>
        </div>
      </div>

      {/* Alerta de risco */}
      {d?.frequencia?.alerta_risco && (
        <div className="alert-danger" role="alert">
          <AlertTriangle size={18} className="flex-shrink-0" aria-hidden="true" />
          <div>
            <div className="font-semibold">Atenção: risco de cancelamento de bolsa</div>
            <div className="text-xs mt-0.5 opacity-80">Você está com mais de 4 semanas consecutivas sem registrar presença. O edital prevê cancelamento da bolsa por baixo engajamento continuado.</div>
          </div>
        </div>
      )}

      {/* Cards de status */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          icon={FileText}
          label="Documentos"
          value={`${d?.documentos?.enviados ?? 0}/${d?.documentos?.total ?? 6}`}
          subtitle={`${d?.documentos?.percentual ?? 0}% completos`}
          accent={d?.documentos?.percentual === 100 ? 'success' : 'cerulean'}
        />
        <StatCard
          icon={Calendar}
          label="Frequência"
          value={`${d?.frequencia?.percentual ?? 0}%`}
          subtitle={`${d?.frequencia?.presentes ?? 0} sem. presentes · ${d?.frequencia?.total_horas ?? 0}h`}
          accent="gold"
        />
        <StatCard
          icon={BookOpen}
          label="Módulos"
          value={`${d?.modulos?.concluidos ?? 0}/${d?.modulos?.total ?? 0}`}
          subtitle={`${d?.modulos?.percentual ?? 0}% concluídos`}
          accent="cerulean"
        />
        <StatCard
          icon={Zap}
          label="Desafios"
          value={`${d?.desafios?.entregues ?? 0}/${d?.desafios?.total ?? 0}`}
          subtitle={`${d?.desafios?.percentual ?? 0}% entregues`}
          accent="success"
        />
      </div>

      {/* Ações rápidas (empty states orientados) */}
      {!d?.trilha && (
        <div className="alert-info">
          <BookOpen size={18} className="flex-shrink-0" aria-hidden="true" />
          <div>
            <div className="font-semibold">Escolha sua trilha</div>
            <div className="text-xs mt-0.5">Vá para <a href="/trilha" className="underline font-medium">Trilha</a> e selecione a área de formação para desbloquear módulos e desafios.</div>
          </div>
        </div>
      )}
      {d?.documentos?.percentual < 100 && (
        <div className="alert-warning">
          <FileText size={18} className="flex-shrink-0" aria-hidden="true" />
          <div>
            <div className="font-semibold">{d?.documentos?.total - d?.documentos?.enviados} documento(s) faltando</div>
            <div className="text-xs mt-0.5">Acesse <a href="/documentos" className="underline font-medium">Documentos</a> para enviar os arquivos necessários e gerar seu pacote de inscrição.</div>
          </div>
        </div>
      )}

      {/* Countdown */}
      <CountdownWidget />
    </div>
  );
}

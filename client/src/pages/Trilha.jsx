import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usePerfil } from '../contexts/PerfilContext';
import * as api from '../api';
import toast from 'react-hot-toast';
import { BookOpen, Users, Clock, ChevronRight, Check, AlertTriangle } from 'lucide-react';

const TRILHA_ICONS = {
  frontend: '🌐', backend: '⚙️', dados: '📊', ux: '🎨',
  mobile: '📱', 'social-media': '📣', jogos: '🎮', 'automacoes-ia': '🤖',
  empreendedorismo: '🚀',
};

export default function Trilha() {
  const { perfilAtivo } = usePerfil();
  const qc = useQueryClient();
  const [confirmando, setConfirmando] = useState(null);
  const [alterando, setAlterando] = useState(false);

  const { data: trilhasData, isLoading: loadingTrilhas } = useQuery({
    queryKey: ['trilhas'],
    queryFn: api.listarTrilhas,
  });

  const { data: perfilData, refetch: refetchPerfil } = useQuery({
    queryKey: ['perfil', perfilAtivo?.id],
    queryFn: () => api.obterPerfil(perfilAtivo.id),
    enabled: !!perfilAtivo?.id,
  });

  const trilhas = trilhasData?.data?.trilhas || [];
  const trilhaAtual = perfilData?.data?.perfil?.trilha_slug || perfilAtivo?.trilha_slug;

  const handleEscolher = async (slug) => {
    if (trilhaAtual && slug !== trilhaAtual && !alterando) {
      if (!confirm(`Trocar para a trilha "${slug}" vai resetar seu progresso de módulos e desafios. Deseja continuar?`)) return;
    }
    try {
      await api.atualizarTrilha(perfilAtivo.id, slug);
      qc.invalidateQueries({ queryKey: ['perfil'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      qc.invalidateQueries({ queryKey: ['modulos'] });
      qc.invalidateQueries({ queryKey: ['desafios'] });
      toast.success('Trilha atualizada!');
      setAlterando(false);
      setConfirmando(null);
      await refetchPerfil();
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Erro ao atualizar trilha.');
    }
  };

  // Separar trilha complementar
  const trilhaPrincipal = trilhas.filter(t => t.slug !== 'empreendedorismo');
  const trilhaComplementar = trilhas.find(t => t.slug === 'empreendedorismo');

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="section-header">
        <div className="section-icon"><BookOpen size={18} /></div>
        <h1 className="section-title">Escolha de Trilha</h1>
      </div>

      {trilhaAtual && !alterando && (
        <div className="card card-cerulean-accent card-body">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-xs text-cerulean-400 font-semibold uppercase tracking-wider mb-1">Trilha selecionada</div>
              <div className="text-xl font-bold text-text-primary font-display flex items-center gap-2">
                <span>{TRILHA_ICONS[trilhaAtual] || '📚'}</span>
                <span>{trilhas.find(t => t.slug === trilhaAtual)?.nome || trilhaAtual}</span>
              </div>
              <div className="text-sm text-text-muted mt-1">
                {trilhas.find(t => t.slug === trilhaAtual)?.carga_horaria_horas}h · {trilhas.find(t => t.slug === trilhaAtual)?.vagas_totais} vagas no edital
              </div>
            </div>
            <button onClick={() => setAlterando(true)} className="btn-outline btn-sm flex-shrink-0">Alterar trilha</button>
          </div>
        </div>
      )}

      {alterando && (
        <div className="alert-warning text-sm">
          <AlertTriangle size={16} className="flex-shrink-0" />
          <span>Ao alterar a trilha, seu progresso de módulos e desafios da trilha atual será resetado.</span>
        </div>
      )}

      {(!trilhaAtual || alterando) && (
        <>
          <p className="text-sm text-text-muted">Selecione sua trilha principal. O edital permite <strong className="text-text-primary">apenas uma trilha principal</strong> por candidato.</p>

          {loadingTrilhas ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[1,2,3,4].map(i => <div key={i} className="skeleton h-36 rounded-xl2" />)}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {trilhaPrincipal.map(t => {
                const matriz = JSON.parse(t.matriz_curricular_json || '[]');
                const isAtual = t.slug === trilhaAtual;
                return (
                  <button
                    key={t.slug}
                    id={`btn-trilha-${t.slug}`}
                    onClick={() => handleEscolher(t.slug)}
                    className={`card-hover text-left p-4 group ${isAtual ? 'border-cerulean-500/40 bg-cerulean-500/5' : ''}`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <span className="text-2xl" role="img" aria-label={t.nome}>{TRILHA_ICONS[t.slug] || '📚'}</span>
                      {isAtual && <Check size={16} className="text-cerulean-400 flex-shrink-0" />}
                    </div>
                    <div className="font-bold text-text-primary font-display text-sm mb-1">{t.nome}</div>
                    <div className="flex items-center gap-3 text-xs text-text-muted mb-3">
                      <span className="flex items-center gap-1"><Clock size={11} />{t.carga_horaria_horas}h</span>
                      <span className="flex items-center gap-1"><Users size={11} />{t.vagas_totais} vagas</span>
                    </div>
                    <div className="text-xs text-text-subtle line-clamp-2">
                      {matriz.slice(0, 4).map(m => m.titulo).join(' · ')}
                      {matriz.length > 4 && ` +${matriz.length - 4} módulos`}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Trilha complementar */}
          {trilhaComplementar && (
            <div className="card card-gold-accent p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl" role="img" aria-label="Empreendedorismo">🚀</span>
                <div>
                  <div className="font-bold text-text-primary font-display text-sm">{trilhaComplementar.nome}</div>
                  <div className="text-xs text-gold-400 font-medium">Obrigatória para todos os candidatos</div>
                </div>
              </div>
              <div className="flex items-center gap-3 text-xs text-text-muted">
                <span>{trilhaComplementar.carga_horaria_horas}h</span>
                <span>{trilhaComplementar.vagas_totais} vagas</span>
              </div>
              <p className="text-xs text-text-muted mt-2">Todos os candidatos cursam esta trilha complementar, independente da trilha principal escolhida.</p>
            </div>
          )}

          {alterando && (
            <button onClick={() => setAlterando(false)} className="btn-ghost w-full">Cancelar</button>
          )}
        </>
      )}
    </div>
  );
}

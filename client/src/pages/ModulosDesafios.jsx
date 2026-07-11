import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { usePerfil } from '../contexts/PerfilContext';
import * as api from '../api';
import toast from 'react-hot-toast';
import { Zap, BookOpen, CheckCircle, Circle, Clock, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';

const STATUS_MODULO = [
  { value: 'nao_iniciado', label: 'Não iniciado', color: 'text-text-muted' },
  { value: 'em_andamento', label: 'Em andamento', color: 'text-gold-400' },
  { value: 'concluido', label: 'Concluído', color: 'text-status-success' },
];

const STATUS_DESAFIO = [
  { value: 'nao_iniciado', label: 'Não iniciado' },
  { value: 'em_andamento', label: 'Em andamento' },
  { value: 'entregue', label: 'Entregue' },
];

export default function ModulosDesafios() {
  const { perfilAtivo } = usePerfil();
  const qc = useQueryClient();
  const [tab, setTab] = useState('modulos');
  const [desafioAberto, setDesafioAberto] = useState(null);
  const [linkForm, setLinkForm] = useState({});

  const { data: modData, isLoading: loadMod, refetch: refetchMod } = useQuery({
    queryKey: ['modulos', perfilAtivo?.id],
    queryFn: () => api.listarModulos(perfilAtivo.id),
    enabled: !!perfilAtivo?.id,
  });

  const { data: desData, isLoading: loadDes, refetch: refetchDes } = useQuery({
    queryKey: ['desafios', perfilAtivo?.id],
    queryFn: () => api.listarDesafios(perfilAtivo.id),
    enabled: !!perfilAtivo?.id,
  });

  const modulos = modData?.data?.modulos || [];
  const progressoMod = modData?.data?.progresso || { total: 0, concluidos: 0, percentual: 0 };
  const desafios = desData?.data?.desafios || [];
  const progressoDes = desData?.data?.progresso || { total: 0, entregues: 0, percentual: 0 };
  const trilha_slug = modData?.data?.trilha_slug;

  const handleModuloClick = async (modulo) => {
    const statusAtual = modulo.progresso?.status || 'nao_iniciado';
    const proximoStatus = statusAtual === 'nao_iniciado' ? 'em_andamento' : statusAtual === 'em_andamento' ? 'concluido' : 'nao_iniciado';
    try {
      await api.atualizarModulo(perfilAtivo.id, modulo.id, proximoStatus);
      qc.invalidateQueries({ queryKey: ['dashboard', perfilAtivo?.id] });
      refetchMod();
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Erro ao atualizar módulo.');
    }
  };

  const handleDesafioSalvar = async (desafio, status) => {
    const link = linkForm[desafio.id] ?? desafio.progresso?.link_entrega ?? '';
    try {
      await api.atualizarDesafio(perfilAtivo.id, desafio.id, { status, link_entrega: link });
      toast.success(status === 'entregue' ? 'Desafio entregue! 🎉' : 'Status atualizado.');
      qc.invalidateQueries({ queryKey: ['dashboard', perfilAtivo?.id] });
      refetchDes();
      setDesafioAberto(null);
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Erro ao atualizar desafio.');
    }
  };

  const semTrilha = !trilha_slug && !loadMod;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="section-header">
        <div className="section-icon"><Zap size={18} /></div>
        <h1 className="section-title">Módulos & Desafios</h1>
      </div>

      {/* Tabs */}
      <div className="flex rounded-xl bg-bg-elevated p-1 gap-1" role="tablist">
        {[
          { id: 'modulos', label: 'Módulos', icon: BookOpen, count: progressoMod.concluidos, total: progressoMod.total },
          { id: 'desafios', label: 'Desafios', icon: Zap, count: progressoDes.entregues, total: progressoDes.total },
        ].map(({ id, label, icon: Icon, count, total }) => (
          <button
            key={id}
            role="tab"
            aria-selected={tab === id}
            id={`tab-${id}`}
            onClick={() => setTab(id)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${tab === id ? 'bg-bg-surface text-cerulean-400 shadow-sm' : 'text-text-muted hover:text-text-primary'}`}
          >
            <Icon size={15} aria-hidden="true" />
            {label}
            {total > 0 && <span className={`text-xs px-1.5 py-0.5 rounded-full ${tab === id ? 'bg-cerulean-500/20 text-cerulean-300' : 'bg-bg-overlay text-text-subtle'}`}>{count}/{total}</span>}
          </button>
        ))}
      </div>

      {semTrilha && (
        <div className="empty-state">
          <div className="empty-icon"><BookOpen size={32} /></div>
          <p className="text-text-muted text-sm">Você ainda não escolheu uma trilha.<br />Vá para <a href="/trilha" className="text-cerulean-400 underline">Trilha</a> para selecionar.</p>
        </div>
      )}

      {/* MÓDULOS */}
      {tab === 'modulos' && !semTrilha && (
        <div className="space-y-4">
          {progressoMod.total > 0 && (
            <div className="card card-body">
              <div className="flex justify-between mb-2">
                <span className="text-sm text-text-muted">{progressoMod.concluidos} de {progressoMod.total} módulos concluídos</span>
                <span className="text-sm font-bold text-gradient-cerulean font-display">{progressoMod.percentual}%</span>
              </div>
              <div className="progress-track">
                <div className="progress-fill" style={{ width: `${progressoMod.percentual}%` }} role="progressbar" aria-valuenow={progressoMod.percentual} aria-valuemin={0} aria-valuemax={100} />
              </div>
            </div>
          )}

          {loadMod ? (
            <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="skeleton h-14 rounded-xl" />)}</div>
          ) : modulos.length === 0 ? (
            <div className="empty-state">
              <p className="text-text-muted text-sm">Nenhum módulo encontrado para esta trilha.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {modulos.map((m) => {
                const status = m.progresso?.status || 'nao_iniciado';
                const s = STATUS_MODULO.find(s => s.value === status);
                return (
                  <button
                    key={m.id}
                    id={`modulo-${m.id}`}
                    onClick={() => handleModuloClick(m)}
                    className="card-hover w-full text-left p-4 flex items-center gap-3 group"
                    aria-label={`${m.titulo} — ${s?.label}. Clique para avançar status.`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 border-2 transition-all ${status === 'concluido' ? 'border-status-success bg-status-success/15' : status === 'em_andamento' ? 'border-gold-400 bg-gold-400/10' : 'border-bg-overlay bg-bg-elevated group-hover:border-cerulean-500/40'}`}>
                      {status === 'concluido' ? <CheckCircle size={16} className="text-status-success" /> : <Circle size={16} className={status === 'em_andamento' ? 'text-gold-400' : 'text-text-subtle'} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className={`text-sm font-medium ${status === 'concluido' ? 'text-text-muted line-through' : 'text-text-primary'}`}>{m.titulo}</div>
                      <div className={`text-xs mt-0.5 ${s?.color}`}>{s?.label}</div>
                    </div>
                    <span className="text-xs text-text-subtle font-display font-bold">{m.ordem}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* DESAFIOS */}
      {tab === 'desafios' && !semTrilha && (
        <div className="space-y-4">
          {progressoDes.total > 0 && (
            <div className="card card-body">
              <div className="flex justify-between mb-2">
                <span className="text-sm text-text-muted">{progressoDes.entregues} de {progressoDes.total} desafios entregues</span>
                <span className="text-sm font-bold text-gradient-gold font-display">{progressoDes.percentual}%</span>
              </div>
              <div className="progress-track">
                <div className="progress-fill-gold" style={{ width: `${progressoDes.percentual}%` }} role="progressbar" aria-valuenow={progressoDes.percentual} aria-valuemin={0} aria-valuemax={100} />
              </div>
            </div>
          )}

          {loadDes ? (
            <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="skeleton h-24 rounded-xl" />)}</div>
          ) : desafios.length === 0 ? (
            <div className="empty-state">
              <p className="text-text-muted text-sm">Nenhum desafio para esta trilha.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {desafios.map((d) => {
                const status = d.progresso?.status || 'nao_iniciado';
                const aberto = desafioAberto === d.id;
                return (
                  <div key={d.id} className={`card overflow-hidden ${status === 'entregue' ? 'border-status-success/20' : status === 'em_andamento' ? 'border-gold-400/20' : ''}`}>
                    <button
                      id={`desafio-${d.id}`}
                      className="w-full p-4 flex items-start gap-3 text-left hover:bg-bg-elevated transition-colors"
                      onClick={() => setDesafioAberto(aberto ? null : d.id)}
                      aria-expanded={aberto}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${status === 'entregue' ? 'bg-status-success/15' : status === 'em_andamento' ? 'bg-gold-400/15' : 'bg-bg-elevated'}`}>
                        <Zap size={15} className={status === 'entregue' ? 'text-status-success' : status === 'em_andamento' ? 'text-gold-400' : 'text-text-subtle'} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-text-primary text-sm">{d.titulo}</div>
                        <div className={`text-xs mt-0.5 ${status === 'entregue' ? 'text-status-success' : status === 'em_andamento' ? 'text-gold-400' : 'text-text-muted'}`}>
                          {STATUS_DESAFIO.find(s => s.value === status)?.label}
                          {d.progresso?.link_entrega && <span className="ml-2 text-cerulean-400">· Link enviado</span>}
                        </div>
                      </div>
                      {aberto ? <ChevronUp size={16} className="text-text-subtle flex-shrink-0" /> : <ChevronDown size={16} className="text-text-subtle flex-shrink-0" />}
                    </button>

                    {aberto && (
                      <div className="border-t border-bg-elevated p-4 space-y-4">
                        <p className="text-sm text-text-muted leading-relaxed">{d.descricao}</p>
                        {d.semana_alvo && (
                          <div className="flex items-center gap-1 text-xs text-text-subtle">
                            <Clock size={12} />Semana alvo: {d.semana_alvo}
                          </div>
                        )}
                        <div>
                          <label htmlFor={`link-${d.id}`} className="input-label">Link de entrega (GitHub, Figma, etc.)</label>
                          <input
                            id={`link-${d.id}`}
                            type="url"
                            className="input"
                            placeholder="https://github.com/seu-usuario/projeto"
                            value={linkForm[d.id] ?? d.progresso?.link_entrega ?? ''}
                            onChange={e => setLinkForm(f => ({ ...f, [d.id]: e.target.value }))}
                          />
                        </div>
                        <div className="flex gap-2 flex-wrap">
                          <select
                            id={`status-desafio-${d.id}`}
                            className="input !w-auto"
                            value={status}
                            onChange={e => handleDesafioSalvar(d, e.target.value)}
                          >
                            {STATUS_DESAFIO.map(s => (
                              <option key={s.value} value={s.value}>{s.label}</option>
                            ))}
                          </select>
                          <button onClick={() => setDesafioAberto(null)} className="btn-ghost">Fechar</button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { usePerfil } from '../contexts/PerfilContext';
import * as api from '../api';
import toast from 'react-hot-toast';
import { Calendar, AlertTriangle, CheckCircle, XCircle, Clock, ChevronDown, ChevronUp } from 'lucide-react';

export default function Frequencia() {
  const { perfilAtivo } = usePerfil();
  const qc = useQueryClient();
  const [semanaAberta, setSemanaAberta] = useState(null);
  const [salvando, setSalvando] = useState(null);
  const [forms, setForms] = useState({});

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['frequencia', perfilAtivo?.id],
    queryFn: () => api.obterFrequencia(perfilAtivo.id),
    enabled: !!perfilAtivo?.id,
  });

  const semanas = data?.data?.semanas || [];
  const metricas = data?.data?.metricas || {};
  const duracao = data?.data?.duracao_total || 12;

  const getForm = (semana) => forms[semana.numero_semana] || {
    presente: !!semana.presente,
    horas_dedicadas: semana.horas_dedicadas || 0,
    observacao: semana.observacao || '',
    data_referencia: semana.data_referencia || '',
  };

  const setForm = (num, key, val) => setForms(f => ({
    ...f, [num]: { ...getForm(semanas.find(s => s.numero_semana === num) || {}), ...f[num], [key]: val }
  }));

  const handleSalvar = async (semana) => {
    setSalvando(semana.numero_semana);
    const form = getForm(semana);
    try {
      await api.registrarSemana(perfilAtivo.id, semana.numero_semana, form);
      toast.success(`Semana ${semana.numero_semana} registrada.`);
      refetch();
      setSemanaAberta(null);
      setForms(f => { const n = { ...f }; delete n[semana.numero_semana]; return n; });
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Erro ao salvar.');
    } finally {
      setSalvando(null);
    }
  };

  const semanasComRisco = () => {
    let max = 0, atual = 0;
    for (const s of semanas) {
      if (!s.presente) { atual++; max = Math.max(max, atual); } else { atual = 0; }
    }
    return max;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="section-header">
        <div className="section-icon"><Calendar size={18} /></div>
        <h1 className="section-title">Frequência Semanal</h1>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-3 gap-3">
        <div className="card card-body text-center">
          <div className="text-2xl font-bold text-gradient-cerulean font-display">{metricas.percentual_presenca ?? 0}%</div>
          <div className="text-xs text-text-muted mt-1">Presença</div>
        </div>
        <div className="card card-body text-center">
          <div className="text-2xl font-bold text-gradient-cerulean font-display">{metricas.total_semanas_presentes ?? 0}</div>
          <div className="text-xs text-text-muted mt-1">Semanas presentes</div>
        </div>
        <div className="card card-body text-center">
          <div className="text-2xl font-bold text-gradient-gold font-display">{metricas.total_horas ?? 0}h</div>
          <div className="text-xs text-text-muted mt-1">Total de horas</div>
        </div>
      </div>

      {/* Alerta de risco */}
      {metricas.alerta_risco && (
        <div className="alert-danger" role="alert">
          <AlertTriangle size={18} className="flex-shrink-0" />
          <div>
            <div className="font-semibold">Risco de cancelamento de bolsa</div>
            <div className="text-xs mt-0.5 opacity-80">
              {metricas.max_consecutivas_sem_presenca} semanas consecutivas sem presença. O edital cancela bolsas por baixo engajamento por mais de um mês.
            </div>
          </div>
        </div>
      )}

      {/* Grade de semanas */}
      {isLoading ? (
        <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="skeleton h-14 rounded-xl" />)}</div>
      ) : (
        <div className="space-y-2">
          {semanas.map((semana) => {
            const aberta = semanaAberta === semana.numero_semana;
            const form = getForm(semana);
            const registrado = !!semana.registrado_em;

            return (
              <div key={semana.numero_semana} className={`card overflow-hidden transition-all ${registrado && semana.presente ? 'border-status-success/20' : registrado ? 'border-status-danger/15' : ''}`}>
                {/* Header da semana */}
                <button
                  id={`semana-${semana.numero_semana}`}
                  className="w-full flex items-center gap-3 p-4 text-left hover:bg-bg-elevated transition-colors"
                  onClick={() => setSemanaAberta(aberta ? null : semana.numero_semana)}
                  aria-expanded={aberta}
                >
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-sm font-bold font-display ${registrado && semana.presente ? 'bg-status-success/20 text-status-success' : registrado ? 'bg-status-danger/15 text-status-danger' : 'bg-bg-elevated text-text-muted'}`}>
                    {semana.numero_semana}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-text-primary text-sm">Semana {semana.numero_semana}</div>
                    {registrado ? (
                      <div className="text-xs text-text-muted flex items-center gap-2 mt-0.5">
                        {semana.presente
                          ? <><CheckCircle size={11} className="text-status-success" /> Presente · {semana.horas_dedicadas}h</>
                          : <><XCircle size={11} className="text-status-danger" /> Ausente</>
                        }
                      </div>
                    ) : (
                      <div className="text-xs text-text-subtle">Clique para registrar</div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {semana.horas_dedicadas > 0 && (
                      <span className="text-xs text-text-muted flex items-center gap-1">
                        <Clock size={11} /> {semana.horas_dedicadas}h
                      </span>
                    )}
                    {aberta ? <ChevronUp size={16} className="text-text-subtle" /> : <ChevronDown size={16} className="text-text-subtle" />}
                  </div>
                </button>

                {/* Formulário expandido */}
                {aberta && (
                  <div className="border-t border-bg-elevated px-4 pb-4 pt-3 space-y-4">
                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          id={`presente-${semana.numero_semana}`}
                          checked={form.presente}
                          onChange={e => setForm(semana.numero_semana, 'presente', e.target.checked)}
                          className="w-4 h-4 rounded accent-cerulean-500"
                        />
                        <span className="text-sm font-medium text-text-primary">Presente esta semana</span>
                      </label>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label htmlFor={`horas-${semana.numero_semana}`} className="input-label">Horas dedicadas</label>
                        <input
                          id={`horas-${semana.numero_semana}`}
                          type="number" min="0" max="168" step="0.5"
                          className="input"
                          value={form.horas_dedicadas}
                          onChange={e => setForm(semana.numero_semana, 'horas_dedicadas', parseFloat(e.target.value) || 0)}
                        />
                        <p className="text-xs text-text-subtle mt-1">Mín. sugerido: 8h/semana</p>
                      </div>
                      <div>
                        <label htmlFor={`data-${semana.numero_semana}`} className="input-label">Data de referência</label>
                        <input
                          id={`data-${semana.numero_semana}`}
                          type="date" className="input"
                          value={form.data_referencia}
                          onChange={e => setForm(semana.numero_semana, 'data_referencia', e.target.value)}
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor={`obs-${semana.numero_semana}`} className="input-label">Observação (opcional)</label>
                      <textarea
                        id={`obs-${semana.numero_semana}`}
                        rows={2}
                        className="input resize-none"
                        placeholder="O que você estudou ou praticou nesta semana?"
                        value={form.observacao}
                        onChange={e => setForm(semana.numero_semana, 'observacao', e.target.value)}
                      />
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleSalvar(semana)}
                        disabled={salvando === semana.numero_semana}
                        className="btn-primary"
                      >
                        {salvando === semana.numero_semana ? 'Salvando...' : 'Salvar semana'}
                      </button>
                      <button onClick={() => setSemanaAberta(null)} className="btn-ghost">Cancelar</button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

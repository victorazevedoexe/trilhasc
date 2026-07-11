import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as api from '../api';
import toast from 'react-hot-toast';
import { UserPlus, ArrowLeft, Info } from 'lucide-react';

export default function CriarPerfil() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    nome: '', cpf: '', data_nascimento: '', telefone: '',
    pin: '', tem_curso_superior: false,
  });
  const [loading, setLoading] = useState(false);
  const [erros, setErros] = useState({});

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const validar = () => {
    const e = {};
    if (!form.nome.trim()) e.nome = 'Nome é obrigatório.';
    if (form.cpf.replace(/\D/g, '').length !== 11) e.cpf = 'CPF deve ter 11 dígitos.';
    if (!form.data_nascimento) e.data_nascimento = 'Data de nascimento é obrigatória.';
    else {
      const idade = (Date.now() - new Date(form.data_nascimento)) / (1000*60*60*24*365.25);
      if (idade < 16) e.data_nascimento = 'O candidato deve ter pelo menos 16 anos.';
    }
    if (form.pin && !/^\d{4}$/.test(form.pin)) e.pin = 'PIN deve ter exatamente 4 dígitos numéricos.';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const e2 = validar();
    setErros(e2);
    if (Object.keys(e2).length > 0) return;
    setLoading(true);
    try {
      await api.criarPerfil({
        nome: form.nome.trim(),
        cpf: form.cpf.replace(/\D/g, ''),
        data_nascimento: form.data_nascimento,
        telefone: form.telefone || undefined,
        pin: form.pin || undefined,
        tem_curso_superior: form.tem_curso_superior,
      });
      toast.success('Perfil criado com sucesso!');
      navigate('/perfis');
    } catch (err) {
      const msg = err.response?.data?.error?.message || 'Erro ao criar perfil.';
      if (msg.includes('15 perfis')) {
        toast.error('Limite de 15 perfis por conta atingido.');
      } else {
        toast.error(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const formatCPF = (v) => {
    const d = v.replace(/\D/g, '').slice(0, 11);
    return d.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  };

  return (
    <div className="min-h-screen bg-ocean p-4">
      <div className="max-w-md mx-auto">
        <button onClick={() => navigate('/perfis')} className="btn-ghost btn-sm flex items-center gap-1 mb-6 -ml-1">
          <ArrowLeft size={16} /> Voltar
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="section-icon"><UserPlus size={18} /></div>
          <h1 className="text-2xl font-bold text-text-primary font-display">Criar Perfil</h1>
        </div>

        <div className="card card-body space-y-5">
          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            {/* Dados pessoais */}
            <div>
              <label htmlFor="cp-nome" className="input-label">Nome completo *</label>
              <input id="cp-nome" type="text" className={`input ${erros.nome ? 'input-error' : ''}`}
                placeholder="João da Silva" value={form.nome} onChange={e => set('nome', e.target.value)} />
              {erros.nome && <p className="text-xs text-status-danger mt-1">{erros.nome}</p>}
            </div>

            <div>
              <label htmlFor="cp-cpf" className="input-label">CPF *</label>
              <input id="cp-cpf" type="text" inputMode="numeric" className={`input ${erros.cpf ? 'input-error' : ''}`}
                placeholder="000.000.000-00" value={form.cpf}
                onChange={e => set('cpf', formatCPF(e.target.value))} />
              {erros.cpf && <p className="text-xs text-status-danger mt-1">{erros.cpf}</p>}
            </div>

            <div>
              <label htmlFor="cp-nascimento" className="input-label">Data de nascimento * (mín. 16 anos)</label>
              <input id="cp-nascimento" type="date" className={`input ${erros.data_nascimento ? 'input-error' : ''}`}
                value={form.data_nascimento} onChange={e => set('data_nascimento', e.target.value)}
                max={new Date(Date.now() - 16*365.25*24*60*60*1000).toISOString().split('T')[0]} />
              {erros.data_nascimento && <p className="text-xs text-status-danger mt-1">{erros.data_nascimento}</p>}
            </div>

            <div>
              <label htmlFor="cp-telefone" className="input-label">Telefone (opcional)</label>
              <input id="cp-telefone" type="tel" className="input" placeholder="(98) 99999-9999"
                value={form.telefone} onChange={e => set('telefone', e.target.value)} />
            </div>

            {/* Documento condicional */}
            <div className="p-4 rounded-xl bg-bg-deep border border-cerulean-500/15">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  id="cp-curso-superior"
                  type="checkbox"
                  className="mt-0.5 w-4 h-4 rounded border-cerulean-500/40 bg-bg-deep accent-cerulean-500"
                  checked={form.tem_curso_superior}
                  onChange={e => set('tem_curso_superior', e.target.checked)}
                />
                <div>
                  <span className="text-sm font-medium text-text-primary">
                    Já concluí ou estou cursando ensino superior em área diferente das trilhas
                  </span>
                  <p className="text-xs text-text-muted mt-1 flex items-start gap-1">
                    <Info size={12} className="flex-shrink-0 mt-0.5" />
                    Isso inclui o documento de declaração/diploma no checklist de inscrição.
                  </p>
                </div>
              </label>
            </div>

            {/* PIN opcional */}
            <div>
              <label htmlFor="cp-pin" className="input-label">PIN de proteção (opcional, 4 dígitos)</label>
              <input id="cp-pin" type="password" inputMode="numeric" pattern="[0-9]{4}" maxLength={4}
                className={`input tracking-widest text-center ${erros.pin ? 'input-error' : ''}`}
                placeholder="• • • •" value={form.pin}
                onChange={e => set('pin', e.target.value.replace(/\D/g, '').slice(0, 4))} />
              {erros.pin ? (
                <p className="text-xs text-status-danger mt-1">{erros.pin}</p>
              ) : (
                <p className="text-xs text-text-muted mt-1">Protege seu perfil de outros usuários da mesma conta.</p>
              )}
            </div>

            <button type="submit" id="btn-criar-perfil" disabled={loading} className="btn-primary btn-lg w-full">
              {loading ? (
                <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Criando...</span>
              ) : (
                <span className="flex items-center gap-2"><UserPlus size={18} /> Criar perfil</span>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

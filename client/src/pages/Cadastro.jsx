import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Waves, Eye, EyeOff, ArrowRight, ArrowLeft } from 'lucide-react';

export default function Cadastro() {
  const { cadastro } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [showSenha, setShowSenha] = useState(false);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro('');
    if (senha !== confirmar) { setErro('As senhas não coincidem.'); return; }
    if (senha.length < 8) { setErro('A senha deve ter pelo menos 8 caracteres.'); return; }
    setLoading(true);
    try {
      await cadastro(email, senha);
      navigate('/perfis/novo');
    } catch (err) {
      setErro(err.response?.data?.error?.message || 'Erro ao criar conta. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-ocean flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-cerulean-500/5 blur-3xl" />
      </div>

      <div className="w-full max-w-sm relative z-10 animate-slide-up">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-cerulean shadow-glow-cerulean mb-4">
            <Waves size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-text-primary font-display">Criar conta</h1>
          <p className="text-sm text-text-muted mt-1">Trilhas Inova 3 — Portal do Candidato</p>
        </div>

        <div className="card card-body">
          <h2 className="text-lg font-bold text-text-primary font-display mb-5">Dados de acesso</h2>

          {erro && (
            <div className="alert-danger mb-4 text-xs" role="alert">
              <span>{erro}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <label htmlFor="cadastro-email" className="input-label">Email</label>
              <input id="cadastro-email" type="email" className="input" placeholder="seu@email.com" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <div>
              <label htmlFor="cadastro-senha" className="input-label">Senha (mín. 8 caracteres)</label>
              <div className="relative">
                <input id="cadastro-senha" type={showSenha ? 'text' : 'password'} className="input pr-10" placeholder="••••••••" value={senha} onChange={e => setSenha(e.target.value)} required />
                <button type="button" onClick={() => setShowSenha(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-subtle hover:text-text-primary transition-colors" aria-label={showSenha ? 'Ocultar' : 'Mostrar'}>
                  {showSenha ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div>
              <label htmlFor="cadastro-confirmar" className="input-label">Confirmar senha</label>
              <input id="cadastro-confirmar" type={showSenha ? 'text' : 'password'} className={`input ${confirmar && confirmar !== senha ? 'input-error' : ''}`} placeholder="••••••••" value={confirmar} onChange={e => setConfirmar(e.target.value)} required />
              {confirmar && confirmar !== senha && <p className="text-xs text-status-danger mt-1">Senhas não coincidem</p>}
            </div>

            <button type="submit" id="btn-cadastro" disabled={loading || !email || !senha || senha !== confirmar} className="btn-primary btn-lg w-full mt-2">
              {loading ? (
                <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Criando...</span>
              ) : (
                <span className="flex items-center gap-2">Criar conta <ArrowRight size={16} /></span>
              )}
            </button>
          </form>

          <div className="mt-5 pt-4 border-t border-bg-elevated text-center">
            <Link to="/login" className="text-sm text-cerulean-400 hover:text-cerulean-300 flex items-center justify-center gap-1 transition-colors">
              <ArrowLeft size={14} /> Já tenho conta
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

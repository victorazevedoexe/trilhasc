import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { Waves, Eye, EyeOff, ArrowRight } from 'lucide-react';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [showSenha, setShowSenha] = useState(false);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro('');
    setLoading(true);
    try {
      await login(email, senha);
      navigate('/perfis');
    } catch (err) {
      setErro(err.response?.data?.error?.message || 'Erro ao fazer login. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-ocean flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-cerulean-500/5 blur-3xl" />
        <div className="absolute bottom-0 left-0 right-0 h-48 wave-divider opacity-30" />
      </div>

      <div className="w-full max-w-sm relative z-10 animate-slide-up">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-cerulean shadow-glow-cerulean mb-4">
            <Waves size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-text-primary font-display">Trilhas Inova 3</h1>
          <p className="text-sm text-text-muted mt-1">Seu portal do candidato — SECTI/FAPEMA · MA</p>
        </div>

        {/* Form */}
        <div className="card card-body">
          <h2 className="text-lg font-bold text-text-primary font-display mb-5">Entrar na conta</h2>

          {erro && (
            <div className="alert-danger mb-4 text-xs" role="alert">
              <span>{erro}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <label htmlFor="login-email" className="input-label">Email</label>
              <input
                id="login-email"
                type="email"
                className="input"
                placeholder="seu@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>

            <div>
              <label htmlFor="login-senha" className="input-label">Senha</label>
              <div className="relative">
                <input
                  id="login-senha"
                  type={showSenha ? 'text' : 'password'}
                  className="input pr-10"
                  placeholder="••••••••"
                  value={senha}
                  onChange={e => setSenha(e.target.value)}
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowSenha(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-subtle hover:text-text-primary transition-colors"
                  aria-label={showSenha ? 'Ocultar senha' : 'Mostrar senha'}
                >
                  {showSenha ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              id="btn-login"
              disabled={loading || !email || !senha}
              className="btn-primary btn-lg w-full mt-2"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Entrando...
                </span>
              ) : (
                <span className="flex items-center gap-2">Entrar <ArrowRight size={16} /></span>
              )}
            </button>
          </form>

          <div className="mt-5 pt-4 border-t border-bg-elevated text-center">
            <p className="text-sm text-text-muted">
              Não tem conta?{' '}
              <Link to="/cadastro" className="text-cerulean-400 hover:text-cerulean-300 font-semibold transition-colors">
                Criar conta grátis
              </Link>
            </p>
          </div>
        </div>

        <p className="text-center text-xs text-text-subtle mt-6 leading-relaxed">
          Sistema não-oficial de organização pessoal.<br/>
          Não substitui o site oficial{' '}
          <a href="https://inova.ma.gov.br" target="_blank" rel="noopener noreferrer" className="text-cerulean-400 hover:underline">
            inova.ma.gov.br
          </a>
        </p>
      </div>
    </div>
  );
}

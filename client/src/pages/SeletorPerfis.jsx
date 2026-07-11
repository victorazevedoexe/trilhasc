import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { listarPerfis } from '../api';
import { usePerfil } from '../contexts/PerfilContext';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { Plus, Crown, User, Lock, Waves, LogOut, ChevronRight, Users } from 'lucide-react';
import * as api from '../api';

function PinModal({ perfil, onSuccess, onCancel }) {
  const [pin, setPin] = useState('');
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro('');
    setLoading(true);
    try {
      await api.verificarPin(perfil.id, pin);
      onSuccess();
    } catch (err) {
      setErro(err.response?.data?.error?.message || 'PIN incorreto.');
      setPin('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label={`PIN do perfil ${perfil.nome}`}>
      <div className="card card-body w-full max-w-xs animate-slide-up">
        <div className="text-center mb-5">
          <div className="w-12 h-12 rounded-full bg-gradient-cerulean flex items-center justify-center text-white text-xl font-bold mx-auto mb-3">
            {perfil.nome[0].toUpperCase()}
          </div>
          <h2 className="font-bold text-text-primary font-display">{perfil.nome}</h2>
          <p className="text-sm text-text-muted mt-1">Digite o PIN de 4 dígitos</p>
        </div>
        {erro && <div className="alert-danger mb-4 text-xs text-center">{erro}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            id="pin-input"
            type="password"
            inputMode="numeric"
            pattern="[0-9]{4}"
            maxLength={4}
            className="input text-center text-2xl tracking-widest"
            placeholder="• • • •"
            value={pin}
            onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
            autoFocus
            required
          />
          <button type="submit" disabled={pin.length < 4 || loading} className="btn-primary w-full">
            {loading ? 'Verificando...' : 'Entrar'}
          </button>
          <button type="button" onClick={onCancel} className="btn-ghost w-full">Cancelar</button>
        </form>
      </div>
    </div>
  );
}

export default function SeletorPerfis() {
  const { logout } = useAuth();
  const { selecionarPerfil } = usePerfil();
  const navigate = useNavigate();
  const [pinPerfil, setPinPerfil] = useState(null);

  const { data, isLoading, error } = useQuery({ queryKey: ['perfis'], queryFn: listarPerfis });
  const perfis = data?.data?.perfis || [];

  const handleSelecionar = (perfil) => {
    if (perfil.tem_pin) {
      setPinPerfil(perfil);
    } else {
      selecionarPerfil(perfil);
      navigate('/dashboard');
    }
  };

  const handlePinSuccess = () => {
    selecionarPerfil(pinPerfil);
    navigate('/dashboard');
    setPinPerfil(null);
  };

  return (
    <div className="min-h-screen bg-ocean p-4">
      {pinPerfil && (
        <PinModal
          perfil={pinPerfil}
          onSuccess={handlePinSuccess}
          onCancel={() => setPinPerfil(null)}
        />
      )}

      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between py-5 mb-2">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-cerulean flex items-center justify-center shadow-glow-cerulean">
              <Waves size={18} className="text-white" />
            </div>
            <div>
              <div className="text-sm font-bold text-text-primary font-display">Trilhas Inova 3</div>
              <div className="text-xs text-text-muted">Quem está usando agora?</div>
            </div>
          </div>
          <button onClick={() => { logout(); navigate('/login'); }} className="btn-ghost btn-sm flex items-center gap-1" aria-label="Sair">
            <LogOut size={14} /> Sair
          </button>
        </div>

        <h1 className="text-2xl font-bold text-text-primary font-display mb-6">
          Selecionar Perfil
        </h1>

        {isLoading && (
          <div className="space-y-3">
            {[1,2,3].map(i => <div key={i} className="skeleton h-20 rounded-xl2" />)}
          </div>
        )}

        {error && (
          <div className="alert-danger">Erro ao carregar perfis. Tente recarregar a página.</div>
        )}

        {!isLoading && perfis.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon"><Users size={32} /></div>
            <p className="text-text-muted text-sm">Nenhum perfil criado ainda.<br/>Crie seu primeiro perfil para começar.</p>
          </div>
        )}

        <div className="space-y-3">
          {perfis.map(perfil => (
            <button
              key={perfil.id}
              id={`btn-perfil-${perfil.id}`}
              onClick={() => handleSelecionar(perfil)}
              className="card-hover w-full text-left p-4 flex items-center gap-4 group"
            >
              <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white text-lg font-bold flex-shrink-0 ${perfil.papel === 'titular' ? 'bg-gradient-gold' : 'bg-gradient-cerulean'}`}>
                {perfil.nome[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-text-primary truncate">{perfil.nome}</span>
                  {perfil.papel === 'titular' && <Crown size={14} className="text-gold-400 flex-shrink-0" aria-label="Titular" />}
                  {perfil.tem_pin && <Lock size={12} className="text-text-subtle flex-shrink-0" aria-label="Protegido por PIN" />}
                </div>
                <div className="text-xs text-text-muted mt-0.5">
                  {perfil.trilha_slug ? `Trilha: ${perfil.trilha_slug.replace('-', ' ')}` : 'Trilha não selecionada'}
                </div>
              </div>
              <ChevronRight size={18} className="text-text-subtle group-hover:text-cerulean-400 transition-colors flex-shrink-0" />
            </button>
          ))}
        </div>

        {/* Adicionar perfil */}
        {perfis.length < 15 && (
          <Link
            to="/perfis/novo"
            id="btn-novo-perfil"
            className="mt-4 flex items-center gap-3 p-4 rounded-xl border-2 border-dashed border-cerulean-500/20 hover:border-cerulean-500/40 hover:bg-cerulean-500/5 transition-all text-text-muted hover:text-cerulean-400 group"
          >
            <div className="w-12 h-12 rounded-full bg-bg-elevated border-2 border-dashed border-cerulean-500/30 flex items-center justify-center group-hover:border-cerulean-500/60 transition-colors">
              <Plus size={20} />
            </div>
            <div>
              <div className="font-semibold text-sm">Adicionar perfil</div>
              <div className="text-xs opacity-70">{15 - perfis.length} vagas disponíveis</div>
            </div>
          </Link>
        )}

        {perfis.length >= 15 && (
          <div className="alert-warning mt-4 text-xs">
            Limite de 15 perfis por conta atingido.
          </div>
        )}
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { formatDistanceToNow, isPast, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Clock, CheckCircle, AlertCircle } from 'lucide-react';

const PRAZOS = [
  { id: 'inscricoes', label: 'Prazo para Inscrições', data: new Date('2026-07-16T14:00:00-03:00'), tipo: 'urgente' },
  { id: 'desafio', label: 'Desafio de Seleção', data: new Date('2026-07-24T08:00:00-03:00'), complemento: 'das 8h às 18h', tipo: 'importante' },
  { id: 'aprovados', label: 'Lista Final de Aprovados', data: new Date('2026-07-30T00:00:00-03:00'), complemento: 'a partir de', tipo: 'normal' },
  { id: 'contratacao', label: 'Início da Contratação', data: new Date('2026-08-05T00:00:00-03:00'), complemento: 'a partir de', tipo: 'normal' },
  { id: 'onboarding', label: 'Onboarding na Plataforma', data: new Date('2026-08-11T00:00:00-03:00'), complemento: 'a partir de', tipo: 'normal' },
  { id: 'encerramento', label: 'Encerramento do Programa', data: new Date('2026-12-31T23:59:00-03:00'), complemento: 'dezembro/2026', tipo: 'normal' },
];

function useCountdown(targetDate) {
  const [timeLeft, setTimeLeft] = useState(calcTimeLeft(targetDate));

  function calcTimeLeft(target) {
    const diff = target - Date.now();
    if (diff <= 0) return null;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    return { days, hours, minutes, seconds };
  }

  useEffect(() => {
    const timer = setInterval(() => setTimeLeft(calcTimeLeft(targetDate)), 1000);
    return () => clearInterval(timer);
  }, [targetDate]);

  return timeLeft;
}

function ProximoPrazo({ prazo }) {
  const countdown = useCountdown(prazo.data);

  return (
    <div className="card card-gold-accent p-5 animate-slide-up">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-8 h-8 rounded-lg bg-gold-400/15 flex items-center justify-center flex-shrink-0">
          <Clock size={16} className="text-gold-400" />
        </div>
        <div>
          <div className="text-xs font-semibold text-gold-400 uppercase tracking-wider mb-0.5">Próximo Prazo</div>
          <div className="font-bold text-text-primary font-display">{prazo.label}</div>
          {prazo.complemento && <div className="text-xs text-text-muted mt-0.5">{prazo.complemento}</div>}
        </div>
      </div>

      {countdown ? (
        <div className="grid grid-cols-4 gap-2">
          {[
            { val: countdown.days, label: 'dias' },
            { val: countdown.hours, label: 'horas' },
            { val: countdown.minutes, label: 'min' },
            { val: countdown.seconds, label: 'seg' },
          ].map(({ val, label }) => (
            <div key={label} className="bg-bg-deep rounded-xl p-2 text-center">
              <div className="text-xl font-bold text-gradient-gold font-display">{String(val).padStart(2, '0')}</div>
              <div className="text-xs text-text-muted mt-0.5">{label}</div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex items-center gap-2 text-sm text-text-muted">
          <CheckCircle size={16} className="text-status-success" />
          <span>Prazo encerrado</span>
        </div>
      )}
    </div>
  );
}

export default function CountdownWidget() {
  const agora = new Date();
  const proximo = PRAZOS.find(p => p.data > agora);

  return (
    <div className="space-y-4">
      {/* Próximo prazo com countdown */}
      {proximo && <ProximoPrazo prazo={proximo} />}

      {/* Lista de todos os prazos */}
      <div className="card">
        <div className="card-body">
          <div className="section-header !mb-4">
            <div className="section-icon">
              <AlertCircle size={18} />
            </div>
            <h3 className="section-title text-base">Calendário Oficial do Edital</h3>
          </div>
          <div className="space-y-2">
            {PRAZOS.map((prazo) => {
              const passou = isPast(prazo.data);
              return (
                <div
                  key={prazo.id}
                  className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${passou ? 'opacity-50' : 'hover:bg-bg-elevated'}`}
                >
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${passou ? 'bg-text-subtle' : prazo === proximo ? 'bg-gold-400 animate-pulse-soft' : 'bg-cerulean-500'}`} />
                  <div className="flex-1 min-w-0">
                    <div className={`text-sm font-medium ${passou ? 'text-text-muted line-through' : 'text-text-primary'}`}>
                      {prazo.label}
                    </div>
                    <div className="text-xs text-text-muted">
                      {prazo.complemento && `${prazo.complemento} `}
                      {format(prazo.data, "dd/MM/yyyy", { locale: ptBR })}
                    </div>
                  </div>
                  {passou ? (
                    <span className="badge-muted text-xs">Encerrado</span>
                  ) : prazo === proximo ? (
                    <span className="badge-warning">Próximo</span>
                  ) : (
                    <span className="text-xs text-text-muted tabular-nums">
                      {formatDistanceToNow(prazo.data, { locale: ptBR, addSuffix: true })}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

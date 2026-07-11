import { createContext, useContext, useState, useCallback } from 'react';

const PerfilContext = createContext(null);

export function PerfilProvider({ children }) {
  const [perfilAtivo, setPerfilAtivo] = useState(() => {
    const stored = localStorage.getItem('perfilAtivo');
    return stored ? JSON.parse(stored) : null;
  });

  const selecionarPerfil = useCallback((perfil) => {
    localStorage.setItem('perfilAtivo', JSON.stringify(perfil));
    setPerfilAtivo(perfil);
  }, []);

  const limparPerfil = useCallback(() => {
    localStorage.removeItem('perfilAtivo');
    setPerfilAtivo(null);
  }, []);

  return (
    <PerfilContext.Provider value={{ perfilAtivo, selecionarPerfil, limparPerfil }}>
      {children}
    </PerfilContext.Provider>
  );
}

export const usePerfil = () => {
  const ctx = useContext(PerfilContext);
  if (!ctx) throw new Error('usePerfil must be used within PerfilProvider');
  return ctx;
};

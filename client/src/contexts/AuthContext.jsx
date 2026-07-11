import { createContext, useContext, useState, useCallback } from 'react';
import * as authApi from '../api/auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [conta, setConta] = useState(() => {
    const stored = localStorage.getItem('conta');
    return stored ? JSON.parse(stored) : null;
  });

  const loginFn = useCallback(async (email, senha) => {
    const { data } = await authApi.login(email, senha);
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    localStorage.setItem('conta', JSON.stringify(data.conta));
    setConta(data.conta);
    return data;
  }, []);

  const cadastroFn = useCallback(async (email, senha) => {
    const { data } = await authApi.cadastro(email, senha);
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    localStorage.setItem('conta', JSON.stringify(data.conta));
    setConta(data.conta);
    return data;
  }, []);

  const logout = useCallback(() => {
    localStorage.clear();
    setConta(null);
  }, []);

  return (
    <AuthContext.Provider value={{ conta, login: loginFn, cadastro: cadastroFn, logout, isAuthenticated: !!conta }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

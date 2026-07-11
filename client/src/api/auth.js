import api from './client';

export const cadastro = (email, senha) => api.post('/auth/cadastro', { email, senha });
export const login = (email, senha) => api.post('/auth/login', { email, senha });
export const refresh = (refreshToken) => api.post('/auth/refresh', { refreshToken });

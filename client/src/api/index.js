import api from './client';

export const listarPerfis = () => api.get('/perfis');
export const criarPerfil = (data) => api.post('/perfis', data);
export const obterPerfil = (id) => api.get(`/perfis/${id}`);
export const atualizarPerfil = (id, data) => api.patch(`/perfis/${id}`, data);
export const deletarPerfil = (id) => api.delete(`/perfis/${id}`);
export const verificarPin = (id, pin) => api.post(`/perfis/${id}/verificar-pin`, { pin });
export const atualizarTrilha = (id, trilha_slug) => api.patch(`/perfis/${id}/trilha`, { trilha_slug });

// Documentos
export const listarDocumentos = (perfilId) => api.get(`/perfis/${perfilId}/documentos`);
// Salva a URL retornada pelo Uploadthing no banco de dados
export const salvarUrlDocumento = (perfilId, codigo, data) => api.post(`/perfis/${perfilId}/documentos/${codigo}`, data);
export const deletarDocumento = (perfilId, codigo) => api.delete(`/perfis/${perfilId}/documentos/${codigo}`);

// Frequência
export const obterFrequencia = (perfilId) => api.get(`/perfis/${perfilId}/frequencia`);
export const registrarSemana = (perfilId, semana, data) => api.put(`/perfis/${perfilId}/frequencia/${semana}`, data);

// Módulos
export const listarModulos = (perfilId) => api.get(`/perfis/${perfilId}/modulos`);
export const atualizarModulo = (perfilId, moduloId, status) => api.patch(`/perfis/${perfilId}/modulos/${moduloId}`, { status });

// Desafios
export const listarDesafios = (perfilId) => api.get(`/perfis/${perfilId}/desafios`);
export const atualizarDesafio = (perfilId, desafioId, data) => api.patch(`/perfis/${perfilId}/desafios/${desafioId}`, data);

// Dashboard
export const obterDashboard = (perfilId) => api.get(`/perfis/${perfilId}/dashboard`);
export const obterDashboardGrupo = () => api.get('/dashboard/grupo');

// Trilhas
export const listarTrilhas = () => api.get('/trilhas');
export const obterTrilha = (slug) => api.get(`/trilhas/${slug}`);

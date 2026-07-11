const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config');
const { getDb } = require('../db');

function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Token de acesso ausente.' } });
  }
  const token = authHeader.slice(7);
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.conta = { id: payload.conta_id, email: payload.email };
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: { code: 'TOKEN_EXPIRED', message: 'Token expirado. Faça login novamente.' } });
    }
    return res.status(401).json({ error: { code: 'INVALID_TOKEN', message: 'Token inválido.' } });
  }
}

// Middleware: valida que o perfil_id pertence à conta autenticada
function requirePerfil(req, res, next) {
  const perfilId = parseInt(req.params.perfilId || req.params.id, 10);
  if (isNaN(perfilId)) {
    return res.status(400).json({ error: { code: 'INVALID_PERFIL_ID', message: 'ID de perfil inválido.' } });
  }
  const db = getDb();
  const perfil = db.prepare('SELECT id, conta_id, papel FROM perfis WHERE id = ?').get(perfilId);
  if (!perfil) {
    return res.status(404).json({ error: { code: 'PERFIL_NOT_FOUND', message: 'Perfil não encontrado.' } });
  }
  if (perfil.conta_id !== req.conta.id) {
    return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Acesso negado a este perfil.' } });
  }
  req.perfil = perfil;
  next();
}

module.exports = { requireAuth, requirePerfil };

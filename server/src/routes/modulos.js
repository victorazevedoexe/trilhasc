const { Router } = require('express');
const { getDb } = require('../db');
const { requireAuth, requirePerfil } = require('../middleware/auth');

const router = Router({ mergeParams: true });

// GET /perfis/:perfilId/modulos — lista módulos da trilha do perfil com progresso
router.get('/', requireAuth, requirePerfil, (req, res) => {
  const db = getDb();
  const perfil = db.prepare('SELECT trilha_slug FROM perfis WHERE id = ?').get(req.perfil.id);
  if (!perfil.trilha_slug) {
    return res.json({ modulos: [], trilha_slug: null, progresso: { total: 0, concluidos: 0, percentual: 0 } });
  }

  const modulos = db.prepare('SELECT * FROM modulos WHERE trilha_slug = ? ORDER BY ordem').all(perfil.trilha_slug);
  const progressos = db.prepare('SELECT * FROM modulo_progresso WHERE perfil_id = ?').all(req.perfil.id);
  const progressoMap = {};
  for (const p of progressos) progressoMap[p.modulo_id] = p;

  const lista = modulos.map(m => ({
    ...m,
    progresso: progressoMap[m.id] || { status: 'nao_iniciado', concluido_em: null },
  }));

  const concluidos = lista.filter(m => m.progresso.status === 'concluido').length;
  res.json({
    modulos: lista,
    trilha_slug: perfil.trilha_slug,
    progresso: { total: modulos.length, concluidos, percentual: modulos.length > 0 ? Math.round((concluidos / modulos.length) * 100) : 0 },
  });
});

// PATCH /perfis/:perfilId/modulos/:moduloId — atualizar status de módulo
router.patch('/:moduloId', requireAuth, requirePerfil, (req, res) => {
  const moduloId = parseInt(req.params.moduloId, 10);
  const { status } = req.body;
  const VALID_STATUS = ['nao_iniciado', 'em_andamento', 'concluido'];
  if (!VALID_STATUS.includes(status)) {
    return res.status(400).json({ error: { code: 'INVALID_STATUS', message: `Status deve ser: ${VALID_STATUS.join(', ')}.` } });
  }

  const db = getDb();
  const perfil = db.prepare('SELECT trilha_slug FROM perfis WHERE id = ?').get(req.perfil.id);
  const modulo = db.prepare('SELECT id, trilha_slug FROM modulos WHERE id = ?').get(moduloId);
  if (!modulo || modulo.trilha_slug !== perfil.trilha_slug) {
    return res.status(404).json({ error: { code: 'MODULO_NOT_FOUND', message: 'Módulo não encontrado na trilha do perfil.' } });
  }

  const existente = db.prepare('SELECT id FROM modulo_progresso WHERE perfil_id = ? AND modulo_id = ?').get(req.perfil.id, moduloId);
  const concluido_em = status === 'concluido' ? new Date().toISOString() : null;
  if (existente) {
    db.prepare('UPDATE modulo_progresso SET status = ?, concluido_em = ? WHERE id = ?').run(status, concluido_em, existente.id);
  } else {
    db.prepare('INSERT INTO modulo_progresso (perfil_id, modulo_id, status, concluido_em) VALUES (?, ?, ?, ?)').run(req.perfil.id, moduloId, status, concluido_em);
  }

  const prog = db.prepare('SELECT * FROM modulo_progresso WHERE perfil_id = ? AND modulo_id = ?').get(req.perfil.id, moduloId);
  res.json({ progresso: prog });
});

module.exports = router;

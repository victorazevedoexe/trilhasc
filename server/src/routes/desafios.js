const { Router } = require('express');
const { getDb } = require('../db');
const { requireAuth, requirePerfil } = require('../middleware/auth');

const router = Router({ mergeParams: true });

// GET /perfis/:perfilId/desafios
router.get('/', requireAuth, requirePerfil, (req, res) => {
  const db = getDb();
  const perfil = db.prepare('SELECT trilha_slug FROM perfis WHERE id = ?').get(req.perfil.id);
  if (!perfil.trilha_slug) {
    return res.json({ desafios: [], progresso: { total: 0, entregues: 0, percentual: 0 } });
  }

  const desafios = db.prepare('SELECT * FROM desafios WHERE trilha_slug = ? ORDER BY ordem').all(perfil.trilha_slug);
  const progressos = db.prepare('SELECT * FROM desafio_progresso WHERE perfil_id = ?').all(req.perfil.id);
  const progressoMap = {};
  for (const p of progressos) progressoMap[p.desafio_id] = p;

  const lista = desafios.map(d => ({
    ...d,
    progresso: progressoMap[d.id] || { status: 'nao_iniciado', link_entrega: null, entregue_em: null },
  }));

  const entregues = lista.filter(d => d.progresso.status === 'entregue').length;
  res.json({
    desafios: lista,
    progresso: { total: desafios.length, entregues, percentual: desafios.length > 0 ? Math.round((entregues / desafios.length) * 100) : 0 },
  });
});

// PATCH /perfis/:perfilId/desafios/:desafioId
router.patch('/:desafioId', requireAuth, requirePerfil, (req, res) => {
  const desafioId = parseInt(req.params.desafioId, 10);
  const { status, link_entrega } = req.body;
  const VALID_STATUS = ['nao_iniciado', 'em_andamento', 'entregue'];
  if (!VALID_STATUS.includes(status)) {
    return res.status(400).json({ error: { code: 'INVALID_STATUS', message: `Status deve ser: ${VALID_STATUS.join(', ')}.` } });
  }

  const db = getDb();
  const perfil = db.prepare('SELECT trilha_slug FROM perfis WHERE id = ?').get(req.perfil.id);
  const desafio = db.prepare('SELECT id, trilha_slug FROM desafios WHERE id = ?').get(desafioId);
  if (!desafio || desafio.trilha_slug !== perfil.trilha_slug) {
    return res.status(404).json({ error: { code: 'DESAFIO_NOT_FOUND', message: 'Desafio não encontrado na trilha do perfil.' } });
  }

  const existente = db.prepare('SELECT id FROM desafio_progresso WHERE perfil_id = ? AND desafio_id = ?').get(req.perfil.id, desafioId);
  const entregue_em = status === 'entregue' ? new Date().toISOString() : null;
  if (existente) {
    db.prepare('UPDATE desafio_progresso SET status = ?, link_entrega = ?, entregue_em = ? WHERE id = ?').run(status, link_entrega || null, entregue_em, existente.id);
  } else {
    db.prepare('INSERT INTO desafio_progresso (perfil_id, desafio_id, status, link_entrega, entregue_em) VALUES (?, ?, ?, ?, ?)').run(req.perfil.id, desafioId, status, link_entrega || null, entregue_em);
  }

  const prog = db.prepare('SELECT * FROM desafio_progresso WHERE perfil_id = ? AND desafio_id = ?').get(req.perfil.id, desafioId);
  res.json({ progresso: prog });
});

module.exports = router;

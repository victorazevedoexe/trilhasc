const { Router } = require('express');
const { q, qOne, run } = require('../db');
const { requireAuth, requirePerfil } = require('../middleware/auth');

const router = Router({ mergeParams: true });

router.get('/', requireAuth, requirePerfil, async (req, res, next) => {
  try {
    const perfil = await qOne('SELECT trilha_slug FROM perfis WHERE id = ?', [req.perfil.id]);
    if (!perfil.trilha_slug) return res.json({ desafios: [], progresso: { total: 0, entregues: 0, percentual: 0 } });

    const desafios = await q('SELECT * FROM desafios WHERE trilha_slug = ? ORDER BY ordem', [perfil.trilha_slug]);
    const progressos = await q('SELECT * FROM desafio_progresso WHERE perfil_id = ?', [req.perfil.id]);
    const progressoMap = {};
    for (const p of progressos) progressoMap[p.desafio_id] = p;

    const lista = desafios.map(d => ({ ...d, progresso: progressoMap[d.id] || { status: 'nao_iniciado', link_entrega: null, entregue_em: null } }));
    const entregues = lista.filter(d => d.progresso.status === 'entregue').length;
    res.json({
      desafios: lista,
      progresso: { total: desafios.length, entregues, percentual: desafios.length > 0 ? Math.round((entregues / desafios.length) * 100) : 0 },
    });
  } catch (err) { next(err); }
});

router.patch('/:desafioId', requireAuth, requirePerfil, async (req, res, next) => {
  try {
    const desafioId = parseInt(req.params.desafioId, 10);
    const { status, link_entrega } = req.body;
    if (!['nao_iniciado', 'em_andamento', 'entregue'].includes(status)) {
      return res.status(400).json({ error: { code: 'INVALID_STATUS', message: 'Status inválido.' } });
    }
    const perfil = await qOne('SELECT trilha_slug FROM perfis WHERE id = ?', [req.perfil.id]);
    const desafio = await qOne('SELECT id, trilha_slug FROM desafios WHERE id = ?', [desafioId]);
    if (!desafio || desafio.trilha_slug !== perfil.trilha_slug) return res.status(404).json({ error: { code: 'DESAFIO_NOT_FOUND', message: 'Desafio não encontrado.' } });

    const existente = await qOne('SELECT id FROM desafio_progresso WHERE perfil_id = ? AND desafio_id = ?', [req.perfil.id, desafioId]);
    const entregue_em = status === 'entregue' ? new Date().toISOString() : null;
    if (existente) {
      await run('UPDATE desafio_progresso SET status = ?, link_entrega = ?, entregue_em = ? WHERE id = ?', [status, link_entrega || null, entregue_em, Number(existente.id)]);
    } else {
      await run('INSERT INTO desafio_progresso (perfil_id, desafio_id, status, link_entrega, entregue_em) VALUES (?, ?, ?, ?, ?)', [req.perfil.id, desafioId, status, link_entrega || null, entregue_em]);
    }
    const prog = await qOne('SELECT * FROM desafio_progresso WHERE perfil_id = ? AND desafio_id = ?', [req.perfil.id, desafioId]);
    res.json({ progresso: prog });
  } catch (err) { next(err); }
});

module.exports = router;

const { Router } = require('express');
const { q, qOne, run } = require('../db');
const { requireAuth, requirePerfil } = require('../middleware/auth');

const router = Router({ mergeParams: true });

router.get('/', requireAuth, requirePerfil, async (req, res, next) => {
  try {
    const perfil = await qOne('SELECT trilha_slug FROM perfis WHERE id = ?', [req.perfil.id]);
    if (!perfil.trilha_slug) return res.json({ modulos: [], trilha_slug: null, progresso: { total: 0, concluidos: 0, percentual: 0 } });

    const modulos = await q('SELECT * FROM modulos WHERE trilha_slug = ? ORDER BY ordem', [perfil.trilha_slug]);
    const progressos = await q('SELECT * FROM modulo_progresso WHERE perfil_id = ?', [req.perfil.id]);
    const progressoMap = {};
    for (const p of progressos) progressoMap[p.modulo_id] = p;

    const lista = modulos.map(m => ({ ...m, progresso: progressoMap[m.id] || { status: 'nao_iniciado', concluido_em: null } }));
    const concluidos = lista.filter(m => m.progresso.status === 'concluido').length;
    res.json({
      modulos: lista, trilha_slug: perfil.trilha_slug,
      progresso: { total: modulos.length, concluidos, percentual: modulos.length > 0 ? Math.round((concluidos / modulos.length) * 100) : 0 },
    });
  } catch (err) { next(err); }
});

router.patch('/:moduloId', requireAuth, requirePerfil, async (req, res, next) => {
  try {
    const moduloId = parseInt(req.params.moduloId, 10);
    const { status } = req.body;
    if (!['nao_iniciado', 'em_andamento', 'concluido'].includes(status)) {
      return res.status(400).json({ error: { code: 'INVALID_STATUS', message: 'Status inválido.' } });
    }
    const perfil = await qOne('SELECT trilha_slug FROM perfis WHERE id = ?', [req.perfil.id]);
    const modulo = await qOne('SELECT id, trilha_slug FROM modulos WHERE id = ?', [moduloId]);
    if (!modulo || modulo.trilha_slug !== perfil.trilha_slug) return res.status(404).json({ error: { code: 'MODULO_NOT_FOUND', message: 'Módulo não encontrado na trilha do perfil.' } });

    const existente = await qOne('SELECT id FROM modulo_progresso WHERE perfil_id = ? AND modulo_id = ?', [req.perfil.id, moduloId]);
    const concluido_em = status === 'concluido' ? new Date().toISOString() : null;
    if (existente) {
      await run('UPDATE modulo_progresso SET status = ?, concluido_em = ? WHERE id = ?', [status, concluido_em, Number(existente.id)]);
    } else {
      await run('INSERT INTO modulo_progresso (perfil_id, modulo_id, status, concluido_em) VALUES (?, ?, ?, ?)', [req.perfil.id, moduloId, status, concluido_em]);
    }
    const prog = await qOne('SELECT * FROM modulo_progresso WHERE perfil_id = ? AND modulo_id = ?', [req.perfil.id, moduloId]);
    res.json({ progresso: prog });
  } catch (err) { next(err); }
});

module.exports = router;

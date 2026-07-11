const { Router } = require('express');
const { q, qOne } = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = Router();

router.get('/', requireAuth, async (req, res, next) => {
  try {
    const trilhas = await q('SELECT * FROM trilhas ORDER BY slug');
    res.json({ trilhas });
  } catch (err) { next(err); }
});

router.get('/:slug', requireAuth, async (req, res, next) => {
  try {
    const trilha = await qOne('SELECT * FROM trilhas WHERE slug = ?', [req.params.slug]);
    if (!trilha) return res.status(404).json({ error: { code: 'TRILHA_NOT_FOUND', message: 'Trilha não encontrada.' } });
    const modulos = await q('SELECT * FROM modulos WHERE trilha_slug = ? ORDER BY ordem', [req.params.slug]);
    const desafios = await q('SELECT * FROM desafios WHERE trilha_slug = ? ORDER BY ordem', [req.params.slug]);
    res.json({ trilha, modulos, desafios });
  } catch (err) { next(err); }
});

module.exports = router;

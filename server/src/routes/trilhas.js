const { Router } = require('express');
const { getDb } = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = Router();

// GET /trilhas
router.get('/', requireAuth, (req, res) => {
  const db = getDb();
  const trilhas = db.prepare('SELECT * FROM trilhas ORDER BY slug').all();
  res.json({ trilhas });
});

// GET /trilhas/:slug
router.get('/:slug', requireAuth, (req, res) => {
  const db = getDb();
  const trilha = db.prepare('SELECT * FROM trilhas WHERE slug = ?').get(req.params.slug);
  if (!trilha) {
    return res.status(404).json({ error: { code: 'TRILHA_NOT_FOUND', message: 'Trilha não encontrada.' } });
  }
  const modulos = db.prepare('SELECT * FROM modulos WHERE trilha_slug = ? ORDER BY ordem').all(req.params.slug);
  const desafios = db.prepare('SELECT * FROM desafios WHERE trilha_slug = ? ORDER BY ordem').all(req.params.slug);
  res.json({ trilha, modulos, desafios });
});

module.exports = router;

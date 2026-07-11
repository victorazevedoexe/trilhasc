const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Router } = require('express');
const { qOne, run } = require('../db');
const { JWT_SECRET, JWT_REFRESH_SECRET, JWT_EXPIRES_IN, JWT_REFRESH_EXPIRES_IN } = require('../config');
const rateLimit = require('express-rate-limit');

const router = Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: { code: 'RATE_LIMIT', message: 'Muitas tentativas. Tente novamente em 15 minutos.' } },
  standardHeaders: true,
  legacyHeaders: false,
});

function generateTokens(conta) {
  const payload = { conta_id: conta.id, email: conta.email };
  const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  const refreshToken = jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: JWT_REFRESH_EXPIRES_IN });
  return { accessToken, refreshToken };
}

// POST /auth/cadastro
router.post('/cadastro', async (req, res, next) => {
  try {
    const { email, senha } = req.body;
    if (!email || !senha) return res.status(400).json({ error: { code: 'MISSING_FIELDS', message: 'Email e senha são obrigatórios.' } });
    if (senha.length < 8) return res.status(400).json({ error: { code: 'WEAK_PASSWORD', message: 'A senha deve ter pelo menos 8 caracteres.' } });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: { code: 'INVALID_EMAIL', message: 'Email inválido.' } });

    const existing = await qOne('SELECT id FROM contas WHERE email = ?', [email.toLowerCase()]);
    if (existing) return res.status(409).json({ error: { code: 'EMAIL_TAKEN', message: 'Este email já está cadastrado.' } });

    const senhaHash = await bcrypt.hash(senha, 12);
    const result = await run('INSERT INTO contas (email, senha_hash) VALUES (?, ?)', [email.toLowerCase(), senhaHash]);
    const conta = { id: Number(result.lastInsertRowid), email: email.toLowerCase() };
    res.status(201).json({ message: 'Conta criada.', ...generateTokens(conta), conta: { id: conta.id, email: conta.email } });
  } catch (err) { next(err); }
});

// POST /auth/login
router.post('/login', loginLimiter, async (req, res, next) => {
  try {
    const { email, senha } = req.body;
    if (!email || !senha) return res.status(400).json({ error: { code: 'MISSING_FIELDS', message: 'Email e senha são obrigatórios.' } });

    const conta = await qOne('SELECT * FROM contas WHERE email = ?', [email.toLowerCase()]);
    if (!conta) return res.status(401).json({ error: { code: 'INVALID_CREDENTIALS', message: 'Email ou senha inválidos.' } });

    const ok = await bcrypt.compare(senha, conta.senha_hash);
    if (!ok) return res.status(401).json({ error: { code: 'INVALID_CREDENTIALS', message: 'Email ou senha inválidos.' } });

    const tokens = generateTokens({ id: Number(conta.id), email: conta.email });
    res.json({ ...tokens, conta: { id: Number(conta.id), email: conta.email } });
  } catch (err) { next(err); }
});

// POST /auth/refresh
router.post('/refresh', async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(400).json({ error: { code: 'MISSING_TOKEN', message: 'Refresh token ausente.' } });
    const payload = jwt.verify(refreshToken, JWT_REFRESH_SECRET);
    const conta = await qOne('SELECT id, email FROM contas WHERE id = ?', [payload.conta_id]);
    if (!conta) return res.status(401).json({ error: { code: 'ACCOUNT_NOT_FOUND', message: 'Conta não encontrada.' } });
    res.json(generateTokens({ id: Number(conta.id), email: conta.email }));
  } catch {
    res.status(401).json({ error: { code: 'INVALID_REFRESH_TOKEN', message: 'Token inválido ou expirado.' } });
  }
});

module.exports = router;

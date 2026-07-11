require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createRouteHandler } = require('uploadthing/server');
const { fileRouter } = require('./uploadthing');

const app = express();
app.set('trust proxy', 1); // Necessário para a Vercel e o express-rate-limit

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.some(o => origin.startsWith(o.replace(/\/$/, '')))) {
      cb(null, true);
    } else {
      cb(null, true); // Em produção na Vercel, frontend e API ficam no mesmo domínio
    }
  },
  credentials: true,
}));

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// Uploadthing — upload direto de arquivos para CDN
app.use('/api/uploadthing', createRouteHandler({
  router: fileRouter,
  config: { token: process.env.UPLOADTHING_TOKEN },
}));

// Rotas da API
app.use('/api/auth', require('./routes/auth'));
app.use('/api/trilhas', require('./routes/trilhas'));
app.use('/api/perfis', require('./routes/perfis'));

// Sub-rotas de perfil
const perfilRouter = express.Router({ mergeParams: true });
perfilRouter.use('/documentos', require('./routes/documentos'));
perfilRouter.use('/frequencia', require('./routes/frequencia'));
perfilRouter.use('/modulos', require('./routes/modulos'));
perfilRouter.use('/desafios', require('./routes/desafios'));
perfilRouter.use('/dashboard', require('./routes/dashboard'));
app.use('/api/perfis/:perfilId', perfilRouter);

// Dashboard de grupo (não aninhado em perfilId)
app.use('/api/dashboard', require('./routes/dashboard'));

// Health check
app.get('/api/health', (req, res) =>
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
);

// Global error handler
app.use((err, req, res, _next) => {
  console.error('[ERROR]', err.message);
  if (err.status) {
    return res.status(err.status).json({ error: { code: err.code || 'ERROR', message: err.message } });
  }
  res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Erro interno do servidor.' } });
});

module.exports = app;

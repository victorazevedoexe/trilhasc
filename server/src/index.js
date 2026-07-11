require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { PORT } = require('./config');
const { getDb } = require('./db');

// Inicializar banco (auto-schema + auto-seed)
getDb();

const app = express();

app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rotas
app.use('/api/auth', require('./routes/auth'));
app.use('/api/trilhas', require('./routes/trilhas'));
app.use('/api/perfis', require('./routes/perfis'));

// Rotas aninhadas em perfis
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
app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// Error handler global
app.use((err, req, res, next) => {
  console.error('[ERROR]', err.message);
  if (err.status) {
    return res.status(err.status).json({ error: { code: err.code || 'ERROR', message: err.message } });
  }
  res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Erro interno do servidor.' } });
});

app.listen(PORT, () => {
  console.log(`✅ Servidor Trilhas Inova 3 rodando em http://localhost:${PORT}`);
  console.log(`   Banco de dados: ${require('./config').DB_PATH}`);
});

require('dotenv').config();
const app = require('../src/app');
const { applySchemaAndSeeds } = require('../src/db');
const { PORT } = require('../src/config');

// Em modo local, inicializa o banco e escuta a porta
// Em produção (Vercel), o handler exportado é chamado diretamente
if (process.env.NODE_ENV !== 'production') {
  applySchemaAndSeeds()
    .then(() => {
      app.listen(PORT, () => {
        console.log(`✅ Servidor Trilhas Inova 3 rodando em http://localhost:${PORT}`);
      });
    })
    .catch((err) => {
      console.error('[FATAL] Erro ao inicializar banco:', err);
      process.exit(1);
    });
}

// Vercel Serverless Function handler
let initialized = false;
module.exports = async (req, res) => {
  if (!initialized) {
    try {
      await applySchemaAndSeeds();
      initialized = true;
    } catch (err) {
      console.error('[INIT]', err.message);
    }
  }
  return app(req, res);
};

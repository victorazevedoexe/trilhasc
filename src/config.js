require('dotenv').config();

module.exports = {
  PORT: parseInt(process.env.PORT || '3001', 10),
  JWT_SECRET: process.env.JWT_SECRET || 'trilhas_inova3_dev_secret_MUDE_EM_PRODUCAO',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'trilhas_inova3_refresh_dev_MUDE_EM_PRODUCAO',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '15m',
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  PROGRAMA_DURACAO_SEMANAS: parseInt(process.env.PROGRAMA_DURACAO_SEMANAS || '12', 10),
  MAX_PERFIS_POR_CONTA: 15,
  NODE_ENV: process.env.NODE_ENV || 'development',
  UPLOADTHING_TOKEN: process.env.UPLOADTHING_TOKEN,
};

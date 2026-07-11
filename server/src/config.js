require('dotenv').config();
const path = require('path');

module.exports = {
  PORT: parseInt(process.env.PORT || '3001', 10),
  JWT_SECRET: process.env.JWT_SECRET || 'trilhas_inova3_dev_secret',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'trilhas_inova3_refresh_dev',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '15m',
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  DB_PATH: path.resolve(process.env.DB_PATH || './trilhas_inova3.db'),
  UPLOAD_DIR: path.resolve(process.env.UPLOAD_DIR || './uploads'),
  PROGRAMA_DURACAO_SEMANAS: parseInt(process.env.PROGRAMA_DURACAO_SEMANAS || '12', 10),
  MAX_FILE_SIZE_BYTES: 5 * 1024 * 1024, // 5 MB
  MAX_PERFIS_POR_CONTA: 15,
  NODE_ENV: process.env.NODE_ENV || 'development',
};

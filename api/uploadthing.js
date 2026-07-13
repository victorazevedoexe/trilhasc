/**
 * Rota Serverless dedicada para o Uploadthing na Vercel.
 * Precisa ser uma função separada para não conflitar com o timeout
 * da função principal do Express.
 */
require('dotenv').config();
const { createRouteHandler } = require('uploadthing/server');
const { fileRouter } = require('../src/uploadthing');

const handler = createRouteHandler({
  router: fileRouter,
  config: {
    token: process.env.UPLOADTHING_TOKEN,
    logLevel: 'error',
  },
});

module.exports = handler;

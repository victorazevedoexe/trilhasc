/**
 * Rota Serverless dedicada para o Uploadthing na Vercel usando o adapter do Express.
 * Precisa ser uma função separada para não conflitar com o timeout da função principal.
 */
require('dotenv').config();
const express = require('express');
const { createRouteHandler } = require('uploadthing/express');
const { fileRouter } = require('../src/uploadthing');

const app = express();

app.use('/api/uploadthing', createRouteHandler({
  router: fileRouter,
  config: {
    token: process.env.UPLOADTHING_TOKEN,
  },
}));

module.exports = app;

/**
 * Database module usando node:sqlite (built-in Node.js 22+/24+)
 * Zero dependências nativas — sem necessidade de compilação.
 */
const { DatabaseSync } = require('node:sqlite');
const fs = require('fs');
const path = require('path');
const { DB_PATH } = require('../config');
const { TRILHAS, DOCUMENTOS_REQUERIDOS } = require('./seeds');

let db;

function getDb() {
  if (!db) {
    db = new DatabaseSync(DB_PATH);
    // Habilitar WAL e foreign keys
    db.exec('PRAGMA journal_mode=WAL');
    db.exec('PRAGMA foreign_keys=ON');
    applySchema(db);
    autoSeedIfEmpty(db);
  }
  return db;
}

function applySchema(database) {
  const schemaPath = path.join(__dirname, 'schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf-8');
  database.exec(schema);
}

function autoSeedIfEmpty(database) {
  const row = database.prepare('SELECT COUNT(*) as n FROM trilhas').get();
  if (row.n === 0) {
    runSeeds(database);
    console.log('[DB] Seeds aplicados automaticamente.');
  }
}

function runSeeds(database) {
  const insertTrilha = database.prepare(
    'INSERT OR REPLACE INTO trilhas (slug, nome, vagas_totais, carga_horaria_horas, matriz_curricular_json) VALUES (?, ?, ?, ?, ?)'
  );
  const insertModulo = database.prepare(
    'INSERT INTO modulos (trilha_slug, titulo, ordem, carga_horaria_horas) VALUES (?, ?, ?, ?)'
  );
  const insertDesafio = database.prepare(
    'INSERT INTO desafios (trilha_slug, titulo, descricao, semana_alvo, ordem) VALUES (?, ?, ?, ?, ?)'
  );
  const insertDoc = database.prepare(
    'INSERT OR REPLACE INTO documentos_requeridos (codigo, titulo, descricao, condicional, ordem) VALUES (?, ?, ?, ?, ?)'
  );

  // node:sqlite não tem .transaction(), usamos BEGIN/COMMIT manual
  database.exec('BEGIN');
  try {
    for (const trilha of TRILHAS) {
      const matriz = trilha.modulos.map((m, i) => ({ ordem: i + 1, titulo: m }));
      insertTrilha.run(
        trilha.slug,
        trilha.nome,
        trilha.vagas_totais,
        trilha.carga_horaria_horas,
        JSON.stringify(matriz)
      );

      trilha.modulos.forEach((titulo, i) => {
        insertModulo.run(trilha.slug, titulo, i + 1, 0);
      });

      trilha.desafios.forEach((d, i) => {
        insertDesafio.run(trilha.slug, d.titulo, d.descricao, d.semana_alvo || null, i + 1);
      });
    }

    for (const doc of DOCUMENTOS_REQUERIDOS) {
      insertDoc.run(doc.codigo, doc.titulo, doc.descricao, doc.condicional ? 1 : 0, doc.ordem);
    }

    database.exec('COMMIT');
  } catch (err) {
    database.exec('ROLLBACK');
    throw err;
  }
}

function resetAndReseed() {
  const database = new DatabaseSync(DB_PATH);
  database.exec('PRAGMA foreign_keys=OFF');
  const drops = [
    'desafio_progresso', 'desafios', 'modulo_progresso', 'modulos',
    'pacotes_unificados', 'documentos', 'documentos_requeridos',
    'frequencia_semanas', 'perfis', 'contas', 'trilhas',
  ];
  for (const t of drops) {
    database.exec(`DROP TABLE IF EXISTS ${t}`);
  }
  database.exec('PRAGMA foreign_keys=ON');
  applySchema(database);
  runSeeds(database);
  database.close();
  console.log('[DB] Banco resetado e re-seedado com sucesso.');
}

module.exports = { getDb, resetAndReseed };

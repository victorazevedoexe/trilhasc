/**
 * Database module — @libsql/client (Turso: SQLite na nuvem)
 * Totalmente assíncrono. Compatível com Vercel Serverless Functions.
 */
const { createClient } = require('@libsql/client');
const { TRILHAS, DOCUMENTOS_REQUERIDOS } = require('./seeds');

let _db;

function getDb() {
  if (!_db) {
    _db = createClient({
      url: process.env.TURSO_DATABASE_URL || 'file:local.db',
      authToken: process.env.TURSO_AUTH_TOKEN,
    });
  }
  return _db;
}

// Helper: executa SQL e retorna array de rows
async function q(sql, args = []) {
  const result = await getDb().execute({ sql, args });
  return result.rows;
}

// Helper: retorna apenas o primeiro row (ou undefined)
async function qOne(sql, args = []) {
  const rows = await q(sql, args);
  return rows[0];
}

// Helper: executa sem retornar rows, retorna { lastInsertRowid, rowsAffected }
async function run(sql, args = []) {
  const result = await getDb().execute({ sql, args });
  return result;
}

// Aplica schema e seeds (idempotente — usa CREATE TABLE IF NOT EXISTS)
async function applySchemaAndSeeds() {
  const db = getDb();

  const schema = [
    `CREATE TABLE IF NOT EXISTS contas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      senha_hash TEXT NOT NULL,
      criado_em DATETIME DEFAULT (datetime('now'))
    )`,
    `CREATE TABLE IF NOT EXISTS perfis (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      conta_id INTEGER NOT NULL REFERENCES contas(id) ON DELETE CASCADE,
      nome TEXT NOT NULL,
      cpf TEXT NOT NULL,
      data_nascimento TEXT NOT NULL,
      telefone TEXT,
      pin_hash TEXT,
      papel TEXT DEFAULT 'convidado',
      trilha_slug TEXT,
      tem_curso_superior INTEGER DEFAULT 0,
      criado_em DATETIME DEFAULT (datetime('now'))
    )`,
    `CREATE TABLE IF NOT EXISTS trilhas (
      slug TEXT PRIMARY KEY,
      nome TEXT NOT NULL,
      vagas_totais INTEGER DEFAULT 0,
      carga_horaria_horas INTEGER DEFAULT 0,
      matriz_curricular_json TEXT
    )`,
    `CREATE TABLE IF NOT EXISTS modulos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      trilha_slug TEXT NOT NULL REFERENCES trilhas(slug),
      titulo TEXT NOT NULL,
      ordem INTEGER NOT NULL,
      carga_horaria_horas INTEGER DEFAULT 0
    )`,
    `CREATE TABLE IF NOT EXISTS desafios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      trilha_slug TEXT NOT NULL REFERENCES trilhas(slug),
      titulo TEXT NOT NULL,
      descricao TEXT,
      semana_alvo INTEGER,
      ordem INTEGER NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS documentos_requeridos (
      codigo TEXT PRIMARY KEY,
      titulo TEXT NOT NULL,
      descricao TEXT,
      condicional INTEGER DEFAULT 0,
      ordem INTEGER DEFAULT 0
    )`,
    `CREATE TABLE IF NOT EXISTS documentos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      perfil_id INTEGER NOT NULL REFERENCES perfis(id) ON DELETE CASCADE,
      documento_codigo TEXT NOT NULL REFERENCES documentos_requeridos(codigo),
      nome_arquivo_original TEXT NOT NULL,
      url_arquivo TEXT NOT NULL,
      mime_type TEXT,
      tamanho_bytes INTEGER,
      status TEXT DEFAULT 'enviado',
      enviado_em DATETIME DEFAULT (datetime('now')),
      UNIQUE(perfil_id, documento_codigo)
    )`,
    `CREATE TABLE IF NOT EXISTS pacotes_unificados (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      perfil_id INTEGER NOT NULL REFERENCES perfis(id) ON DELETE CASCADE,
      documentos_incluidos_json TEXT,
      gerado_em DATETIME DEFAULT (datetime('now'))
    )`,
    `CREATE TABLE IF NOT EXISTS frequencia_semanas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      perfil_id INTEGER NOT NULL REFERENCES perfis(id) ON DELETE CASCADE,
      numero_semana INTEGER NOT NULL,
      presente INTEGER DEFAULT 0,
      horas_dedicadas REAL DEFAULT 0,
      observacao TEXT,
      data_referencia TEXT,
      registrado_em DATETIME DEFAULT (datetime('now')),
      UNIQUE(perfil_id, numero_semana)
    )`,
    `CREATE TABLE IF NOT EXISTS modulo_progresso (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      perfil_id INTEGER NOT NULL REFERENCES perfis(id) ON DELETE CASCADE,
      modulo_id INTEGER NOT NULL REFERENCES modulos(id) ON DELETE CASCADE,
      status TEXT DEFAULT 'nao_iniciado',
      concluido_em DATETIME,
      UNIQUE(perfil_id, modulo_id)
    )`,
    `CREATE TABLE IF NOT EXISTS desafio_progresso (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      perfil_id INTEGER NOT NULL REFERENCES perfis(id) ON DELETE CASCADE,
      desafio_id INTEGER NOT NULL REFERENCES desafios(id) ON DELETE CASCADE,
      status TEXT DEFAULT 'nao_iniciado',
      link_entrega TEXT,
      entregue_em DATETIME,
      UNIQUE(perfil_id, desafio_id)
    )`,
  ];

  for (const sql of schema) {
    await db.execute(sql);
  }

  // Seeds apenas se a tabela trilhas estiver vazia
  const check = await db.execute('SELECT COUNT(*) as n FROM trilhas');
  if (Number(check.rows[0].n) === 0) {
    await runSeeds(db);
    console.log('[DB] Seeds aplicados com sucesso.');
  }
}

async function runSeeds(db) {
  for (const trilha of TRILHAS) {
    const matriz = trilha.modulos.map((m, i) => ({ ordem: i + 1, titulo: m }));
    await db.execute({
      sql: 'INSERT OR REPLACE INTO trilhas (slug, nome, vagas_totais, carga_horaria_horas, matriz_curricular_json) VALUES (?, ?, ?, ?, ?)',
      args: [trilha.slug, trilha.nome, trilha.vagas_totais, trilha.carga_horaria_horas, JSON.stringify(matriz)],
    });
    for (let i = 0; i < trilha.modulos.length; i++) {
      await db.execute({
        sql: 'INSERT INTO modulos (trilha_slug, titulo, ordem, carga_horaria_horas) VALUES (?, ?, ?, ?)',
        args: [trilha.slug, trilha.modulos[i], i + 1, 0],
      });
    }
    for (let i = 0; i < trilha.desafios.length; i++) {
      const d = trilha.desafios[i];
      await db.execute({
        sql: 'INSERT INTO desafios (trilha_slug, titulo, descricao, semana_alvo, ordem) VALUES (?, ?, ?, ?, ?)',
        args: [trilha.slug, d.titulo, d.descricao, d.semana_alvo || null, i + 1],
      });
    }
  }
  for (const doc of DOCUMENTOS_REQUERIDOS) {
    await db.execute({
      sql: 'INSERT OR REPLACE INTO documentos_requeridos (codigo, titulo, descricao, condicional, ordem) VALUES (?, ?, ?, ?, ?)',
      args: [doc.codigo, doc.titulo, doc.descricao, doc.condicional ? 1 : 0, doc.ordem],
    });
  }
}

module.exports = { getDb, q, qOne, run, applySchemaAndSeeds };

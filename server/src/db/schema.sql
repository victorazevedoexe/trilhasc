-- ============================================================
-- Schema Trilhas Inova 3
-- Escrito em SQL padrão (migração para PostgreSQL trivial)
-- ============================================================

CREATE TABLE IF NOT EXISTS contas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  senha_hash TEXT NOT NULL,
  criado_em TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS perfis (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  conta_id INTEGER NOT NULL REFERENCES contas(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  cpf TEXT NOT NULL,
  data_nascimento TEXT NOT NULL,
  telefone TEXT,
  pin_hash TEXT,
  papel TEXT NOT NULL DEFAULT 'convidado' CHECK (papel IN ('titular', 'convidado')),
  trilha_slug TEXT REFERENCES trilhas(slug),
  tem_curso_superior INTEGER NOT NULL DEFAULT 0 CHECK (tem_curso_superior IN (0, 1)),
  criado_em TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Trigger: máximo 15 perfis por conta
CREATE TRIGGER IF NOT EXISTS limite_perfis_por_conta
BEFORE INSERT ON perfis
BEGIN
  SELECT CASE
    WHEN (SELECT COUNT(*) FROM perfis WHERE conta_id = NEW.conta_id) >= 15
    THEN RAISE(ABORT, 'Limite de 15 perfis por conta atingido')
  END;
END;

CREATE TABLE IF NOT EXISTS trilhas (
  slug TEXT PRIMARY KEY,
  nome TEXT NOT NULL,
  matriz_curricular_json TEXT NOT NULL DEFAULT '[]',
  vagas_totais INTEGER NOT NULL DEFAULT 0,
  carga_horaria_horas INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS documentos_requeridos (
  codigo TEXT PRIMARY KEY,
  titulo TEXT NOT NULL,
  descricao TEXT NOT NULL,
  condicional INTEGER NOT NULL DEFAULT 0 CHECK (condicional IN (0, 1)),
  ordem INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS documentos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  perfil_id INTEGER NOT NULL REFERENCES perfis(id) ON DELETE CASCADE,
  documento_codigo TEXT NOT NULL REFERENCES documentos_requeridos(codigo),
  nome_arquivo_original TEXT NOT NULL,
  caminho_interno TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  tamanho_bytes INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'enviado' CHECK (status IN ('pendente', 'enviado', 'invalido')),
  enviado_em TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (perfil_id, documento_codigo)
);

CREATE TABLE IF NOT EXISTS pacotes_unificados (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  perfil_id INTEGER NOT NULL REFERENCES perfis(id) ON DELETE CASCADE,
  caminho_pdf TEXT NOT NULL,
  gerado_em TEXT NOT NULL DEFAULT (datetime('now')),
  documentos_incluidos_json TEXT NOT NULL DEFAULT '[]'
);

CREATE TABLE IF NOT EXISTS frequencia_semanas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  perfil_id INTEGER NOT NULL REFERENCES perfis(id) ON DELETE CASCADE,
  numero_semana INTEGER NOT NULL,
  data_referencia TEXT,
  presente INTEGER NOT NULL DEFAULT 0 CHECK (presente IN (0, 1)),
  horas_dedicadas REAL NOT NULL DEFAULT 0,
  observacao TEXT,
  registrado_em TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (perfil_id, numero_semana)
);

CREATE TABLE IF NOT EXISTS modulos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  trilha_slug TEXT NOT NULL REFERENCES trilhas(slug) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  ordem INTEGER NOT NULL DEFAULT 0,
  carga_horaria_horas INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS modulo_progresso (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  perfil_id INTEGER NOT NULL REFERENCES perfis(id) ON DELETE CASCADE,
  modulo_id INTEGER NOT NULL REFERENCES modulos(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'nao_iniciado' CHECK (status IN ('nao_iniciado', 'em_andamento', 'concluido')),
  concluido_em TEXT,
  UNIQUE (perfil_id, modulo_id)
);

CREATE TABLE IF NOT EXISTS desafios (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  trilha_slug TEXT NOT NULL REFERENCES trilhas(slug) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  descricao TEXT NOT NULL,
  semana_alvo INTEGER,
  ordem INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS desafio_progresso (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  perfil_id INTEGER NOT NULL REFERENCES perfis(id) ON DELETE CASCADE,
  desafio_id INTEGER NOT NULL REFERENCES desafios(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'nao_iniciado' CHECK (status IN ('nao_iniciado', 'em_andamento', 'entregue')),
  link_entrega TEXT,
  entregue_em TEXT,
  UNIQUE (perfil_id, desafio_id)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_perfis_conta_id ON perfis(conta_id);
CREATE INDEX IF NOT EXISTS idx_documentos_perfil_id ON documentos(perfil_id);
CREATE INDEX IF NOT EXISTS idx_frequencia_perfil_id ON frequencia_semanas(perfil_id);
CREATE INDEX IF NOT EXISTS idx_modulo_progresso_perfil_id ON modulo_progresso(perfil_id);
CREATE INDEX IF NOT EXISTS idx_desafio_progresso_perfil_id ON desafio_progresso(perfil_id);
CREATE INDEX IF NOT EXISTS idx_modulos_trilha_slug ON modulos(trilha_slug);
CREATE INDEX IF NOT EXISTS idx_desafios_trilha_slug ON desafios(trilha_slug);

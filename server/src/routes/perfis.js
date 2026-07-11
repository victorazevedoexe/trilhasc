const bcrypt = require('bcryptjs');
const { Router } = require('express');
const { getDb } = require('../db');
const { requireAuth, requirePerfil } = require('../middleware/auth');
const { MAX_PERFIS_POR_CONTA } = require('../config');

const router = Router();

// Validação de CPF simples (formato)
function validarCPF(cpf) {
  const digits = cpf.replace(/\D/g, '');
  return digits.length === 11;
}

// Validação de idade mínima (16 anos)
function validarIdadeMinima(dataNascimento) {
  const nascimento = new Date(dataNascimento);
  const hoje = new Date();
  const idadeMs = hoje - nascimento;
  const idadeAnos = idadeMs / (1000 * 60 * 60 * 24 * 365.25);
  return idadeAnos >= 16;
}

// GET /perfis — lista perfis da conta autenticada
router.get('/', requireAuth, (req, res) => {
  const db = getDb();
  const perfis = db.prepare(
    'SELECT id, nome, cpf, data_nascimento, telefone, papel, trilha_slug, tem_curso_superior, criado_em, CASE WHEN pin_hash IS NOT NULL THEN 1 ELSE 0 END as tem_pin FROM perfis WHERE conta_id = ? ORDER BY criado_em ASC'
  ).all(req.conta.id);
  res.json({ perfis });
});

// POST /perfis — criar novo perfil
router.post('/', requireAuth, async (req, res) => {
  const db = getDb();
  const count = db.prepare('SELECT COUNT(*) as n FROM perfis WHERE conta_id = ?').get(req.conta.id);
  if (count.n >= MAX_PERFIS_POR_CONTA) {
    return res.status(400).json({ error: { code: 'PERFIL_LIMIT', message: 'Limite de 15 perfis por conta atingido.' } });
  }

  const { nome, cpf, data_nascimento, telefone, pin, tem_curso_superior } = req.body;
  if (!nome || !cpf || !data_nascimento) {
    return res.status(400).json({ error: { code: 'MISSING_FIELDS', message: 'Nome, CPF e data de nascimento são obrigatórios.' } });
  }
  if (!validarCPF(cpf)) {
    return res.status(400).json({ error: { code: 'INVALID_CPF', message: 'CPF inválido. Informe 11 dígitos.' } });
  }
  if (!validarIdadeMinima(data_nascimento)) {
    return res.status(400).json({ error: { code: 'UNDERAGE', message: 'O candidato deve ter ao menos 16 anos.' } });
  }

  const isTitular = count.n === 0;
  let pinHash = null;
  if (pin) {
    if (!/^\d{4}$/.test(pin)) {
      return res.status(400).json({ error: { code: 'INVALID_PIN', message: 'O PIN deve ter exatamente 4 dígitos numéricos.' } });
    }
    pinHash = await bcrypt.hash(pin, 10);
  }

  try {
    const result = db.prepare(
      'INSERT INTO perfis (conta_id, nome, cpf, data_nascimento, telefone, pin_hash, papel, tem_curso_superior) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    ).run(req.conta.id, nome.trim(), cpf.replace(/\D/g, ''), data_nascimento, telefone || null, pinHash, isTitular ? 'titular' : 'convidado', tem_curso_superior ? 1 : 0);

    const perfil = db.prepare('SELECT id, nome, cpf, data_nascimento, telefone, papel, trilha_slug, tem_curso_superior, criado_em FROM perfis WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({ perfil });
  } catch (err) {
    if (err.message.includes('Limite de 15 perfis')) {
      return res.status(400).json({ error: { code: 'PERFIL_LIMIT', message: 'Limite de 15 perfis por conta atingido.' } });
    }
    throw err;
  }
});

// GET /perfis/:id — dados de um perfil
router.get('/:id', requireAuth, requirePerfil, (req, res) => {
  const db = getDb();
  const perfil = db.prepare(
    'SELECT id, nome, cpf, data_nascimento, telefone, papel, trilha_slug, tem_curso_superior, criado_em, CASE WHEN pin_hash IS NOT NULL THEN 1 ELSE 0 END as tem_pin FROM perfis WHERE id = ?'
  ).get(req.perfil.id);
  res.json({ perfil });
});

// PATCH /perfis/:id — atualizar perfil
router.patch('/:id', requireAuth, requirePerfil, async (req, res) => {
  const db = getDb();
  const { nome, telefone, pin, tem_curso_superior } = req.body;

  let pinHash;
  if (pin !== undefined) {
    if (pin === null || pin === '') {
      pinHash = null;
    } else {
      if (!/^\d{4}$/.test(pin)) {
        return res.status(400).json({ error: { code: 'INVALID_PIN', message: 'O PIN deve ter exatamente 4 dígitos numéricos.' } });
      }
      pinHash = await bcrypt.hash(pin, 10);
    }
    db.prepare('UPDATE perfis SET pin_hash = ? WHERE id = ?').run(pinHash, req.perfil.id);
  }

  const updates = [];
  const values = [];
  if (nome) { updates.push('nome = ?'); values.push(nome.trim()); }
  if (telefone !== undefined) { updates.push('telefone = ?'); values.push(telefone || null); }
  if (tem_curso_superior !== undefined) { updates.push('tem_curso_superior = ?'); values.push(tem_curso_superior ? 1 : 0); }

  if (updates.length > 0) {
    values.push(req.perfil.id);
    db.prepare(`UPDATE perfis SET ${updates.join(', ')} WHERE id = ?`).run(...values);
  }

  const perfil = db.prepare('SELECT id, nome, cpf, data_nascimento, telefone, papel, trilha_slug, tem_curso_superior, criado_em, CASE WHEN pin_hash IS NOT NULL THEN 1 ELSE 0 END as tem_pin FROM perfis WHERE id = ?').get(req.perfil.id);
  res.json({ perfil });
});

// DELETE /perfis/:id — remover perfil (não pode remover titular se houver convidados)
router.delete('/:id', requireAuth, requirePerfil, (req, res) => {
  const db = getDb();
  if (req.perfil.papel === 'titular') {
    const outros = db.prepare('SELECT COUNT(*) as n FROM perfis WHERE conta_id = ? AND id != ?').get(req.conta.id, req.perfil.id);
    if (outros.n > 0) {
      return res.status(400).json({ error: { code: 'TITULAR_DELETE', message: 'Não é possível remover o perfil titular enquanto existem perfis convidados na conta.' } });
    }
  }
  db.prepare('DELETE FROM perfis WHERE id = ?').run(req.perfil.id);
  res.json({ message: 'Perfil removido com sucesso.' });
});

// POST /perfis/:id/verificar-pin — verifica o PIN antes de abrir o perfil
router.post('/:id/verificar-pin', requireAuth, requirePerfil, async (req, res) => {
  const { pin } = req.body;
  if (!pin) {
    return res.status(400).json({ error: { code: 'MISSING_PIN', message: 'PIN não informado.' } });
  }
  const db = getDb();
  const perfil = db.prepare('SELECT pin_hash FROM perfis WHERE id = ?').get(req.perfil.id);
  if (!perfil.pin_hash) {
    return res.json({ valid: true });
  }
  const ok = await bcrypt.compare(String(pin), perfil.pin_hash);
  if (!ok) {
    return res.status(401).json({ error: { code: 'WRONG_PIN', message: 'PIN incorreto.' } });
  }
  res.json({ valid: true });
});

// PATCH /perfis/:id/trilha — escolher ou alterar trilha
router.patch('/:id/trilha', requireAuth, requirePerfil, (req, res) => {
  const { trilha_slug } = req.body;
  if (!trilha_slug) {
    return res.status(400).json({ error: { code: 'MISSING_TRILHA', message: 'Slug da trilha é obrigatório.' } });
  }
  const db = getDb();
  const trilha = db.prepare('SELECT slug FROM trilhas WHERE slug = ?').get(trilha_slug);
  if (!trilha) {
    return res.status(404).json({ error: { code: 'TRILHA_NOT_FOUND', message: 'Trilha não encontrada.' } });
  }

  // Reseta progresso de módulos da trilha anterior se houver
  const perfilAtual = db.prepare('SELECT trilha_slug FROM perfis WHERE id = ?').get(req.perfil.id);
  if (perfilAtual.trilha_slug && perfilAtual.trilha_slug !== trilha_slug) {
    const modulosAntigos = db.prepare('SELECT id FROM modulos WHERE trilha_slug = ?').all(perfilAtual.trilha_slug);
    const ids = modulosAntigos.map(m => m.id);
    if (ids.length > 0) {
      db.prepare(`DELETE FROM modulo_progresso WHERE perfil_id = ? AND modulo_id IN (${ids.map(() => '?').join(',')})`).run(req.perfil.id, ...ids);
    }
    const desafiosAntigos = db.prepare('SELECT id FROM desafios WHERE trilha_slug = ?').all(perfilAtual.trilha_slug);
    const dids = desafiosAntigos.map(d => d.id);
    if (dids.length > 0) {
      db.prepare(`DELETE FROM desafio_progresso WHERE perfil_id = ? AND desafio_id IN (${dids.map(() => '?').join(',')})`).run(req.perfil.id, ...dids);
    }
  }

  db.prepare('UPDATE perfis SET trilha_slug = ? WHERE id = ?').run(trilha_slug, req.perfil.id);
  const trilhaData = db.prepare('SELECT * FROM trilhas WHERE slug = ?').get(trilha_slug);
  res.json({ message: 'Trilha atualizada.', trilha: trilhaData });
});

module.exports = router;

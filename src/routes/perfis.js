const bcrypt = require('bcryptjs');
const { Router } = require('express');
const { q, qOne, run } = require('../db');
const { requireAuth, requirePerfil } = require('../middleware/auth');
const { MAX_PERFIS_POR_CONTA } = require('../config');

const router = Router();

function validarCPF(cpf) { return cpf.replace(/\D/g, '').length === 11; }
function validarIdadeMinima(data) {
  const anos = (Date.now() - new Date(data)) / (1000 * 60 * 60 * 24 * 365.25);
  return anos >= 16;
}

// GET /perfis
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const perfis = await q(
      "SELECT id, nome, cpf, data_nascimento, telefone, papel, trilha_slug, tem_curso_superior, criado_em, CASE WHEN pin_hash IS NOT NULL THEN 1 ELSE 0 END as tem_pin FROM perfis WHERE conta_id = ? ORDER BY criado_em ASC",
      [req.conta.id]
    );
    res.json({ perfis });
  } catch (err) { next(err); }
});

// POST /perfis
router.post('/', requireAuth, async (req, res, next) => {
  try {
    const [countRow] = await q('SELECT COUNT(*) as n FROM perfis WHERE conta_id = ?', [req.conta.id]);
    if (Number(countRow.n) >= MAX_PERFIS_POR_CONTA) {
      return res.status(400).json({ error: { code: 'PERFIL_LIMIT', message: 'Limite de 15 perfis por conta atingido.' } });
    }
    const { nome, cpf, data_nascimento, telefone, pin, tem_curso_superior } = req.body;
    if (!nome || !cpf || !data_nascimento) return res.status(400).json({ error: { code: 'MISSING_FIELDS', message: 'Nome, CPF e data de nascimento são obrigatórios.' } });
    if (!validarCPF(cpf)) return res.status(400).json({ error: { code: 'INVALID_CPF', message: 'CPF inválido. Informe 11 dígitos.' } });
    if (!validarIdadeMinima(data_nascimento)) return res.status(400).json({ error: { code: 'UNDERAGE', message: 'O candidato deve ter ao menos 16 anos.' } });

    const isTitular = Number(countRow.n) === 0;
    let pinHash = null;
    if (pin) {
      if (!/^\d{4}$/.test(pin)) return res.status(400).json({ error: { code: 'INVALID_PIN', message: 'PIN deve ter 4 dígitos.' } });
      pinHash = await bcrypt.hash(pin, 10);
    }

    const result = await run(
      'INSERT INTO perfis (conta_id, nome, cpf, data_nascimento, telefone, pin_hash, papel, tem_curso_superior) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [req.conta.id, nome.trim(), cpf.replace(/\D/g, ''), data_nascimento, telefone || null, pinHash, isTitular ? 'titular' : 'convidado', tem_curso_superior ? 1 : 0]
    );
    const perfil = await qOne('SELECT id, nome, cpf, data_nascimento, telefone, papel, trilha_slug, tem_curso_superior, criado_em FROM perfis WHERE id = ?', [Number(result.lastInsertRowid)]);
    res.status(201).json({ perfil });
  } catch (err) { next(err); }
});

// GET /perfis/:id
router.get('/:id', requireAuth, requirePerfil, async (req, res, next) => {
  try {
    const perfil = await qOne(
      "SELECT id, nome, cpf, data_nascimento, telefone, papel, trilha_slug, tem_curso_superior, criado_em, CASE WHEN pin_hash IS NOT NULL THEN 1 ELSE 0 END as tem_pin FROM perfis WHERE id = ?",
      [req.perfil.id]
    );
    res.json({ perfil });
  } catch (err) { next(err); }
});

// PATCH /perfis/:id
router.patch('/:id', requireAuth, requirePerfil, async (req, res, next) => {
  try {
    const { nome, telefone, pin, tem_curso_superior } = req.body;
    if (pin !== undefined) {
      let pinHash = null;
      if (pin && pin !== '') {
        if (!/^\d{4}$/.test(pin)) return res.status(400).json({ error: { code: 'INVALID_PIN', message: 'PIN deve ter 4 dígitos.' } });
        pinHash = await bcrypt.hash(pin, 10);
      }
      await run('UPDATE perfis SET pin_hash = ? WHERE id = ?', [pinHash, req.perfil.id]);
    }
    const updates = [], values = [];
    if (nome) { updates.push('nome = ?'); values.push(nome.trim()); }
    if (telefone !== undefined) { updates.push('telefone = ?'); values.push(telefone || null); }
    if (tem_curso_superior !== undefined) { updates.push('tem_curso_superior = ?'); values.push(tem_curso_superior ? 1 : 0); }
    if (updates.length > 0) {
      values.push(req.perfil.id);
      await run(`UPDATE perfis SET ${updates.join(', ')} WHERE id = ?`, values);
    }
    const perfil = await qOne(
      "SELECT id, nome, cpf, data_nascimento, telefone, papel, trilha_slug, tem_curso_superior, criado_em, CASE WHEN pin_hash IS NOT NULL THEN 1 ELSE 0 END as tem_pin FROM perfis WHERE id = ?",
      [req.perfil.id]
    );
    res.json({ perfil });
  } catch (err) { next(err); }
});

// DELETE /perfis/:id
router.delete('/:id', requireAuth, requirePerfil, async (req, res, next) => {
  try {
    if (req.perfil.papel === 'titular') {
      const [outros] = await q('SELECT COUNT(*) as n FROM perfis WHERE conta_id = ? AND id != ?', [req.conta.id, req.perfil.id]);
      if (Number(outros.n) > 0) return res.status(400).json({ error: { code: 'TITULAR_DELETE', message: 'Remova os perfis convidados antes de remover o titular.' } });
    }
    await run('DELETE FROM perfis WHERE id = ?', [req.perfil.id]);
    res.json({ message: 'Perfil removido.' });
  } catch (err) { next(err); }
});

// POST /perfis/:id/verificar-pin
router.post('/:id/verificar-pin', requireAuth, requirePerfil, async (req, res, next) => {
  try {
    const { pin } = req.body;
    if (!pin) return res.status(400).json({ error: { code: 'MISSING_PIN', message: 'PIN não informado.' } });
    const perfil = await qOne('SELECT pin_hash FROM perfis WHERE id = ?', [req.perfil.id]);
    if (!perfil.pin_hash) return res.json({ valid: true });
    const ok = await bcrypt.compare(String(pin), perfil.pin_hash);
    if (!ok) return res.status(401).json({ error: { code: 'WRONG_PIN', message: 'PIN incorreto.' } });
    res.json({ valid: true });
  } catch (err) { next(err); }
});

// PATCH /perfis/:id/trilha
router.patch('/:id/trilha', requireAuth, requirePerfil, async (req, res, next) => {
  try {
    const { trilha_slug } = req.body;
    if (!trilha_slug) return res.status(400).json({ error: { code: 'MISSING_TRILHA', message: 'Slug da trilha é obrigatório.' } });
    const trilha = await qOne('SELECT slug FROM trilhas WHERE slug = ?', [trilha_slug]);
    if (!trilha) return res.status(404).json({ error: { code: 'TRILHA_NOT_FOUND', message: 'Trilha não encontrada.' } });

    const perfilAtual = await qOne('SELECT trilha_slug FROM perfis WHERE id = ?', [req.perfil.id]);
    if (perfilAtual.trilha_slug && perfilAtual.trilha_slug !== trilha_slug) {
      const modulosAntigos = await q('SELECT id FROM modulos WHERE trilha_slug = ?', [perfilAtual.trilha_slug]);
      const ids = modulosAntigos.map(m => m.id);
      if (ids.length > 0) {
        await run(`DELETE FROM modulo_progresso WHERE perfil_id = ? AND modulo_id IN (${ids.map(() => '?').join(',')})`, [req.perfil.id, ...ids]);
      }
      const desafiosAntigos = await q('SELECT id FROM desafios WHERE trilha_slug = ?', [perfilAtual.trilha_slug]);
      const dids = desafiosAntigos.map(d => d.id);
      if (dids.length > 0) {
        await run(`DELETE FROM desafio_progresso WHERE perfil_id = ? AND desafio_id IN (${dids.map(() => '?').join(',')})`, [req.perfil.id, ...dids]);
      }
    }

    await run('UPDATE perfis SET trilha_slug = ? WHERE id = ?', [trilha_slug, req.perfil.id]);
    const trilhaData = await qOne('SELECT * FROM trilhas WHERE slug = ?', [trilha_slug]);
    res.json({ message: 'Trilha atualizada.', trilha: trilhaData });
  } catch (err) { next(err); }
});

module.exports = router;

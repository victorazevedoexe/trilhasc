const { Router } = require('express');
const { q, qOne, run } = require('../db');
const { requireAuth, requirePerfil } = require('../middleware/auth');
const { PROGRAMA_DURACAO_SEMANAS } = require('../config');

const router = Router({ mergeParams: true });

router.get('/', requireAuth, requirePerfil, async (req, res, next) => {
  try {
    const registros = await q('SELECT * FROM frequencia_semanas WHERE perfil_id = ? ORDER BY numero_semana', [req.perfil.id]);
    const registrosMap = {};
    for (const r of registros) registrosMap[r.numero_semana] = r;

    const semanas = [];
    for (let s = 1; s <= PROGRAMA_DURACAO_SEMANAS; s++) {
      semanas.push(registrosMap[s] || { numero_semana: s, presente: false, horas_dedicadas: 0, observacao: null, registrado_em: null, data_referencia: null });
    }

    const totalPresente = registros.filter(r => r.presente).length;
    const totalHoras = registros.reduce((acc, r) => acc + (Number(r.horas_dedicadas) || 0), 0);
    const percentualPresenca = Math.round((totalPresente / PROGRAMA_DURACAO_SEMANAS) * 100);

    let maxConsec = 0, atualConsec = 0;
    for (let s = 1; s <= PROGRAMA_DURACAO_SEMANAS; s++) {
      if (!registrosMap[s] || !registrosMap[s].presente) { atualConsec++; maxConsec = Math.max(maxConsec, atualConsec); }
      else { atualConsec = 0; }
    }

    res.json({
      semanas,
      duracao_total: PROGRAMA_DURACAO_SEMANAS,
      metricas: { total_semanas_presentes: totalPresente, total_horas: totalHoras, percentual_presenca: percentualPresenca, alerta_risco: maxConsec >= 4, max_consecutivas_sem_presenca: maxConsec },
    });
  } catch (err) { next(err); }
});

router.put('/:semana', requireAuth, requirePerfil, async (req, res, next) => {
  try {
    const semana = parseInt(req.params.semana, 10);
    if (isNaN(semana) || semana < 1 || semana > PROGRAMA_DURACAO_SEMANAS) {
      return res.status(400).json({ error: { code: 'INVALID_SEMANA', message: `Número de semana deve ser entre 1 e ${PROGRAMA_DURACAO_SEMANAS}.` } });
    }
    const { presente, horas_dedicadas, observacao, data_referencia } = req.body;
    const existente = await qOne('SELECT id FROM frequencia_semanas WHERE perfil_id = ? AND numero_semana = ?', [req.perfil.id, semana]);
    if (existente) {
      await run("UPDATE frequencia_semanas SET presente = ?, horas_dedicadas = ?, observacao = ?, data_referencia = ?, registrado_em = datetime('now') WHERE id = ?",
        [presente ? 1 : 0, horas_dedicadas || 0, observacao || null, data_referencia || null, Number(existente.id)]);
    } else {
      await run('INSERT INTO frequencia_semanas (perfil_id, numero_semana, presente, horas_dedicadas, observacao, data_referencia) VALUES (?, ?, ?, ?, ?, ?)',
        [req.perfil.id, semana, presente ? 1 : 0, horas_dedicadas || 0, observacao || null, data_referencia || null]);
    }
    const registro = await qOne('SELECT * FROM frequencia_semanas WHERE perfil_id = ? AND numero_semana = ?', [req.perfil.id, semana]);
    res.json({ registro });
  } catch (err) { next(err); }
});

module.exports = router;

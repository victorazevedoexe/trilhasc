const { Router } = require('express');
const { getDb } = require('../db');
const { requireAuth, requirePerfil } = require('../middleware/auth');
const { PROGRAMA_DURACAO_SEMANAS } = require('../config');

const router = Router({ mergeParams: true });

// GET /perfis/:perfilId/frequencia
router.get('/', requireAuth, requirePerfil, (req, res) => {
  const db = getDb();
  const registros = db.prepare('SELECT * FROM frequencia_semanas WHERE perfil_id = ? ORDER BY numero_semana').all(req.perfil.id);
  const registrosMap = {};
  for (const r of registros) registrosMap[r.numero_semana] = r;

  // Montar grade completa de semanas
  const semanas = [];
  for (let s = 1; s <= PROGRAMA_DURACAO_SEMANAS; s++) {
    semanas.push(registrosMap[s] || {
      numero_semana: s,
      presente: false,
      horas_dedicadas: 0,
      observacao: null,
      registrado_em: null,
      data_referencia: null,
    });
  }

  // Calcular métricas
  const comRegistro = registros.filter(r => r.presente);
  const totalPresente = comRegistro.length;
  const totalHoras = registros.reduce((acc, r) => acc + (r.horas_dedicadas || 0), 0);
  const percentualPresenca = Math.round((totalPresente / PROGRAMA_DURACAO_SEMANAS) * 100);

  // Detectar risco: 4+ semanas sem presença consecutivas (nas semanas registradas)
  let maxConsecutivasSemPresenca = 0;
  let atualConsecutivas = 0;
  for (let s = 1; s <= PROGRAMA_DURACAO_SEMANAS; s++) {
    const reg = registrosMap[s];
    if (!reg || !reg.presente) {
      atualConsecutivas++;
      maxConsecutivasSemPresenca = Math.max(maxConsecutivasSemPresenca, atualConsecutivas);
    } else {
      atualConsecutivas = 0;
    }
  }

  res.json({
    semanas,
    duracao_total: PROGRAMA_DURACAO_SEMANAS,
    metricas: {
      total_semanas_presentes: totalPresente,
      total_horas: totalHoras,
      percentual_presenca: percentualPresenca,
      alerta_risco: maxConsecutivasSemPresenca >= 4,
      max_consecutivas_sem_presenca: maxConsecutivasSemPresenca,
    },
  });
});

// PUT /perfis/:perfilId/frequencia/:semana — registrar/atualizar semana
router.put('/:semana', requireAuth, requirePerfil, (req, res) => {
  const semana = parseInt(req.params.semana, 10);
  if (isNaN(semana) || semana < 1 || semana > PROGRAMA_DURACAO_SEMANAS) {
    return res.status(400).json({ error: { code: 'INVALID_SEMANA', message: `Número de semana deve ser entre 1 e ${PROGRAMA_DURACAO_SEMANAS}.` } });
  }

  const { presente, horas_dedicadas, observacao, data_referencia } = req.body;
  const db = getDb();

  const existente = db.prepare('SELECT id FROM frequencia_semanas WHERE perfil_id = ? AND numero_semana = ?').get(req.perfil.id, semana);
  if (existente) {
    db.prepare(
      'UPDATE frequencia_semanas SET presente = ?, horas_dedicadas = ?, observacao = ?, data_referencia = ?, registrado_em = datetime(\'now\') WHERE id = ?'
    ).run(presente ? 1 : 0, horas_dedicadas || 0, observacao || null, data_referencia || null, existente.id);
  } else {
    db.prepare(
      'INSERT INTO frequencia_semanas (perfil_id, numero_semana, presente, horas_dedicadas, observacao, data_referencia) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(req.perfil.id, semana, presente ? 1 : 0, horas_dedicadas || 0, observacao || null, data_referencia || null);
  }

  const registro = db.prepare('SELECT * FROM frequencia_semanas WHERE perfil_id = ? AND numero_semana = ?').get(req.perfil.id, semana);
  res.json({ registro });
});

module.exports = router;

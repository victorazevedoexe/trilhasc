const { Router } = require('express');
const { getDb } = require('../db');
const { requireAuth, requirePerfil } = require('../middleware/auth');
const { PROGRAMA_DURACAO_SEMANAS } = require('../config');

const router = Router({ mergeParams: true });

// GET /perfis/:perfilId/dashboard — dados consolidados do perfil
router.get('/', requireAuth, requirePerfil, (req, res) => {
  const db = getDb();
  const perfil = db.prepare('SELECT * FROM perfis WHERE id = ?').get(req.perfil.id);

  // Documentos
  const requeridos = db.prepare('SELECT codigo, condicional FROM documentos_requeridos').all();
  const docsObrigatorios = requeridos.filter(d => !d.condicional || perfil.tem_curso_superior);
  const enviados = db.prepare('SELECT documento_codigo FROM documentos WHERE perfil_id = ? AND status = ?').all(req.perfil.id, 'enviado');
  const enviadosSet = new Set(enviados.map(d => d.documento_codigo));
  const docEnviadosCount = docsObrigatorios.filter(d => enviadosSet.has(d.codigo)).length;
  const progressoDocs = {
    total: docsObrigatorios.length,
    enviados: docEnviadosCount,
    percentual: docsObrigatorios.length > 0 ? Math.round((docEnviadosCount / docsObrigatorios.length) * 100) : 0,
  };

  // Frequência
  const registros = db.prepare('SELECT presente, horas_dedicadas FROM frequencia_semanas WHERE perfil_id = ?').all(req.perfil.id);
  const presencas = registros.filter(r => r.presente).length;
  const totalHoras = registros.reduce((acc, r) => acc + (r.horas_dedicadas || 0), 0);
  const progressoFreq = {
    total: PROGRAMA_DURACAO_SEMANAS,
    presentes: presencas,
    percentual: Math.round((presencas / PROGRAMA_DURACAO_SEMANAS) * 100),
    total_horas: totalHoras,
  };

  // Módulos
  let progressoModulos = { total: 0, concluidos: 0, percentual: 0 };
  if (perfil.trilha_slug) {
    const totalMod = db.prepare('SELECT COUNT(*) as n FROM modulos WHERE trilha_slug = ?').get(perfil.trilha_slug).n;
    const concMod = db.prepare("SELECT COUNT(*) as n FROM modulo_progresso WHERE perfil_id = ? AND status = 'concluido'").get(req.perfil.id).n;
    progressoModulos = { total: totalMod, concluidos: concMod, percentual: totalMod > 0 ? Math.round((concMod / totalMod) * 100) : 0 };
  }

  // Desafios
  let progressoDesafios = { total: 0, entregues: 0, percentual: 0 };
  if (perfil.trilha_slug) {
    const totalDes = db.prepare('SELECT COUNT(*) as n FROM desafios WHERE trilha_slug = ?').get(perfil.trilha_slug).n;
    const entDes = db.prepare("SELECT COUNT(*) as n FROM desafio_progresso WHERE perfil_id = ? AND status = 'entregue'").get(req.perfil.id).n;
    progressoDesafios = { total: totalDes, entregues: entDes, percentual: totalDes > 0 ? Math.round((entDes / totalDes) * 100) : 0 };
  }

  // Progresso geral (combina módulos + desafios)
  const totalItens = progressoModulos.total + progressoDesafios.total;
  const concluidos = progressoModulos.concluidos + progressoDesafios.entregues;
  const progressoGeral = totalItens > 0 ? Math.round((concluidos / totalItens) * 100) : 0;

  // Trilha
  let trilha = null;
  if (perfil.trilha_slug) {
    trilha = db.prepare('SELECT slug, nome, carga_horaria_horas, vagas_totais FROM trilhas WHERE slug = ?').get(perfil.trilha_slug);
  }

  res.json({
    perfil: {
      id: perfil.id,
      nome: perfil.nome,
      papel: perfil.papel,
      trilha_slug: perfil.trilha_slug,
      tem_curso_superior: !!perfil.tem_curso_superior,
    },
    trilha,
    documentos: progressoDocs,
    frequencia: progressoFreq,
    modulos: progressoModulos,
    desafios: progressoDesafios,
    progresso_geral: progressoGeral,
  });
});

// GET /dashboard/grupo — visão do titular com todos os perfis (apenas titular)
router.get('/grupo', requireAuth, (req, res) => {
  const db = getDb();
  const titular = db.prepare("SELECT id FROM perfis WHERE conta_id = ? AND papel = 'titular'").get(req.conta.id);
  if (!titular) {
    return res.status(403).json({ error: { code: 'NOT_TITULAR', message: 'Apenas o titular da conta pode acessar o dashboard de grupo.' } });
  }

  const perfis = db.prepare('SELECT * FROM perfis WHERE conta_id = ? ORDER BY criado_em ASC').all(req.conta.id);
  const requeridos = db.prepare('SELECT codigo, condicional FROM documentos_requeridos').all();
  const { PROGRAMA_DURACAO_SEMANAS: dur } = require('../config');

  const resumo = perfis.map(perfil => {
    const docsOb = requeridos.filter(d => !d.condicional || perfil.tem_curso_superior);
    const enviados = db.prepare('SELECT documento_codigo FROM documentos WHERE perfil_id = ? AND status = ?').all(perfil.id, 'enviado');
    const envSet = new Set(enviados.map(d => d.documento_codigo));
    const docEnv = docsOb.filter(d => envSet.has(d.codigo)).length;
    const pctDocs = docsOb.length > 0 ? Math.round((docEnv / docsOb.length) * 100) : 0;

    const presencas = db.prepare('SELECT COUNT(*) as n FROM frequencia_semanas WHERE perfil_id = ? AND presente = 1').get(perfil.id).n;
    const pctFreq = Math.round((presencas / dur) * 100);

    return {
      id: perfil.id,
      nome: perfil.nome,
      papel: perfil.papel,
      trilha_slug: perfil.trilha_slug,
      pct_documentos: pctDocs,
      pct_frequencia: pctFreq,
    };
  });

  res.json({ perfis: resumo, total: perfis.length });
});

module.exports = router;

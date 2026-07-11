const { Router } = require('express');
const { q, qOne } = require('../db');
const { requireAuth, requirePerfil } = require('../middleware/auth');
const { PROGRAMA_DURACAO_SEMANAS } = require('../config');

const router = Router({ mergeParams: true });

router.get('/', requireAuth, requirePerfil, async (req, res, next) => {
  try {
    const perfil = await qOne('SELECT * FROM perfis WHERE id = ?', [req.perfil.id]);
    const requeridos = await q('SELECT codigo, condicional FROM documentos_requeridos');
    const docsOb = requeridos.filter(d => !d.condicional || perfil.tem_curso_superior);
    const enviados = await q('SELECT documento_codigo FROM documentos WHERE perfil_id = ? AND status = ?', [req.perfil.id, 'enviado']);
    const envSet = new Set(enviados.map(d => d.documento_codigo));
    const docCount = docsOb.filter(d => envSet.has(d.codigo)).length;
    const progressoDocs = { total: docsOb.length, enviados: docCount, percentual: docsOb.length > 0 ? Math.round((docCount / docsOb.length) * 100) : 0 };

    const registros = await q('SELECT presente, horas_dedicadas FROM frequencia_semanas WHERE perfil_id = ?', [req.perfil.id]);
    const presencas = registros.filter(r => r.presente).length;
    const totalHoras = registros.reduce((acc, r) => acc + (Number(r.horas_dedicadas) || 0), 0);
    const progressoFreq = { total: PROGRAMA_DURACAO_SEMANAS, presentes: presencas, percentual: Math.round((presencas / PROGRAMA_DURACAO_SEMANAS) * 100), total_horas: totalHoras };

    let progressoModulos = { total: 0, concluidos: 0, percentual: 0 };
    let progressoDesafios = { total: 0, entregues: 0, percentual: 0 };
    if (perfil.trilha_slug) {
      const [tmRow] = await q('SELECT COUNT(*) as n FROM modulos WHERE trilha_slug = ?', [perfil.trilha_slug]);
      const [cmRow] = await q("SELECT COUNT(*) as n FROM modulo_progresso WHERE perfil_id = ? AND status = 'concluido'", [req.perfil.id]);
      const tm = Number(tmRow.n), cm = Number(cmRow.n);
      progressoModulos = { total: tm, concluidos: cm, percentual: tm > 0 ? Math.round((cm / tm) * 100) : 0 };

      const [tdRow] = await q('SELECT COUNT(*) as n FROM desafios WHERE trilha_slug = ?', [perfil.trilha_slug]);
      const [edRow] = await q("SELECT COUNT(*) as n FROM desafio_progresso WHERE perfil_id = ? AND status = 'entregue'", [req.perfil.id]);
      const td = Number(tdRow.n), ed = Number(edRow.n);
      progressoDesafios = { total: td, entregues: ed, percentual: td > 0 ? Math.round((ed / td) * 100) : 0 };
    }

    const totalItens = progressoModulos.total + progressoDesafios.total;
    const concluidos = progressoModulos.concluidos + progressoDesafios.entregues;
    const progressoGeral = totalItens > 0 ? Math.round((concluidos / totalItens) * 100) : 0;

    let trilha = null;
    if (perfil.trilha_slug) trilha = await qOne('SELECT slug, nome, carga_horaria_horas, vagas_totais FROM trilhas WHERE slug = ?', [perfil.trilha_slug]);

    res.json({
      perfil: { id: Number(perfil.id), nome: perfil.nome, papel: perfil.papel, trilha_slug: perfil.trilha_slug, tem_curso_superior: !!perfil.tem_curso_superior },
      trilha, documentos: progressoDocs, frequencia: progressoFreq, modulos: progressoModulos, desafios: progressoDesafios, progresso_geral: progressoGeral,
    });
  } catch (err) { next(err); }
});

router.get('/grupo', requireAuth, async (req, res, next) => {
  try {
    const titular = await qOne("SELECT id FROM perfis WHERE conta_id = ? AND papel = 'titular'", [req.conta.id]);
    if (!titular) return res.status(403).json({ error: { code: 'NOT_TITULAR', message: 'Apenas o titular pode acessar o dashboard de grupo.' } });

    const perfis = await q('SELECT * FROM perfis WHERE conta_id = ? ORDER BY criado_em ASC', [req.conta.id]);
    const requeridos = await q('SELECT codigo, condicional FROM documentos_requeridos');

    const resumo = await Promise.all(perfis.map(async p => {
      const docsOb = requeridos.filter(d => !d.condicional || p.tem_curso_superior);
      const enviados = await q('SELECT documento_codigo FROM documentos WHERE perfil_id = ? AND status = ?', [p.id, 'enviado']);
      const envSet = new Set(enviados.map(d => d.documento_codigo));
      const pctDocs = docsOb.length > 0 ? Math.round((docsOb.filter(d => envSet.has(d.codigo)).length / docsOb.length) * 100) : 0;
      const [presRow] = await q('SELECT COUNT(*) as n FROM frequencia_semanas WHERE perfil_id = ? AND presente = 1', [p.id]);
      const pctFreq = Math.round((Number(presRow.n) / PROGRAMA_DURACAO_SEMANAS) * 100);
      return { id: Number(p.id), nome: p.nome, papel: p.papel, trilha_slug: p.trilha_slug, pct_documentos: pctDocs, pct_frequencia: pctFreq };
    }));

    res.json({ perfis: resumo, total: perfis.length });
  } catch (err) { next(err); }
});

module.exports = router;

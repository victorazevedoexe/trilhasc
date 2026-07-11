const { Router } = require('express');
const { q, qOne, run } = require('../db');
const { requireAuth, requirePerfil } = require('../middleware/auth');
const { mergeParaPDF } = require('../utils/pdfMerge');

const router = Router({ mergeParams: true });

// GET /perfis/:perfilId/documentos
router.get('/', requireAuth, requirePerfil, async (req, res, next) => {
  try {
    const perfil = await qOne('SELECT tem_curso_superior FROM perfis WHERE id = ?', [req.perfil.id]);
    const requeridos = await q('SELECT * FROM documentos_requeridos ORDER BY ordem');
    const enviados = await q('SELECT * FROM documentos WHERE perfil_id = ?', [req.perfil.id]);
    const enviadosMap = {};
    for (const d of enviados) enviadosMap[d.documento_codigo] = d;

    const lista = requeridos.map(req_doc => {
      const enviado = enviadosMap[req_doc.codigo];
      const naoAplicavel = req_doc.condicional && !perfil.tem_curso_superior;
      return {
        ...req_doc,
        nao_aplicavel: naoAplicavel,
        enviado: enviado ? {
          id: Number(enviado.id),
          nome_arquivo_original: enviado.nome_arquivo_original,
          url_arquivo: enviado.url_arquivo,
          mime_type: enviado.mime_type,
          tamanho_bytes: Number(enviado.tamanho_bytes),
          status: enviado.status,
          enviado_em: enviado.enviado_em,
          is_docx: enviado.nome_arquivo_original?.toLowerCase().endsWith('.docx'),
        } : null,
      };
    });

    const docObrigatorios = requeridos.filter(d => !d.condicional || perfil.tem_curso_superior);
    const docEnviados = docObrigatorios.filter(d => enviadosMap[d.codigo]?.status === 'enviado');
    res.json({
      documentos: lista,
      progresso: {
        total: docObrigatorios.length,
        enviados: docEnviados.length,
        percentual: docObrigatorios.length > 0 ? Math.round((docEnviados.length / docObrigatorios.length) * 100) : 0,
      },
    });
  } catch (err) { next(err); }
});

// POST /gerar-pacote — antes do /:codigo para não ser interceptado
router.post('/gerar-pacote', requireAuth, requirePerfil, async (req, res, next) => {
  try {
    const perfil = await qOne('SELECT tem_curso_superior FROM perfis WHERE id = ?', [req.perfil.id]);
    const requeridos = await q('SELECT codigo FROM documentos_requeridos WHERE condicional = 0 OR (condicional = 1 AND ? = 1) ORDER BY ordem', [perfil.tem_curso_superior ? 1 : 0]);
    const codigosObrigatorios = requeridos.map(r => r.codigo);

    const enviados = await q('SELECT * FROM documentos WHERE perfil_id = ? AND status = ?', [req.perfil.id, 'enviado']);
    const enviadosMap = {};
    for (const d of enviados) enviadosMap[d.documento_codigo] = d;

    const faltando = codigosObrigatorios.filter(c => !enviadosMap[c]);
    if (faltando.length > 0) {
      return res.status(400).json({ error: { code: 'DOCS_INCOMPLETE', message: `Faltam ${faltando.length} documento(s) obrigatório(s).`, faltando } });
    }

    const todosEnviados = await q(
      'SELECT d.*, dr.ordem FROM documentos d JOIN documentos_requeridos dr ON d.documento_codigo = dr.codigo WHERE d.perfil_id = ? AND d.status = ? ORDER BY dr.ordem',
      [req.perfil.id, 'enviado']
    );

    const arquivos = todosEnviados.map(d => ({ url: d.url_arquivo, mime: d.mime_type, nome: d.nome_arquivo_original }));
    const { pdfBytes, ignorados } = await mergeParaPDF(arquivos);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="pacote_trilhas_inova3.pdf"');
    res.end(Buffer.from(pdfBytes));
  } catch (err) { next(err); }
});

// POST /perfis/:perfilId/documentos/:codigo — salva URL retornada pelo Uploadthing
router.post('/:codigo', requireAuth, requirePerfil, async (req, res, next) => {
  try {
    const { codigo } = req.params;
    const { url, nome, tamanho_bytes, mime_type } = req.body;

    if (!url || !nome) return res.status(400).json({ error: { code: 'MISSING_FIELDS', message: 'URL e nome do arquivo são obrigatórios.' } });

    const docReq = await qOne('SELECT * FROM documentos_requeridos WHERE codigo = ?', [codigo]);
    if (!docReq) return res.status(404).json({ error: { code: 'DOC_NOT_FOUND', message: 'Código de documento não encontrado.' } });

    // Upsert — substitui se já existe
    const anterior = await qOne('SELECT id FROM documentos WHERE perfil_id = ? AND documento_codigo = ?', [req.perfil.id, codigo]);
    if (anterior) {
      await run(
        'UPDATE documentos SET nome_arquivo_original = ?, url_arquivo = ?, mime_type = ?, tamanho_bytes = ?, status = ?, enviado_em = datetime(\'now\') WHERE id = ?',
        [nome, url, mime_type || 'application/octet-stream', tamanho_bytes || 0, 'enviado', Number(anterior.id)]
      );
    } else {
      await run(
        'INSERT INTO documentos (perfil_id, documento_codigo, nome_arquivo_original, url_arquivo, mime_type, tamanho_bytes, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [req.perfil.id, codigo, nome, url, mime_type || 'application/octet-stream', tamanho_bytes || 0, 'enviado']
      );
    }

    const isDocx = nome.toLowerCase().endsWith('.docx');
    res.status(201).json({
      message: 'Documento salvo com sucesso.',
      is_docx: isDocx,
      aviso: isDocx ? 'Arquivo .docx não será incluído no pacote PDF — converta para PDF.' : null,
    });
  } catch (err) { next(err); }
});

// DELETE /perfis/:perfilId/documentos/:codigo
router.delete('/:codigo', requireAuth, requirePerfil, async (req, res, next) => {
  try {
    const doc = await qOne('SELECT * FROM documentos WHERE perfil_id = ? AND documento_codigo = ?', [req.perfil.id, req.params.codigo]);
    if (!doc) return res.status(404).json({ error: { code: 'DOC_NOT_FOUND', message: 'Documento não encontrado.' } });
    await run('DELETE FROM documentos WHERE id = ?', [Number(doc.id)]);
    res.json({ message: 'Documento removido.' });
  } catch (err) { next(err); }
});

module.exports = router;

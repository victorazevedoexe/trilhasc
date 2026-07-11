const fs = require('fs');
const path = require('path');
const { Router } = require('express');
const { getDb } = require('../db');
const { requireAuth, requirePerfil } = require('../middleware/auth');
const { createUploadMiddleware } = require('../middleware/upload');
const { mergeParaPDF } = require('../utils/pdfMerge');
const { UPLOAD_DIR } = require('../config');

const router = Router({ mergeParams: true });

// GET /perfis/:perfilId/documentos — lista status de todos os documentos do perfil
router.get('/', requireAuth, requirePerfil, (req, res) => {
  const db = getDb();
  const perfil = db.prepare('SELECT tem_curso_superior FROM perfis WHERE id = ?').get(req.perfil.id);
  const requeridos = db.prepare('SELECT * FROM documentos_requeridos ORDER BY ordem').all();
  const enviados = db.prepare('SELECT * FROM documentos WHERE perfil_id = ?').all(req.perfil.id);
  const enviadosMap = {};
  for (const d of enviados) enviadosMap[d.documento_codigo] = d;

  const lista = requeridos.map(req_doc => {
    const enviado = enviadosMap[req_doc.codigo];
    const naoAplicavel = req_doc.condicional && !perfil.tem_curso_superior;
    return {
      ...req_doc,
      nao_aplicavel: naoAplicavel,
      enviado: enviado ? {
        id: enviado.id,
        nome_arquivo_original: enviado.nome_arquivo_original,
        mime_type: enviado.mime_type,
        tamanho_bytes: enviado.tamanho_bytes,
        status: enviado.status,
        enviado_em: enviado.enviado_em,
        is_docx: enviado.mime_type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || enviado.nome_arquivo_original.toLowerCase().endsWith('.docx'),
      } : null,
    };
  });

  // Calcular progresso
  const docObrigatorios = requeridos.filter(d => !d.condicional || perfil.tem_curso_superior);
  const docEnviados = docObrigatorios.filter(d => {
    const env = enviadosMap[d.codigo];
    return env && env.status === 'enviado';
  });
  const progresso = {
    total: docObrigatorios.length,
    enviados: docEnviados.length,
    percentual: docObrigatorios.length > 0 ? Math.round((docEnviados.length / docObrigatorios.length) * 100) : 0,
  };

  res.json({ documentos: lista, progresso });
});

// POST /perfis/:perfilId/documentos/gerar-pacote — gera PDF unificado
router.post('/gerar-pacote', requireAuth, requirePerfil, async (req, res) => {
  const db = getDb();
  const perfil = db.prepare('SELECT tem_curso_superior, trilha_slug FROM perfis WHERE id = ?').get(req.perfil.id);
  const requeridos = db.prepare('SELECT codigo FROM documentos_requeridos WHERE condicional = 0 OR (condicional = 1 AND ? = 1) ORDER BY ordem').all(perfil.tem_curso_superior);
  const codigosObrigatorios = requeridos.map(r => r.codigo);

  // Verificar se todos os obrigatórios foram enviados
  const enviados = db.prepare('SELECT * FROM documentos WHERE perfil_id = ? AND status = ?').all(req.perfil.id, 'enviado');
  const enviadosMap = {};
  for (const d of enviados) enviadosMap[d.documento_codigo] = d;

  const faltando = codigosObrigatorios.filter(c => !enviadosMap[c]);
  if (faltando.length > 0) {
    return res.status(400).json({
      error: {
        code: 'DOCS_INCOMPLETE',
        message: `Ainda faltam ${faltando.length} documento(s) obrigatório(s) para gerar o pacote.`,
        faltando,
      },
    });
  }

  // Montar lista de arquivos para merge (todos os enviados, na ordem)
  const todosEnviados = db.prepare(
    'SELECT d.*, dr.ordem FROM documentos d JOIN documentos_requeridos dr ON d.documento_codigo = dr.codigo WHERE d.perfil_id = ? AND d.status = ? ORDER BY dr.ordem'
  ).all(req.perfil.id, 'enviado');

  const arquivos = todosEnviados.map(d => ({
    path: d.caminho_interno,
    mime: d.mime_type,
    nome: d.nome_arquivo_original,
  }));

  const { pdfBytes, ignorados } = await mergeParaPDF(arquivos);

  // Salvar pacote
  const pacoteDir = path.join(UPLOAD_DIR, String(req.conta.id), String(req.perfil.id), 'pacote');
  fs.mkdirSync(pacoteDir, { recursive: true });
  const pacotePath = path.join(pacoteDir, `pacote_${Date.now()}.pdf`);
  fs.writeFileSync(pacotePath, pdfBytes);

  // Remover pacote anterior
  const pacoteAntigo = db.prepare('SELECT caminho_pdf FROM pacotes_unificados WHERE perfil_id = ?').get(req.perfil.id);
  if (pacoteAntigo) {
    try { fs.unlinkSync(pacoteAntigo.caminho_pdf); } catch {}
    db.prepare('DELETE FROM pacotes_unificados WHERE perfil_id = ?').run(req.perfil.id);
  }

  db.prepare(
    'INSERT INTO pacotes_unificados (perfil_id, caminho_pdf, documentos_incluidos_json) VALUES (?, ?, ?)'
  ).run(req.perfil.id, pacotePath, JSON.stringify(todosEnviados.map(d => d.documento_codigo)));

  res.json({
    message: 'Pacote PDF gerado com sucesso.',
    avisos: ignorados.length > 0 ? ignorados.map(n => `"${n}" é .docx e não foi incluído no PDF — converta para PDF.`) : [],
  });
});

// GET /perfis/:perfilId/documentos/pacote/download — baixar o pacote PDF
router.get('/pacote/download', requireAuth, requirePerfil, (req, res) => {
  const db = getDb();
  const pacote = db.prepare('SELECT * FROM pacotes_unificados WHERE perfil_id = ?').get(req.perfil.id);
  if (!pacote) {
    return res.status(404).json({ error: { code: 'PACOTE_NOT_FOUND', message: 'Nenhum pacote gerado ainda.' } });
  }
  if (!fs.existsSync(pacote.caminho_pdf)) {
    return res.status(404).json({ error: { code: 'FILE_NOT_FOUND', message: 'Arquivo do pacote não encontrado.' } });
  }
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'attachment; filename="pacote_documentos_trilhas_inova3.pdf"');
  fs.createReadStream(pacote.caminho_pdf).pipe(res);
});

// POST /perfis/:perfilId/documentos/:codigo — upload de um documento
router.post('/:codigo', requireAuth, requirePerfil, (req, res, next) => {
  // Injetar perfilId para o middleware de upload
  req.params.perfilId = req.params.perfilId || req.params.id;
  next();
}, createUploadMiddleware, (req, res) => {
  const db = getDb();
  const { codigo } = req.params;

  const docReq = db.prepare('SELECT * FROM documentos_requeridos WHERE codigo = ?').get(codigo);
  if (!docReq) {
    fs.unlinkSync(req.file.path);
    return res.status(404).json({ error: { code: 'DOC_NOT_FOUND', message: 'Código de documento não encontrado.' } });
  }

  // Remover arquivo anterior se existir
  const anterior = db.prepare('SELECT caminho_interno FROM documentos WHERE perfil_id = ? AND documento_codigo = ?').get(req.perfil.id, codigo);
  if (anterior) {
    try { fs.unlinkSync(anterior.caminho_interno); } catch {}
    db.prepare('DELETE FROM documentos WHERE perfil_id = ? AND documento_codigo = ?').run(req.perfil.id, codigo);
  }

  const isDocx = req.file.originalname.toLowerCase().endsWith('.docx');
  const mime = req.file.detectedMime || req.file.mimetype;

  db.prepare(
    'INSERT INTO documentos (perfil_id, documento_codigo, nome_arquivo_original, caminho_interno, mime_type, tamanho_bytes, status) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).run(req.perfil.id, codigo, req.file.originalname, req.file.path, mime, req.file.size, 'enviado');

  res.status(201).json({
    message: 'Documento enviado com sucesso.',
    is_docx: isDocx,
    aviso: isDocx ? 'Este arquivo é .docx — converta para PDF antes de gerar o pacote final.' : null,
    documento: {
      nome_arquivo_original: req.file.originalname,
      mime_type: mime,
      tamanho_bytes: req.file.size,
      status: 'enviado',
    },
  });
});

// DELETE /perfis/:perfilId/documentos/:codigo — remover documento
router.delete('/:codigo', requireAuth, requirePerfil, (req, res) => {
  const db = getDb();
  const doc = db.prepare('SELECT * FROM documentos WHERE perfil_id = ? AND documento_codigo = ?').get(req.perfil.id, req.params.codigo);
  if (!doc) {
    return res.status(404).json({ error: { code: 'DOC_NOT_FOUND', message: 'Documento não encontrado.' } });
  }
  try { fs.unlinkSync(doc.caminho_interno); } catch {}
  db.prepare('DELETE FROM documentos WHERE id = ?').run(doc.id);
  res.json({ message: 'Documento removido.' });
});

// GET /perfis/:perfilId/documentos/:codigo/download — stream autenticado do arquivo
router.get('/:codigo/download', requireAuth, requirePerfil, (req, res) => {
  const db = getDb();
  const doc = db.prepare('SELECT * FROM documentos WHERE perfil_id = ? AND documento_codigo = ?').get(req.perfil.id, req.params.codigo);
  if (!doc) {
    return res.status(404).json({ error: { code: 'DOC_NOT_FOUND', message: 'Documento não encontrado.' } });
  }
  if (!fs.existsSync(doc.caminho_interno)) {
    return res.status(404).json({ error: { code: 'FILE_NOT_FOUND', message: 'Arquivo não encontrado no servidor.' } });
  }
  res.setHeader('Content-Type', doc.mime_type);
  res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(doc.nome_arquivo_original)}"`);
  fs.createReadStream(doc.caminho_interno).pipe(res);
});

module.exports = router;

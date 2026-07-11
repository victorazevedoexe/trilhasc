const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { UPLOAD_DIR, MAX_FILE_SIZE_BYTES } = require('../config');

const ALLOWED_MIMES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

const ALLOWED_EXTENSIONS = ['.pdf', '.jpg', '.jpeg', '.png', '.docx'];

function generateInternalName(originalName) {
  const ext = path.extname(originalName).toLowerCase();
  const ts = Date.now();
  const rand = Math.random().toString(36).slice(2, 8);
  return `${ts}_${rand}${ext}`;
}

function createUploadMiddleware(req, res, next) {
  const contaId = req.conta.id;
  const perfilId = parseInt(req.params.perfilId || req.params.id, 10);
  const docCodigo = req.params.codigo || 'doc';

  const destDir = path.join(UPLOAD_DIR, String(contaId), String(perfilId), docCodigo);
  fs.mkdirSync(destDir, { recursive: true });

  const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, destDir),
    filename: (req, file, cb) => cb(null, generateInternalName(file.originalname)),
  });

  const upload = multer({
    storage,
    limits: { fileSize: MAX_FILE_SIZE_BYTES },
    fileFilter: (uploadReq, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      if (!ALLOWED_EXTENSIONS.includes(ext)) {
        return cb(new Error(`Extensão não permitida: ${ext}. Use PDF, JPG, PNG ou DOCX.`));
      }
      cb(null, true);
    },
  }).single('arquivo');

  upload(req, res, async (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: { code: 'FILE_TOO_LARGE', message: `Arquivo excede o limite de 5 MB.` } });
      }
      return res.status(400).json({ error: { code: 'UPLOAD_ERROR', message: err.message } });
    }
    if (err) {
      return res.status(400).json({ error: { code: 'UPLOAD_ERROR', message: err.message } });
    }
    if (!req.file) {
      return res.status(400).json({ error: { code: 'NO_FILE', message: 'Nenhum arquivo enviado.' } });
    }

    // Validação de MIME type real usando file-type (magic bytes)
    try {
      const { fileTypeFromFile } = await import('file-type');
      const detected = await fileTypeFromFile(req.file.path);

      // Para .docx o file-type pode retornar application/zip — aceitar se extensão for .docx
      const ext = path.extname(req.file.originalname).toLowerCase();
      const isDocx = ext === '.docx' && (!detected || detected.mime === 'application/zip' || detected.mime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      const isAllowed = detected && ALLOWED_MIMES.includes(detected.mime);

      if (!isAllowed && !isDocx) {
        fs.unlinkSync(req.file.path);
        return res.status(400).json({
          error: {
            code: 'INVALID_MIME',
            message: `Tipo de arquivo não permitido. Detected: ${detected?.mime || 'desconhecido'}. Use PDF, JPG, PNG ou DOCX.`,
          },
        });
      }

      // Guarda MIME detectado no objeto file
      req.file.detectedMime = detected?.mime || (isDocx ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' : 'application/octet-stream');
    } catch (ftErr) {
      console.warn('[upload] file-type check failed, skipping MIME validation:', ftErr.message);
      req.file.detectedMime = req.file.mimetype;
    }

    next();
  });
}

module.exports = { createUploadMiddleware };

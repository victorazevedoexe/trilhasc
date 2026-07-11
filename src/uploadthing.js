const { createUploadthing } = require('uploadthing/server');

const f = createUploadthing();

/**
 * Router do Uploadthing — define os tipos de arquivo aceitos.
 * A validação de autenticidade é feita quando o frontend salva
 * a URL no nosso backend (rota POST /api/perfis/:id/documentos/:codigo).
 */
const fileRouter = {
  documentoUploader: f({
    image: { maxFileSize: '5MB', maxFileCount: 1 },
    pdf: { maxFileSize: '5MB', maxFileCount: 1 },
    blob: { maxFileSize: '5MB', maxFileCount: 1 }, // .docx
  })
    .middleware(async () => {
      return {};
    })
    .onUploadComplete(async ({ file }) => {
      return { url: file.ufsUrl || file.url };
    }),
};

module.exports = { fileRouter };

const { PDFDocument, rgb } = require('pdf-lib');
const path = require('path');

/**
 * Mescla arquivos (PDFs e imagens) via URL em um único PDF.
 * Arquivos .docx são ignorados.
 *
 * @param {Array<{url: string, mime: string, nome: string}>} arquivos
 * @returns {Promise<{pdfBytes: Uint8Array, ignorados: Array<string>}>}
 */
async function mergeParaPDF(arquivos) {
  const mergedDoc = await PDFDocument.create();
  mergedDoc.setTitle('Pacote de Documentos — Trilhas Inova 3');
  mergedDoc.setAuthor('Sistema Trilhas Inova 3');

  const ignorados = [];

  for (const arquivo of arquivos) {
    const ext = path.extname(arquivo.nome).toLowerCase();

    if (ext === '.docx') {
      ignorados.push(arquivo.nome);
      continue;
    }

    try {
      // Busca o arquivo pela URL (Uploadthing CDN)
      const response = await fetch(arquivo.url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status} ao buscar ${arquivo.url}`);
      }
      const buffer = await response.arrayBuffer();
      const bytes = new Uint8Array(buffer);

      if (arquivo.mime === 'application/pdf') {
        const srcDoc = await PDFDocument.load(bytes, { ignoreEncryption: true });
        const pages = await mergedDoc.copyPages(srcDoc, srcDoc.getPageIndices());
        pages.forEach(p => mergedDoc.addPage(p));
      } else if (arquivo.mime === 'image/jpeg') {
        const img = await mergedDoc.embedJpg(bytes);
        const { width, height } = img.scale(1);
        const A4W = 595, A4H = 842;
        const scale = Math.min(A4W / width, A4H / height, 1);
        const page = mergedDoc.addPage([A4W, A4H]);
        page.drawImage(img, {
          x: (A4W - width * scale) / 2,
          y: (A4H - height * scale) / 2,
          width: width * scale,
          height: height * scale,
        });
      } else if (arquivo.mime === 'image/png') {
        const img = await mergedDoc.embedPng(bytes);
        const { width, height } = img.scale(1);
        const A4W = 595, A4H = 842;
        const scale = Math.min(A4W / width, A4H / height, 1);
        const page = mergedDoc.addPage([A4W, A4H]);
        page.drawImage(img, {
          x: (A4W - width * scale) / 2,
          y: (A4H - height * scale) / 2,
          width: width * scale,
          height: height * scale,
        });
      }
    } catch (err) {
      console.error(`[pdfMerge] Erro ao processar ${arquivo.nome}:`, err.message);
      const page = mergedDoc.addPage([595, 842]);
      page.drawText(`Erro ao processar: ${arquivo.nome}`, { x: 50, y: 400, size: 12, color: rgb(0.8, 0, 0) });
    }
  }

  const pdfBytes = await mergedDoc.save();
  return { pdfBytes, ignorados };
}

module.exports = { mergeParaPDF };

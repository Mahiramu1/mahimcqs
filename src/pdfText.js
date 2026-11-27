export async function extractPageText(pdf, page) {
  const documentPage = await pdf.getPage(page);
  const content = await documentPage.getTextContent();
  return content.items.map(item => item.str ?? '').join(' ').normalize('NFC').replace(/\s+/gu, ' ').trim();
}

export async function recognizePage(pdf, page, onProgress) {
  const documentPage = await pdf.getPage(page);
  const viewport = documentPage.getViewport({scale: 2});
  const canvas = document.createElement('canvas');
  canvas.width = Math.ceil(viewport.width);
  canvas.height = Math.ceil(viewport.height);
  await documentPage.render({canvasContext: canvas.getContext('2d'), viewport}).promise;
  const {createWorker} = await import('tesseract.js');
  const worker = await createWorker('eng+tel', 1, {
    logger(message) {
      if (message.status) onProgress(message.status);
    },
  });
  try {
    const {data} = await worker.recognize(canvas);
    return data.text.normalize('NFC').trim();
  } finally {
    await worker.terminate();
  }
}

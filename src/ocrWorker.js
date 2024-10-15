// ocrWorker.js
import Tesseract from 'tesseract.js';

globalThis.onmessage = async (e) => {
  const { imageURL, workerOptions } = e.data;

  try {
    const result = await Tesseract.recognize(imageURL, 'eng+tha', {
      ...workerOptions,
      tessedit_char_whitelist: '0123456789- .',
      psm: 7, // Treat the image as a single line of text
      logger: (message) => {
        globalThis.postMessage({ type: 'progress', message });
      }
    });

    globalThis.postMessage({ type: 'result', result: result.data.text });
  } catch (error) {
    globalThis.postMessage({ type: 'error', error: error.message });
  }
};

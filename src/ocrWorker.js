// ocrWorker.js
import Tesseract from 'tesseract.js';

self.onmessage = async (e) => {
  const { imageURL, workerOptions } = e.data;

  try {
    const result = await Tesseract.recognize(imageURL, 'eng+tha', {
      ...workerOptions,
      tessedit_char_whitelist: '0123456789- .',
      psm: 7, // Process the image as a single line of text
      logger: (message) => {
        self.postMessage({ type: 'progress', message });
      }
    });

    self.postMessage({ type: 'result', result: result.data.text });
  } catch (error) {
    self.postMessage({ type: 'error', error: error.message });
  }
};

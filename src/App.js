import React, { useState, useEffect, useCallback, useMemo } from 'react';
import './App.css';

const App = () => {
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [log, setLog] = useState('');

  const commitMessage = process.env.REACT_APP_COMMIT_MESSAGE || "Commit message unavailable";

  // Memoize workerOptions to avoid re-creation on every render
  const workerOptions = useMemo(() => ({
    workerPath: './tesseract-files/worker.min.js',
    corePath: './tesseract-files/tesseract-core.wasm.js',
    langPath: './tesseract-files',
  }), []);

  const updateLog = (message) => {
    setLog((prevLog) => `${prevLog}\n${message}`);
  };

  useEffect(() => {
    updateLog(`Latest commit message: ${commitMessage}`);
  }, [commitMessage]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(URL.createObjectURL(file));
      setLog(`Image selected: ${file.name}`);
    }
  };

  const scanImage = () => {
    if (!image) {
      updateLog("No image selected.");
      return;
    }

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = image;

    img.onload = () => {
      updateLog("Image loaded successfully.");

      const maxDimension = 600;
      const scale = Math.min(maxDimension / img.width, maxDimension / img.height);
      const width = img.width * scale;
      const height = img.height * scale;

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");

      ctx.filter = 'contrast(200%) brightness(150%)';
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob((blob) => {
        if (!blob) {
          updateLog("Failed to convert canvas to blob. Blob is null.");
          setLoading(false);
          return;
        }

        const imageURL = URL.createObjectURL(blob);
        updateLog("Canvas converted to blob. Starting OCR in separate thread...");

        const worker = new Worker(new URL('./ocrWorker.js', import.meta.url));

        worker.onmessage = (e) => {
          const { type, message, result, error } = e.data;
          if (type === 'progress') {
            updateLog(`Tesseract log: ${message.status} - ${Math.round(message.progress * 100)}%`);
          } else if (type === 'result') {
            updateLog("OCR completed successfully.");
            processOCRText(result);
            worker.terminate();
          } else if (type === 'error') {
            updateLog(`Error during OCR processing: ${error}`);
            setLoading(false);
            worker.terminate();
          }
        };

        worker.postMessage({ imageURL, workerOptions });
        setLoading(true);
      }, 'image/png');
    };

    img.onerror = (err) => {
      updateLog("Failed to load image. Please try a different image.");
      console.error("Image Load Error:", err);
    };
  };

  const processOCRText = (text) => {
    const lines = text.split('\n');
    lines.forEach((line, index) => {
      updateLog(`L${index + 1}: ${line}`);
    });
    updateLog("*******************************************************");

    const cleanedText = text.replace(/[^0-9\s-]/g, ' ').replace(/\s+/g, ' ');
    updateLog(`Cleaned OCR text:\n${cleanedText}`);

    const phoneNumbers = new Set();

    lines.forEach((line, index) => {
      updateLog(`Analyzing line ${index + 1}: ${line}`);
      const words = line.split(' ');
      words.forEach((word) => {
        updateLog(`Checking word: "${word}"`);
        const numberRegex = /^0\d([-.\s]?\d){8,9}$/;

        if (numberRegex.test(word)) {
          phoneNumbers.add(word);
          updateLog(`Matched mobile/landline number: ${word}`);
        }
      });
    });

    const detectedNumbers = Array.from(phoneNumbers);
    detectedNumbers.forEach((number, idx) => {
      updateLog(`Detected mobile number ${idx + 1}: ${number}`);
    });

    const processedResults = detectedNumbers.map((num) => ({
      number: num,
      sum: num.replace(/\D/g, '').split('').reduce((acc, curr) => acc + parseInt(curr), 0),
    }));
    setResults(processedResults);
    setLoading(false);
    updateLog(`Total mobile numbers found: ${detectedNumbers.length}`);
  };

  return (
    <div className="app">
      <h1>Horoscope Scanner</h1>
      <div className="upload-container">
        <input
          type="file"
          accept="image/*"
          onChange={handleImageChange}
          id="file-upload"
        />
        <label htmlFor="file-upload" className="file-upload-label">
          Choose Image
        </label>
        <button onClick={scanImage} disabled={loading}>
          {loading ? 'Scanning...' : 'Scan Image'}
        </button>
        {image && <img src={image} alt="Selected to scan" />}
      </div>

      <div className="results">
        {results.length > 0 && (
          <h2>Scanned Numbers & Their Sums</h2>
        )}
        <ul>
          {results.map((result, index) => (
            <li key={index}>
              Number: <strong>{result.number}</strong> - Sum: <strong>{result.sum}</strong>
            </li>
          ))}
        </ul>
      </div>

      <div className="log-section">
        <h2>Logs</h2>
        <pre>{log}</pre>
      </div>
    </div>
  );
};

export default App;

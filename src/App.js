import React, { useState, useEffect } from 'react';
import Tesseract from 'tesseract.js';
import './App.css';

const App = () => {
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [log, setLog] = useState('');

  const commitMessage = process.env.REACT_APP_COMMIT_MESSAGE || "Commit message unavailable";

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

  const updateLog = (message) => {
    setLog((prevLog) => `${prevLog}\n${message}`);
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

      // Resize the image to a manageable size
      const maxDimension = 800;
      const scale = Math.min(maxDimension / img.width, maxDimension / img.height);
      const width = img.width * scale;
      const height = img.height * scale;

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");

      ctx.filter = 'contrast(200%) brightness(150%)';
      ctx.drawImage(img, 0, 0, width, height); // Resize image while drawing onto the canvas

      canvas.toBlob((blob) => {
        if (!blob) {
          updateLog("Failed to convert canvas to blob. Blob is null.");
          setLoading(false);
          return;
        }

        const imageURL = URL.createObjectURL(blob);
        updateLog("Canvas converted to blob. Starting OCR...");

        setLoading(true);

        try {
          Tesseract.recognize(imageURL, 'eng+tha', {
            workerPath: './tesseract-files/worker.min.js',
            corePath: './tesseract-files/tesseract-core.wasm.js',
            langPath: './tesseract-files',
            tessedit_char_whitelist: '0123456789- .',
            psm: 6,
            logger: (message) => updateLog(`Tesseract log: ${JSON.stringify(message)}`)
          })
          .then(({ data: { text } }) => {
            updateLog("OCR completed successfully.");
            processOCRText(text);
          })
          .catch((err) => {
            console.error("Tesseract error:", err);
            updateLog(`Error during OCR processing: ${err.message || 'Unknown error'}`);
            setLoading(false);
          });
        } catch (error) {
          updateLog(`Unexpected error during OCR processing: ${error.message}`);
          setLoading(false);
        }
      }, 'image/png');
    };

    img.onerror = (err) => {
      console.error("Image load error:", err);
      updateLog("Failed to load image. Please try a different image.");
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

        // Regex for Thai phone numbers with flexible separators and lengths
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

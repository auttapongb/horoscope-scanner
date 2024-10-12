import React, { useState, useEffect } from 'react';
import Tesseract from 'tesseract.js';
import './App.css';

const App = () => {
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [log, setLog] = useState('');

  const tesseractVersion = "5.0.0"; // Replace with your actual Tesseract version if known

  useEffect(() => {
    updateLog(`Tesseract.js version: ${tesseractVersion}`);
  }, []);

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
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");

      ctx.filter = 'contrast(200%) brightness(150%)';
      ctx.drawImage(img, 0, 0);

      canvas.toBlob((blob) => {
        if (blob) {
          const imageURL = URL.createObjectURL(blob);
          updateLog("Canvas converted to blob. Starting OCR...");

          setLoading(true);

          Tesseract.recognize(imageURL, 'eng+tha', {
            tessedit_char_whitelist: '0123456789- ',
            psm: 6,
          })
            .then(({ data: { text } }) => {
              updateLog(`OCR completed. Raw text:\n****************************************`);
              
              // Split the text into lines and prefix with line numbers for clarity
              const lines = text.split('\n');
              lines.forEach((line, index) => {
                updateLog(`L${index + 1}: ${line}`);
              });
              updateLog(`*******************************************************`);

              // Clean up the text and continue with processing
              const cleanedText = text.replace(/[^0-9\s-]/g, ' ').replace(/\s+/g, ' ');
              updateLog(`Cleaned OCR text:\n${cleanedText}`);

              const mobileNumbers = new Set();

              lines.forEach((line, index) => {
                updateLog(`Analyzing line ${index + 1}: ${line}`);
                const words = line.split(' ');
                words.forEach((word) => {
                  const mobileRegex = /^(0[689]\d[-\s]?\d{3}[-\s]?\d{4})$|^(0[689]\d{1}[-\s]?\d{4}[-\s]?\d{3})$/;
                  const landlineRegex = /^02[-\s]?\d{3}[-\s]?\d{4}$/;

                  if (mobileRegex.test(word) || landlineRegex.test(word)) {
                    mobileNumbers.add(word);
                    updateLog(`Matched mobile/landline number: ${word}`);
                  }
                });
              });

              const detectedNumbers = Array.from(mobileNumbers);
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
            })
            .catch((err) => {
              console.error("Tesseract error:", err);
              updateLog(`Error during OCR processing: ${err.message}`);
              setLoading(false);
            });
        } else {
          updateLog("Failed to convert canvas to blob.");
        }
      }, "image/png");
    };

    img.onerror = (err) => {
      console.error("Image load error:", err);
      updateLog("Failed to load image. Please try a different image.");
    };
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
        {results.length > 0 && <h2>Scanned Numbers & Their Sums</h2>}
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

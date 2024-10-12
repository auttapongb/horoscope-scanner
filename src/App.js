import React, { useState } from 'react';
import Tesseract from 'tesseract.js';
import './App.css';

const App = () => {
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [log, setLog] = useState(''); // State to store logs for troubleshooting

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
      ctx.drawImage(img, 0, 0);

      canvas.toBlob((blob) => {
        if (blob) {
          const imageURL = URL.createObjectURL(blob);
          updateLog("Canvas converted to blob. Starting OCR...");

          setLoading(true);

          Tesseract.recognize(imageURL, 'eng')
            .then(({ data: { text } }) => {
              updateLog(`OCR completed. Extracted text:\n${text}`);
              const mobileNumbers = text.match(/0[689]{1}[0-9]{8}/g) || [];
              const processedResults = mobileNumbers.map((num) => ({
                number: num,
                sum: num.split('').reduce((acc, curr) => acc + parseInt(curr), 0),
              }));
              setResults(processedResults);
              setLoading(false);
              updateLog(`Found ${mobileNumbers.length} mobile numbers.`);
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

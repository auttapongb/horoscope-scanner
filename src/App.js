import React, { useState } from 'react';
import Tesseract from 'tesseract.js';
import './App.css';

const App = () => {
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(URL.createObjectURL(file));
    }
  };

  const scanImage = () => {
    if (!image) {
      console.log("No image selected na1");
      return;
    }
    
    console.log("Starting OCR...");
    setLoading(true);
    Tesseract.recognize(image, 'eng')
      .then(({ data: { text } }) => {
        console.log("OCR Result:", text);
        const mobileNumbers = text.match(/0[689]{1}[0-9]{8}/g) || [];
        const processedResults = mobileNumbers.map((num) => ({
          number: num,
          sum: num.split('').reduce((acc, curr) => acc + parseInt(curr), 0),
        }));
        setResults(processedResults);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Tesseract error:", err);
        setLoading(false);
      });
  };

  return (

    <div className="app">
      <h1>Horoscope Scanner</h1>
      <div className="upload-container">
        <input
          type="file"
          accept="image/*"
          onChange={handleImageChange}
        />
        {image && <img src={image} alt="Selected to scan" />}
        <button onClick={scanImage} disabled={loading}>
          {loading ? 'Scanning...' : 'Scan Image'}
        </button>
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
    </div>
  );
};

export default App;

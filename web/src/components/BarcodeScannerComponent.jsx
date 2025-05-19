import React, { useState } from 'react';
import { BarcodeScanner } from 'react-qr-barcode-scanner';

export default function BarcodeScannerComponent({ onDetected }) {
  const [error, setError] = useState(null);
  return (
    <div>
      <BarcodeScanner
        onUpdate={(err, result) => {
          if (err) setError(err.message);
          if (result) {
            setError(null);
            onDetected(result.text);
          }
        }}
        width={400}
        height={300}
      />
      {error && <div style={{ color: 'red' }}>{error}</div>}
    </div>
  );
} 
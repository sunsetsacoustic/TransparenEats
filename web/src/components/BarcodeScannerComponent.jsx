import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

export default function BarcodeScannerComponent({ onDetected }) {
  const videoRef = useRef(null);
  const [error, setError] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [debug, setDebug] = useState('');
  const [scanSuccess, setScanSuccess] = useState(false);
  const [scanLinePos, setScanLinePos] = useState(0);
  const [scanLineDir, setScanLineDir] = useState(1);
  const html5QrCodeRef = useRef(null);
  const scanLineInterval = useRef(null);

  // Scan line animation
  useEffect(() => {
    if (scanning) {
      scanLineInterval.current = setInterval(() => {
        setScanLinePos((pos) => {
          if (pos >= 95) {
            setScanLineDir(-1);
            return 95;
          } else if (pos <= 0) {
            setScanLineDir(1);
            return 0;
          }
          return pos + scanLineDir;
        });
      }, 10);
    } else {
      setScanLinePos(0);
      setScanLineDir(1);
      if (scanLineInterval.current) clearInterval(scanLineInterval.current);
    }
    return () => {
      if (scanLineInterval.current) clearInterval(scanLineInterval.current);
    };
  }, [scanning, scanLineDir]);

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      if (html5QrCodeRef.current) {
        html5QrCodeRef.current.stop().catch(() => {});
        html5QrCodeRef.current.clear().catch(() => {});
        html5QrCodeRef.current = null;
      }
      if (scanLineInterval.current) clearInterval(scanLineInterval.current);
    };
  }, []);

  const startScanner = async () => {
    setError(null);
    setDebug('');
    setScanSuccess(false);
    setScanning(true);
    setTimeout(() => setDebug('If the camera does not appear, check permissions or try a different browser.'), 5000);
    try {
      const config = {
        fps: 10,
        qrbox: { width: 320, height: 220 },
        aspectRatio: 1.5,
        formatsToSupport: [
          'QR_CODE',
          'EAN_13',
          'EAN_8',
          'UPC_A',
          'UPC_E',
          'CODE_128',
          'CODE_39',
          'CODABAR',
          'ITF',
          'CODE_93',
        ],
      };
      html5QrCodeRef.current = new Html5Qrcode(videoRef.current.id);
      await html5QrCodeRef.current.start(
        { facingMode: 'environment' },
        config,
        (decodedText, result) => {
          setDebug(`Barcode detected: ${decodedText}`);
          setScanSuccess(true);
          setTimeout(() => setScanSuccess(false), 1200);
          stopScanner();
          onDetected(decodedText);
        },
        (err) => {
          setDebug(`Frame processed. No barcode detected.`);
        }
      );
    } catch (err) {
      setError('Error initializing camera: ' + (err.message || err));
      setScanning(false);
    }
  };

  const stopScanner = async () => {
    setScanning(false);
    setDebug('');
    if (html5QrCodeRef.current) {
      try {
        await html5QrCodeRef.current.stop();
        await html5QrCodeRef.current.clear();
      } catch (e) {}
      html5QrCodeRef.current = null;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
      <div
        style={{
          position: 'relative',
          width: 340,
          height: 260,
          margin: '0 auto 16px auto',
          borderRadius: 24,
          overflow: 'hidden',
          boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
          background: 'rgba(255,255,255,0.05)',
          backdropFilter: 'blur(8px)',
          border: '1.5px solid rgba(255,255,255,0.18)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          id="barcode-video"
          ref={videoRef}
          style={{
            width: 320,
            height: 220,
            background: '#222',
            borderRadius: 16,
            overflow: 'hidden',
            position: 'relative',
            zIndex: 1,
          }}
        />
        {/* Scan line animation */}
        {scanning && (
          <div
            style={{
              position: 'absolute',
              left: 20,
              width: 280,
              height: 2,
              top: `${20 + (scanLinePos * 1.8)}px`,
              background: 'linear-gradient(90deg, #00eaff 0%, #fff 50%, #00eaff 100%)',
              opacity: 0.7,
              borderRadius: 2,
              boxShadow: '0 0 8px #00eaff',
              zIndex: 3,
              transition: 'top 0.05s',
              pointerEvents: 'none',
            }}
          />
        )}
        {/* Glassy overlay for scan success */}
        {scanSuccess && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              background: 'rgba(0,255,128,0.18)',
              border: '2px solid #00ff99',
              borderRadius: 24,
              zIndex: 4,
              boxShadow: '0 0 24px #00ff99',
              pointerEvents: 'none',
              transition: 'opacity 0.5s',
            }}
          />
        )}
        {/* Corners for scan area */}
        {scanning && [
          { top: 16, left: 16, rotate: '0deg' },
          { top: 16, right: 16, rotate: '90deg' },
          { bottom: 16, right: 16, rotate: '180deg' },
          { bottom: 16, left: 16, rotate: '270deg' },
        ].map((style, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              width: 32,
              height: 32,
              border: '3px solid #00eaff',
              borderRadius: 8,
              zIndex: 3,
              borderTop: style.top !== undefined ? '3px solid #00eaff' : 'none',
              borderBottom: style.bottom !== undefined ? '3px solid #00eaff' : 'none',
              borderLeft: style.left !== undefined ? '3px solid #00eaff' : 'none',
              borderRight: style.right !== undefined ? '3px solid #00eaff' : 'none',
              top: style.top,
              left: style.left,
              right: style.right,
              bottom: style.bottom,
              transform: `rotate(${style.rotate})`,
              pointerEvents: 'none',
            }}
          />
        ))}
        {/* Scanning indicator */}
        {scanning && (
          <div
            style={{
              position: 'absolute',
              bottom: 10,
              left: 0,
              width: '100%',
              textAlign: 'center',
              color: '#00eaff',
              fontWeight: 500,
              fontSize: 14,
              textShadow: '0 0 8px #000',
              zIndex: 5,
            }}
          >
            Scanning...
          </div>
        )}
      </div>
      <button
        onClick={scanning ? stopScanner : startScanner}
        style={{
          margin: '18px 0 0 0',
          padding: '12px 32px',
          borderRadius: 16,
          border: 'none',
          background: scanning
            ? 'linear-gradient(90deg, #00eaff 0%, #00ff99 100%)'
            : 'linear-gradient(90deg, #fff 0%, #00eaff 100%)',
          color: scanning ? '#fff' : '#222',
          fontWeight: 700,
          fontSize: 18,
          boxShadow: '0 4px 24px 0 rgba(31, 38, 135, 0.18)',
          cursor: 'pointer',
          outline: 'none',
          transition: 'background 0.3s, color 0.3s',
        }}
      >
        {scanning ? 'Stop Camera' : 'Start Camera'}
      </button>
      <div style={{ marginTop: 8, fontSize: 13, color: '#aaa', textAlign: 'center', maxWidth: 340 }}>
        Tap the video to try to focus (if supported by your device).
      </div>
      {error && <div style={{ marginTop: 8, color: 'red', fontWeight: 500, textAlign: 'center', maxWidth: 340 }}>{error}</div>}
      {debug && (
        <div style={{ marginTop: 8, color: '#888', fontSize: 12, textAlign: 'center', maxWidth: 340 }}>{debug}</div>
      )}
    </div>
  );
} 
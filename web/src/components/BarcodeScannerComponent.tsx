import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

export interface BarcodeScannerComponentProps {
  onDetected: (barcode: string) => void;
  autoStart?: boolean;
}

export interface BarcodeScannerComponentHandle {
  stopScanner: () => void;
  startScanner: () => void;
}

const BarcodeScannerComponent = forwardRef<BarcodeScannerComponentHandle, BarcodeScannerComponentProps>(
  ({ onDetected, autoStart = false }, ref) => {
    const videoRef = useRef<HTMLDivElement>(null);
    const [error, setError] = useState<string | null>(null);
    const [scanning, setScanning] = useState(false);
    const [debug, setDebug] = useState('');
    const [scanSuccess, setScanSuccess] = useState(false);
    const [scanLinePos, setScanLinePos] = useState(0);
    const [scanLineDir, setScanLineDir] = useState(1);
    const html5QrCodeRef = useRef<any>(null);
    const scanLineInterval = useRef<number | null>(null);

    useImperativeHandle(ref, () => ({
      stopScanner,
      startScanner,
    }));

    // Scan line animation
    useEffect(() => {
      if (scanning) {
        scanLineInterval.current = window.setInterval(() => {
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
        if (scanLineInterval.current) {
          window.clearInterval(scanLineInterval.current);
          scanLineInterval.current = null;
        }
      }
      return () => {
        if (scanLineInterval.current) {
          window.clearInterval(scanLineInterval.current);
          scanLineInterval.current = null;
        }
      };
    }, [scanning, scanLineDir]);

    useEffect(() => {
      // Cleanup on unmount
      return () => {
        stopScanner();
      };
    }, []);

    useEffect(() => {
      // Only start scanner on mount if autoStart is true
      if (autoStart) {
        startScanner();
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const startScanner = async () => {
      // Stop any existing scanner first
      await stopScanner();
      
      setError(null);
      setDebug('');
      setScanSuccess(false);
      setScanning(true);
      setTimeout(() => setDebug('If the camera does not appear, check permissions or try a different browser.'), 5000);
      try {
        const config = {
          fps: 10,
          qrbox: { width: 250, height: 180 },
          aspectRatio: 1.33,
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
        
        if (!videoRef.current) {
          throw new Error("Video container not available");
        }
        
        html5QrCodeRef.current = new Html5Qrcode(videoRef.current.id);
        await html5QrCodeRef.current.start(
          { facingMode: 'environment' },
          config,
          (decodedText: string) => {
            setDebug(`Barcode detected: ${decodedText}`);
            setScanSuccess(true);
            setTimeout(() => setScanSuccess(false), 1200);
            stopScanner();
            onDetected(decodedText);
          },
          () => {
            // Empty handler to avoid flooding logs
          }
        );
      } catch (err: any) {
        setError('Error initializing camera: ' + (err.message || err));
        setScanning(false);
      }
    };

    const stopScanner = async () => {
      setScanning(false);
      setDebug('');
      
      if (html5QrCodeRef.current) {
        try {
          if (html5QrCodeRef.current.isScanning) {
            await html5QrCodeRef.current.stop();
          }
          await html5QrCodeRef.current.clear();
        } catch (e) {
          console.log("Error stopping scanner:", e);
        }
        html5QrCodeRef.current = null;
      }
      
      if (scanLineInterval.current) {
        window.clearInterval(scanLineInterval.current);
        scanLineInterval.current = null;
      }
    };

    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        width: '100%',
        maxWidth: 400,
        height: 400,
        position: 'relative',
        overflow: 'hidden',
        margin: '0 auto',
        borderRadius: 16,
        boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
        background: '#f1f5f9',
      }}>
        <div
          id="barcode-video"
          ref={videoRef}
          style={{
            width: '100%',
            height: '100%',
            overflow: 'hidden',
            background: 'rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1,
            borderRadius: 16,
          }}
        />
        
        {/* Scan target area */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '80%',
          maxWidth: 250,
          height: 180,
          borderRadius: 16,
          border: '2px solid rgba(255,255,255,0.6)',
          boxShadow: '0 0 0 1000px rgba(0, 0, 0, 0.5)',
          zIndex: 2,
        }}></div>
        
        {/* Scan line animation */}
        {scanning && (
          <div
            style={{
              position: 'absolute',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '75%',
              maxWidth: 230,
              height: 2,
              top: `calc(50% - 90px + ${scanLinePos * 1.8}px)`,
              background: 'linear-gradient(90deg, rgba(0,234,255,0) 0%, #00eaff 50%, rgba(0,234,255,0) 100%)',
              opacity: 0.7,
              borderRadius: 2,
              boxShadow: '0 0 8px #00eaff',
              zIndex: 3,
              pointerEvents: 'none',
            }}
          />
        )}
        
        {/* Corners for scan area */}
        {scanning && [
          { top: '50%', left: '50%', transform: 'translate(-50%, -50%) translate(-120px, -85px) rotate(0deg)' },
          { top: '50%', left: '50%', transform: 'translate(-50%, -50%) translate(120px, -85px) rotate(90deg)' },
          { top: '50%', left: '50%', transform: 'translate(-50%, -50%) translate(120px, 85px) rotate(180deg)' },
          { top: '50%', left: '50%', transform: 'translate(-50%, -50%) translate(-120px, 85px) rotate(270deg)' },
        ].map((style, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              width: 24,
              height: 24,
              border: '3px solid #00eaff',
              borderRight: 'none',
              borderBottom: 'none',
              zIndex: 4,
              top: style.top,
              left: style.left,
              transform: style.transform,
              pointerEvents: 'none',
            }}
          />
        ))}
        
        {/* Glassy overlay for scan success */}
        {scanSuccess && (
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '80%',
              maxWidth: 250,
              height: 180,
              background: 'rgba(0,255,128,0.18)',
              border: '2px solid #00ff99',
              borderRadius: 16,
              zIndex: 5,
              boxShadow: '0 0 24px #00ff99',
              pointerEvents: 'none',
              transition: 'opacity 0.5s',
            }}
          />
        )}

        {/* Error message */}
        {error && (
          <div style={{ 
            position: 'absolute', 
            bottom: 20, 
            left: 0, 
            width: '100%',
            background: 'rgba(255,0,0,0.7)',
            color: 'white',
            padding: '10px',
            textAlign: 'center',
            zIndex: 10
          }}>
            {error}
            <div style={{marginTop: 8}}>
              <button 
                onClick={startScanner}
                style={{
                  padding: '8px 16px',
                  background: 'white',
                  color: 'black',
                  border: 'none',
                  borderRadius: 8,
                  fontWeight: 'bold'
                }}
              >
                Try Again
              </button>
            </div>
          </div>
        )}
        
        {/* Camera permissions hint - only shows on error or long delay */}
        {(debug && !scanning) && (
          <div style={{ 
            position: 'absolute', 
            top: '50%', 
            left: '50%', 
            transform: 'translate(-50%, -50%)',
            color: 'white',
            textAlign: 'center',
            maxWidth: '80%',
            zIndex: 10,
            background: 'rgba(0,0,0,0.7)',
            padding: 16,
            borderRadius: 16
          }}>
            {debug}
            <div style={{marginTop: 12}}>
              <button 
                onClick={startScanner}
                style={{
                  padding: '8px 16px',
                  background: 'linear-gradient(90deg, #00eaff 0%, #00ff99 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: 8,
                  fontWeight: 'bold'
                }}
              >
                Start Camera
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }
);

export default BarcodeScannerComponent; 
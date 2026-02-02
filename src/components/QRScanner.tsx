import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeScannerState } from 'html5-qrcode';
import { Camera, CameraOff, RefreshCw, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface QRScannerProps {
  onScan: (data: string) => void;
  onError?: (error: string) => void;
  isActive: boolean;
}

export const QRScanner: React.FC<QRScannerProps> = ({ onScan, onError, isActive }) => {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const containerId = 'qr-reader';

  const startScanner = async () => {
    if (scannerRef.current) {
      try {
        const state = scannerRef.current.getState();
        if (state === Html5QrcodeScannerState.SCANNING) {
          return;
        }
      } catch {
        // Scanner not initialized yet
      }
    }

    try {
      setError(null);
      setPermissionDenied(false);
      
      // Create scanner instance
      const html5QrCode = new Html5Qrcode(containerId);
      scannerRef.current = html5QrCode;

      // Get available cameras
      const cameras = await Html5Qrcode.getCameras();
      
      if (cameras.length === 0) {
        throw new Error('No camera found');
      }

      // Prefer back camera on mobile
      const backCamera = cameras.find(cam => 
        cam.label.toLowerCase().includes('back') || 
        cam.label.toLowerCase().includes('rear') ||
        cam.label.toLowerCase().includes('environment')
      );
      const cameraId = backCamera?.id || cameras[0].id;

      await html5QrCode.start(
        cameraId,
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0
        },
        (decodedText) => {
          // Play success sound feedback
          try {
            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
            oscillator.connect(audioContext.destination);
            oscillator.start();
            oscillator.stop(audioContext.currentTime + 0.1);
          } catch {
            // Audio feedback not critical
          }
          
          onScan(decodedText);
        },
        () => {
          // Ignore scan failures (continuous scanning)
        }
      );

      setIsScanning(true);
    } catch (err: any) {
      console.error('QR Scanner error:', err);
      
      if (err.message?.includes('Permission') || err.name === 'NotAllowedError') {
        setPermissionDenied(true);
        setError('Camera permission denied. Please allow camera access.');
      } else if (err.message?.includes('No camera')) {
        setError('No camera found on this device.');
      } else {
        setError(err.message || 'Failed to start camera');
      }
      
      onError?.(err.message || 'Scanner error');
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        const state = scannerRef.current.getState();
        if (state === Html5QrcodeScannerState.SCANNING) {
          await scannerRef.current.stop();
        }
        scannerRef.current.clear();
      } catch (err) {
        console.error('Error stopping scanner:', err);
      }
      scannerRef.current = null;
    }
    setIsScanning(false);
  };

  useEffect(() => {
    if (isActive) {
      startScanner();
    } else {
      stopScanner();
    }

    return () => {
      stopScanner();
    };
  }, [isActive]);

  if (permissionDenied) {
    return (
      <Card className="bg-destructive/10 border-destructive">
        <CardContent className="p-6 text-center">
          <CameraOff className="h-16 w-16 text-destructive mx-auto mb-4" />
          <h3 className="font-semibold text-lg text-foreground mb-2">Camera Access Denied</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Please allow camera access in your browser settings to scan QR codes.
          </p>
          <Button onClick={startScanner} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-muted">
        <CardContent className="p-6 text-center">
          <AlertCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-semibold text-lg text-foreground mb-2">Scanner Error</h3>
          <p className="text-sm text-muted-foreground mb-4">{error}</p>
          <Button onClick={startScanner} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="relative">
      <div 
        id={containerId} 
        className="w-full rounded-lg overflow-hidden bg-black"
        style={{ minHeight: '300px' }}
      />
      
      {!isScanning && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted rounded-lg">
          <Button onClick={startScanner} size="lg">
            <Camera className="h-5 w-5 mr-2" />
            Start Camera
          </Button>
        </div>
      )}

      {isScanning && (
        <div className="absolute bottom-4 left-0 right-0 text-center">
          <p className="text-sm text-white bg-black/60 inline-block px-4 py-2 rounded-full">
            Point camera at QR code
          </p>
        </div>
      )}
    </div>
  );
};

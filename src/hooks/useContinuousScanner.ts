import { useRef, useCallback, useEffect, useState } from 'react';
import { BrowserMultiFormatReader } from '@zxing/browser';

interface UseContinuousScannerOptions {
  onScan: (barcode: string) => void;
  onError?: (error: string) => void;
  scanInterval?: number; // milliseconds between scan attempts
  debounceTime?: number; // milliseconds to prevent duplicate scans
}

interface ScannerState {
  isScanning: boolean;
  lastScannedCode: string | null;
  lastScanTime: number;
  scanAttempts: number;
}

export const useContinuousScanner = ({
  onScan,
  onError,
  scanInterval = 100, // 10 FPS for battery efficiency
  debounceTime = 2000 // 2 seconds to prevent duplicate scans
}: UseContinuousScannerOptions) => {
  const codeReaderRef = useRef<BrowserMultiFormatReader | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const scanLoopRef = useRef<number | null>(null);
  const [scannerState, setScannerState] = useState<ScannerState>({
    isScanning: false,
    lastScannedCode: null,
    lastScanTime: 0,
    scanAttempts: 0
  });

  // Initialize code reader
  const initializeCodeReader = useCallback(() => {
    if (!codeReaderRef.current) {
      codeReaderRef.current = new BrowserMultiFormatReader();
    }
    return codeReaderRef.current;
  }, []);

  // Single scan attempt
  const attemptScan = useCallback(async (): Promise<string | null> => {
    if (!videoRef.current || !codeReaderRef.current) {
      return null;
    }

    try {
      const result = await codeReaderRef.current.decodeOnceFromVideoDevice(
        undefined, 
        videoRef.current
      );
      
      if (result) {
        return result.getText();
      }
    } catch (error) {
      // Silent catch - scanning will continue
      // Only log if it's not a common "not found" error
      if (error instanceof Error && !error.message.includes('No MultiFormat Readers')) {
        console.debug('Scan attempt failed:', error.message);
      }
    }
    
    return null;
  }, []);

  // Continuous scanning loop
  const scanLoop = useCallback(async () => {
    if (!scannerState.isScanning) {
      return;
    }

    const now = Date.now();
    
    try {
      const barcode = await attemptScan();
      
      if (barcode) {
        // Check if this is a duplicate scan within debounce time
        const isDuplicate = 
          scannerState.lastScannedCode === barcode && 
          (now - scannerState.lastScanTime) < debounceTime;
        
        if (!isDuplicate) {
          // Update state
          setScannerState(prev => ({
            ...prev,
            lastScannedCode: barcode,
            lastScanTime: now,
            scanAttempts: prev.scanAttempts + 1
          }));

          // Trigger haptic feedback
          if ('vibrate' in navigator) {
            navigator.vibrate([100, 50, 100]);
          }

          // Call the onScan callback
          onScan(barcode);
          
          // Stop scanning after successful scan
          stopScanning();
          return;
        }
      }

      // Update scan attempts counter
      setScannerState(prev => ({
        ...prev,
        scanAttempts: prev.scanAttempts + 1
      }));

    } catch (error) {
      console.error('Scan loop error:', error);
      if (onError) {
        onError(error instanceof Error ? error.message : 'Scanning error occurred');
      }
    }

    // Schedule next scan attempt
    if (scannerState.isScanning) {
      scanLoopRef.current = window.setTimeout(scanLoop, scanInterval);
    }
  }, [scannerState.isScanning, scannerState.lastScannedCode, scannerState.lastScanTime, 
      attemptScan, onScan, onError, scanInterval, debounceTime]);

  // Start continuous scanning
  const startScanning = useCallback((videoElement: HTMLVideoElement) => {
    if (scannerState.isScanning) {
      return;
    }

    videoRef.current = videoElement;
    initializeCodeReader();
    
    setScannerState(prev => ({
      ...prev,
      isScanning: true,
      scanAttempts: 0
    }));

    // Start the scanning loop
    scanLoop();
  }, [scannerState.isScanning, initializeCodeReader, scanLoop]);

  // Stop continuous scanning
  const stopScanning = useCallback(() => {
    setScannerState(prev => ({
      ...prev,
      isScanning: false
    }));

    // Clear the timeout
    if (scanLoopRef.current) {
      clearTimeout(scanLoopRef.current);
      scanLoopRef.current = null;
    }
  }, []);

  // Reset scanner state
  const resetScanner = useCallback(() => {
    stopScanning();
    setScannerState({
      isScanning: false,
      lastScannedCode: null,
      lastScanTime: 0,
      scanAttempts: 0
    });
  }, [stopScanning]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopScanning();
      // Clean up code reader reference
      codeReaderRef.current = null;
    };
  }, [stopScanning]);

  return {
    isScanning: scannerState.isScanning,
    lastScannedCode: scannerState.lastScannedCode,
    scanAttempts: scannerState.scanAttempts,
    startScanning,
    stopScanning,
    resetScanner
  };
};

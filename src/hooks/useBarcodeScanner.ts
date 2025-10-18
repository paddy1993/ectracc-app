import { useState, useEffect, useRef, useCallback } from 'react';
import { BrowserMultiFormatReader, Result } from '@zxing/library';
import logger from '../utils/logger';

interface UseBarcodeScanner {
  isScanning: boolean;
  error: string | null;
  hasCamera: boolean;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  startScanning: () => Promise<void>;
  stopScanning: () => void;
  resetError: () => void;
  isNativeWrapper: boolean;
  startNativeScanner: () => void;
  stopNativeScanner: () => void;
}

interface UseBarccodeScannerOptions {
  onResult?: (result: string) => void;
  onError?: (error: string) => void;
  videoDeviceId?: string;
}

export function useBarcodeScanner(options: UseBarccodeScannerOptions = {}): UseBarcodeScanner {
  const { onResult, onError, videoDeviceId } = options;
  
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasCamera, setHasCamera] = useState(false);
  const [isNativeWrapper, setIsNativeWrapper] = useState(false);
  
  const codeReaderRef = useRef<BrowserMultiFormatReader | null>(null);
  const videoElementRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Check camera availability and native environment on mount
  useEffect(() => {
    // Check if running in native wrapper
    setIsNativeWrapper(!!(window as any).ReactNativeWebView || !!(window as any).nativeBridge);
    
    const checkCameraAvailability = async () => {
      try {
        if (isNativeWrapper) {
          // In native wrapper, assume camera is available if permission is granted
          setHasCamera(true);
          return;
        }

        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          setHasCamera(false);
          return;
        }

        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(device => device.kind === 'videoinput');
        setHasCamera(videoDevices.length > 0);
      } catch (error) {
        console.error('Error checking camera availability:', error);
        setHasCamera(false);
      }
    };

    checkCameraAvailability();
  }, [isNativeWrapper]);

  // Initialize code reader
  useEffect(() => {
    codeReaderRef.current = new BrowserMultiFormatReader();
    
    return () => {
      if (codeReaderRef.current) {
        codeReaderRef.current.reset();
      }
    };
  }, []);

  const startScanning = useCallback(async () => {
    if (!codeReaderRef.current) return;
    if (!hasCamera) {
      const errorMsg = 'No camera available';
      setError(errorMsg);
      onError?.(errorMsg);
      return;
    }

    try {
      setIsScanning(true);
      setError(null);

      // Get video element (create if doesn't exist)
      if (!videoElementRef.current) {
        videoElementRef.current = document.createElement('video');
        videoElementRef.current.style.width = '100%';
        videoElementRef.current.style.height = '100%';
        videoElementRef.current.style.objectFit = 'cover';
      }

      // Request camera access
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: 'environment', // Prefer back camera
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      };

      if (videoDeviceId) {
        constraints.video = {
          ...constraints.video as MediaTrackConstraints,
          deviceId: { exact: videoDeviceId }
        };
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      videoElementRef.current.srcObject = stream;

      // Start decoding
      await codeReaderRef.current.decodeFromVideoDevice(
        videoDeviceId || null,
        videoElementRef.current,
        (result: Result | null, error?: Error) => {
          if (result) {
            const barcodeText = result.getText();
            onResult?.(barcodeText);
            stopScanning(); // Stop after successful scan
          }
          
          if (error && !(error.name === 'NotFoundException')) {
            // NotFoundException is expected when no barcode is found
            console.error('Barcode scanning error:', error);
          }
        }
      );
    } catch (error: any) {
      console.error('Error starting barcode scanner:', error);
      let errorMessage = 'Failed to start camera';
      
      if (error.name === 'NotAllowedError') {
        errorMessage = 'Camera access denied. Please allow camera permissions and try again.';
      } else if (error.name === 'NotFoundError') {
        errorMessage = 'No camera found on this device.';
      } else if (error.name === 'NotSupportedError') {
        errorMessage = 'Camera not supported on this device.';
      }
      
      setError(errorMessage);
      onError?.(errorMessage);
      setIsScanning(false);
    }
  }, [hasCamera, videoDeviceId, onResult, onError]);

  const stopScanning = useCallback(() => {
    if (codeReaderRef.current) {
      codeReaderRef.current.reset();
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (videoElementRef.current) {
      videoElementRef.current.srcObject = null;
    }
    
    setIsScanning(false);
  }, []);

  const resetError = useCallback(() => {
    setError(null);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopScanning();
    };
  }, [stopScanning]);

  // Native scanner functions
  const startNativeScanner = useCallback(() => {
    if (isNativeWrapper && (window as any).nativeBridge?.scanBarcode) {
      logger.log('Starting native barcode scanner');
      (window as any).nativeBridge.scanBarcode();
    } else {
      logger.log('Native scanner not available');
    }
  }, [isNativeWrapper]);

  const stopNativeScanner = useCallback(() => {
    if (isNativeWrapper) {
      logger.log('Native scanner stopped');
      // Native scanner typically stops automatically after scan
    }
  }, [isNativeWrapper]);

  return {
    isScanning,
    error,
    hasCamera,
    videoRef: videoElementRef,
    startScanning,
    stopScanning,
    resetError,
    // Native wrapper support
    isNativeWrapper,
    startNativeScanner,
    stopNativeScanner
  };
}

// Hook to get video element ref for rendering
export function useBarcodeVideoElement() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  
  useEffect(() => {
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);
  
  return videoRef;
}

/**
 * Scanner utility functions for barcode processing and camera management
 */

import logger from './logger';

export interface CameraCapabilities {
  hasFlash: boolean;
  hasFrontCamera: boolean;
  hasBackCamera: boolean;
  supportsFocus: boolean;
  maxResolution: { width: number; height: number };
}

export interface ScanResult {
  barcode: string;
  format: string;
  timestamp: number;
  confidence?: number;
}

/**
 * Get optimal camera constraints for barcode scanning
 */
export const getOptimalCameraConstraints = (
  facingMode: 'user' | 'environment' = 'environment'
): MediaStreamConstraints => {
  return {
    video: {
      facingMode: { ideal: facingMode },
      width: { ideal: 1280, min: 640 },
      height: { ideal: 720, min: 480 },
      frameRate: { ideal: 30, min: 15 }
    }
  };
};

/**
 * Analyze camera capabilities
 */
export const analyzeCameraCapabilities = async (
  stream: MediaStream
): Promise<CameraCapabilities> => {
  const videoTrack = stream.getVideoTracks()[0];
  const capabilities = videoTrack.getCapabilities();
  const settings = videoTrack.getSettings();

  return {
    hasFlash: 'torch' in capabilities,
    hasFrontCamera: true, // Assume available, will be tested during camera switch
    hasBackCamera: true,
    supportsFocus: 'focusMode' in capabilities,
    maxResolution: {
      width: capabilities.width?.max || settings.width || 1280,
      height: capabilities.height?.max || settings.height || 720
    }
  };
};

/**
 * Apply camera focus (if supported)
 */
export const applyCameraFocus = async (stream: MediaStream): Promise<boolean> => {
  try {
    const videoTrack = stream.getVideoTracks()[0];
    const capabilities = videoTrack.getCapabilities();
    
    // Check if focus mode is supported (this is experimental and may not work on all devices)
    if ('focusMode' in capabilities) {
      try {
        await videoTrack.applyConstraints({
          advanced: [{ focusMode: 'single-shot' } as any]
        });
        
        // Reset to continuous after a brief moment
        setTimeout(async () => {
          try {
            await videoTrack.applyConstraints({
              advanced: [{ focusMode: 'continuous' } as any]
            });
          } catch (error) {
            logger.debug('Failed to reset focus mode:', error);
          }
        }, 1000);
        
        return true;
      } catch (error) {
        logger.debug('Focus mode not supported or failed:', error);
        return false;
      }
    }
    
    return false;
  } catch (error) {
    logger.debug('Failed to apply focus:', error);
    return false;
  }
};

/**
 * Toggle camera flash/torch
 */
export const toggleCameraFlash = async (
  stream: MediaStream, 
  enabled: boolean
): Promise<boolean> => {
  try {
    const videoTrack = stream.getVideoTracks()[0];
    const capabilities = videoTrack.getCapabilities();
    
    if ('torch' in capabilities) {
      await videoTrack.applyConstraints({
        advanced: [{ torch: enabled } as any]
      });
      return true;
    }
    
    return false;
  } catch (error) {
    logger.debug('Failed to toggle flash:', error);
    return false;
  }
};

/**
 * Validate barcode format and content
 */
export const validateBarcode = (barcode: string): boolean => {
  if (!barcode || typeof barcode !== 'string') {
    return false;
  }

  // Remove whitespace
  const cleanBarcode = barcode.trim();
  
  // Check minimum length
  if (cleanBarcode.length < 8) {
    return false;
  }

  // Check if it contains only valid characters (digits and some special chars)
  const validPattern = /^[0-9A-Za-z\-\.\_\+\s]+$/;
  if (!validPattern.test(cleanBarcode)) {
    return false;
  }

  // Check for common barcode formats
  const formats = {
    UPC_A: /^\d{12}$/,
    UPC_E: /^\d{8}$/,
    EAN_13: /^\d{13}$/,
    EAN_8: /^\d{8}$/,
    CODE_128: /^[0-9A-Za-z\-\.\_\+\s]{8,}$/,
    CODE_39: /^[0-9A-Z\-\.\_\+\s\$\/\%]{8,}$/
  };

  // Check if barcode matches any known format
  return Object.values(formats).some(pattern => pattern.test(cleanBarcode));
};

/**
 * Format barcode for display
 */
export const formatBarcodeForDisplay = (barcode: string): string => {
  if (!barcode) return '';
  
  const clean = barcode.trim();
  
  // Format common barcode types with spacing for readability
  if (/^\d{12}$/.test(clean)) {
    // UPC-A: 123456 789012
    return clean.replace(/(\d{6})(\d{6})/, '$1 $2');
  }
  
  if (/^\d{13}$/.test(clean)) {
    // EAN-13: 1 234567 890123
    return clean.replace(/(\d{1})(\d{6})(\d{6})/, '$1 $2 $3');
  }
  
  if (/^\d{8}$/.test(clean)) {
    // EAN-8/UPC-E: 1234 5678
    return clean.replace(/(\d{4})(\d{4})/, '$1 $2');
  }
  
  return clean;
};

/**
 * Get barcode format name
 */
export const getBarcodeFormat = (barcode: string): string => {
  if (!barcode) return 'Unknown';
  
  const clean = barcode.trim();
  
  if (/^\d{12}$/.test(clean)) return 'UPC-A';
  if (/^\d{13}$/.test(clean)) return 'EAN-13';
  if (/^\d{8}$/.test(clean)) return 'EAN-8/UPC-E';
  if (/^[0-9A-Za-z\-\.\_\+\s]{8,}$/.test(clean)) return 'Code 128';
  if (/^[0-9A-Z\-\.\_\+\s\$\/\%]{8,}$/.test(clean)) return 'Code 39';
  
  return 'Unknown Format';
};

/**
 * Check if device supports camera
 */
export const checkCameraSupport = (): boolean => {
  return !!(
    navigator.mediaDevices && 
    navigator.mediaDevices.getUserMedia
  );
};

/**
 * Request camera permissions
 */
export const requestCameraPermission = async (): Promise<boolean> => {
  try {
    if (!checkCameraSupport()) {
      return false;
    }

    // Request permission by trying to get a stream
    const stream = await navigator.mediaDevices.getUserMedia({ 
      video: { facingMode: 'environment' } 
    });
    
    // Immediately stop the stream since we just wanted to check permission
    stream.getTracks().forEach(track => track.stop());
    
    return true;
  } catch (error) {
    logger.debug('Camera permission denied or not available:', error);
    return false;
  }
};

/**
 * Get available camera devices
 */
export const getAvailableCameras = async (): Promise<MediaDeviceInfo[]> => {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    return devices.filter(device => device.kind === 'videoinput');
  } catch (error) {
    logger.debug('Failed to enumerate camera devices:', error);
    return [];
  }
};

/**
 * Trigger haptic feedback for scan events
 */
export const triggerHapticFeedback = (type: 'success' | 'error' | 'light' = 'success'): void => {
  if (!('vibrate' in navigator)) {
    return;
  }

  switch (type) {
    case 'success':
      navigator.vibrate([100, 50, 100]); // Double pulse
      break;
    case 'error':
      navigator.vibrate([200, 100, 200, 100, 200]); // Triple pulse
      break;
    case 'light':
      navigator.vibrate(50); // Single short pulse
      break;
  }
};

/**
 * Create scan result object
 */
export const createScanResult = (
  barcode: string, 
  format?: string, 
  confidence?: number
): ScanResult => {
  return {
    barcode: barcode.trim(),
    format: format || getBarcodeFormat(barcode),
    timestamp: Date.now(),
    confidence
  };
};

// Enhanced Service Worker Registration for ECTRACC PWA

import logger from '../utils/logger';

const isLocalhost = Boolean(
  window.location.hostname === 'localhost' ||
  window.location.hostname === '[::1]' ||
  window.location.hostname.match(
    /^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/
  )
);

type Config = {
  onSuccess?: (registration: ServiceWorkerRegistration) => void;
  onUpdate?: (registration: ServiceWorkerRegistration) => void;
  onOfflineReady?: () => void;
  onNeedRefresh?: () => void;
};

export function register(config?: Config) {
  if ('serviceWorker' in navigator) {
    const publicUrl = new URL(process.env.PUBLIC_URL || '', window.location.href);
    
    if (publicUrl.origin !== window.location.origin) {
      return;
    }

    window.addEventListener('load', () => {
      const swUrl = `${process.env.PUBLIC_URL}/sw.js`;

      if (isLocalhost) {
        checkValidServiceWorker(swUrl, config);
        navigator.serviceWorker.ready.then(() => {
          logger.log(
            '[SW] This web app is being served cache-first by a service worker.'
          );
        });
      } else {
        registerValidSW(swUrl, config);
      }
    });
  }
}

function registerValidSW(swUrl: string, config?: Config) {
  navigator.serviceWorker
    .register(swUrl)
    .then((registration) => {
      logger.log('[SW] Service worker registered successfully');
      
      // Handle updates
      registration.addEventListener('updatefound', () => {
        const installingWorker = registration.installing;
        
        if (installingWorker == null) {
          return;
        }

        installingWorker.addEventListener('statechange', () => {
          if (installingWorker.state === 'installed') {
            if (navigator.serviceWorker.controller) {
              logger.log('[SW] New content is available; please refresh.');
              
              // Execute callback
              if (config && config.onUpdate) {
                config.onUpdate(registration);
              }
              
              // Dispatch custom event
              window.dispatchEvent(new CustomEvent('pwa-update-available', {
                detail: { registration }
              }));
            } else {
              logger.log('[SW] Content is cached for offline use.');
              
              // Execute callback
              if (config && config.onSuccess) {
                config.onSuccess(registration);
              }
              
              // Execute offline ready callback
              if (config && config.onOfflineReady) {
                config.onOfflineReady();
              }
            }
          }
        });
      });

      // Check for updates periodically
      setInterval(() => {
        registration.update();
      }, 60000); // Check every minute

      // Listen for messages from service worker
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'SYNC_SUCCESS') {
          logger.log('[SW] Background sync successful:', event.data.action);
          
          // Dispatch custom event
          window.dispatchEvent(new CustomEvent('sw-sync-success', {
            detail: { action: event.data.action }
          }));
        }
      });

      // Handle skip waiting message
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        logger.log('[SW] Controller changed, reloading page');
        window.location.reload();
      });
    })
    .catch((error) => {
      console.error('[SW] Service worker registration failed:', error);
    });
}

function checkValidServiceWorker(swUrl: string, config?: Config) {
  fetch(swUrl, {
    headers: { 'Service-Worker': 'script' },
  })
    .then((response) => {
      const contentType = response.headers.get('content-type');
      
      if (
        response.status === 404 ||
        (contentType != null && contentType.indexOf('javascript') === -1)
      ) {
        navigator.serviceWorker.ready.then((registration) => {
          registration.unregister().then(() => {
            window.location.reload();
          });
        });
      } else {
        registerValidSW(swUrl, config);
      }
    })
    .catch(() => {
      logger.log('[SW] No internet connection found. App is running in offline mode.');
    });
}

export function unregister() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready
      .then((registration) => {
        registration.unregister();
      })
      .catch((error) => {
        console.error('[SW] Service worker unregistration failed:', error);
      });
  }
}

// Enhanced PWA utilities
export class PWAUtils {
  // Check if app is running as PWA
  static isPWA(): boolean {
    return window.matchMedia('(display-mode: standalone)').matches ||
           (window.navigator as any).standalone === true;
  }

  // Get PWA display mode
  static getDisplayMode(): string {
    if (window.matchMedia('(display-mode: standalone)').matches) {
      return 'standalone';
    }
    if (window.matchMedia('(display-mode: minimal-ui)').matches) {
      return 'minimal-ui';
    }
    if (window.matchMedia('(display-mode: fullscreen)').matches) {
      return 'fullscreen';
    }
    return 'browser';
  }

  // Check if device supports PWA features
  static checkPWASupport() {
    return {
      serviceWorker: 'serviceWorker' in navigator,
      pushNotifications: 'PushManager' in window,
      backgroundSync: 'serviceWorker' in navigator && 'sync' in (window as any).ServiceWorkerRegistration.prototype,
      webShare: 'share' in navigator,
      installPrompt: 'BeforeInstallPromptEvent' in window,
      fullscreen: 'requestFullscreen' in document.documentElement,
      screenOrientation: 'orientation' in screen,
      vibration: 'vibrate' in navigator,
      geolocation: 'geolocation' in navigator,
      deviceMotion: 'DeviceMotionEvent' in window,
      storage: 'storage' in navigator
    };
  }

  // Request persistent storage
  static async requestPersistentStorage(): Promise<boolean> {
    if ('storage' in navigator && 'persist' in navigator.storage) {
      try {
        const persistent = await navigator.storage.persist();
        logger.log(`[PWA] Persistent storage: ${persistent}`);
        return persistent;
      } catch (error) {
        console.error('[PWA] Persistent storage request failed:', error);
      }
    }
    return false;
  }

  // Get storage estimate
  static async getStorageEstimate() {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      try {
        const estimate = await navigator.storage.estimate();
        return {
          quota: estimate.quota,
          usage: estimate.usage,
          usagePercentage: estimate.quota ? (estimate.usage! / estimate.quota) * 100 : 0
        };
      } catch (error) {
        console.error('[PWA] Storage estimate failed:', error);
      }
    }
    return null;
  }

  // Share content using Web Share API
  static async share(data: ShareData): Promise<boolean> {
    if ('share' in navigator) {
      try {
        await navigator.share(data);
        return true;
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          console.error('[PWA] Web Share failed:', error);
        }
      }
    }
    return false;
  }

  // Request fullscreen
  static async requestFullscreen(): Promise<boolean> {
    try {
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
        return true;
      }
    } catch (error) {
      console.error('[PWA] Fullscreen request failed:', error);
    }
    return false;
  }

  // Exit fullscreen
  static async exitFullscreen(): Promise<boolean> {
    try {
      if (document.exitFullscreen) {
        await document.exitFullscreen();
        return true;
      }
    } catch (error) {
      console.error('[PWA] Exit fullscreen failed:', error);
    }
    return false;
  }

  // Vibrate device
  static vibrate(pattern: number | number[]): boolean {
    if ('vibrate' in navigator) {
      try {
        navigator.vibrate(pattern);
        return true;
      } catch (error) {
        console.error('[PWA] Vibration failed:', error);
      }
    }
    return false;
  }

  // Lock screen orientation
  static async lockOrientation(orientation: OrientationLockType): Promise<boolean> {
    if ('orientation' in screen && 'lock' in screen.orientation) {
      try {
        await screen.orientation.lock(orientation);
        return true;
      } catch (error) {
        console.error('[PWA] Orientation lock failed:', error);
      }
    }
    return false;
  }

  // Get device info
  static getDeviceInfo() {
    return {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      languages: navigator.languages,
      cookieEnabled: navigator.cookieEnabled,
      onLine: navigator.onLine,
      hardwareConcurrency: navigator.hardwareConcurrency,
      deviceMemory: (navigator as any).deviceMemory,
      connection: (navigator as any).connection,
      screen: {
        width: screen.width,
        height: screen.height,
        availWidth: screen.availWidth,
        availHeight: screen.availHeight,
        colorDepth: screen.colorDepth,
        pixelDepth: screen.pixelDepth
      },
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      }
    };
  }

  // Check if app needs update
  static async checkForUpdates(): Promise<boolean> {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.getRegistration();
        
        if (registration) {
          await registration.update();
          return !!registration.waiting;
        }
      } catch (error) {
        console.error('[PWA] Update check failed:', error);
      }
    }
    return false;
  }

  // Apply pending update
  static applyUpdate(): void {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistration().then(registration => {
        if (registration?.waiting) {
          registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        }
      });
    }
  }
}

export default { register, unregister, PWAUtils };

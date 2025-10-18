// PWA Installation Service
import logger from '../utils/logger';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

interface PWAInstallState {
  canInstall: boolean;
  isInstalled: boolean;
  isStandalone: boolean;
  installPromptEvent: BeforeInstallPromptEvent | null;
  platform: 'ios' | 'android' | 'desktop' | 'unknown';
  installMethod: 'prompt' | 'manual' | 'none';
}

class PWAInstallerService {
  private state: PWAInstallState = {
    canInstall: false,
    isInstalled: false,
    isStandalone: false,
    installPromptEvent: null,
    platform: 'unknown',
    installMethod: 'none'
  };

  private listeners: Array<(state: PWAInstallState) => void> = [];

  constructor() {
    this.initializeInstaller();
  }

  // Initialize PWA installer
  private initializeInstaller() {
    this.detectPlatform();
    this.detectInstallationState();
    this.setupEventListeners();
    this.checkInstallability();
  }

  // Detect user's platform
  private detectPlatform() {
    const userAgent = navigator.userAgent.toLowerCase();
    
    if (/iphone|ipad|ipod/.test(userAgent)) {
      this.state.platform = 'ios';
    } else if (/android/.test(userAgent)) {
      this.state.platform = 'android';
    } else {
      this.state.platform = 'desktop';
    }
  }

  // Detect if app is already installed or running standalone
  private detectInstallationState() {
    // Check if running in standalone mode
    this.state.isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                              (window.navigator as any).standalone === true;

    // Check if app is installed (heuristic)
    this.state.isInstalled = this.state.isStandalone ||
                             document.referrer.includes('android-app://') ||
                             window.location.search.includes('utm_source=pwa');

    logger.log('[PWA] Installation state:', {
      isStandalone: this.state.isStandalone,
      isInstalled: this.state.isInstalled,
      platform: this.state.platform
    });
  }

  // Setup event listeners
  private setupEventListeners() {
    // Listen for beforeinstallprompt event
    window.addEventListener('beforeinstallprompt', (e) => {
      logger.log('[PWA] Before install prompt triggered');
      e.preventDefault(); // Prevent automatic prompt
      
      this.state.installPromptEvent = e as BeforeInstallPromptEvent;
      this.state.canInstall = true;
      this.state.installMethod = 'prompt';
      
      this.notifyListeners();
    });

    // Listen for app installed event
    window.addEventListener('appinstalled', () => {
      logger.log('[PWA] App installed successfully');
      
      this.state.isInstalled = true;
      this.state.canInstall = false;
      this.state.installPromptEvent = null;
      
      this.trackInstallation('automatic');
      this.notifyListeners();
    });

    // Listen for display mode changes
    window.matchMedia('(display-mode: standalone)').addEventListener('change', (e) => {
      this.state.isStandalone = e.matches;
      this.notifyListeners();
    });
  }

  // Check installability criteria
  private checkInstallability() {
    // For iOS, check if it's Safari and not already installed
    if (this.state.platform === 'ios') {
      const isIOSSafari = /safari/.test(navigator.userAgent.toLowerCase()) &&
                         !/chrome|crios|fxios/.test(navigator.userAgent.toLowerCase());
      
      if (isIOSSafari && !this.state.isInstalled) {
        this.state.canInstall = true;
        this.state.installMethod = 'manual';
        this.notifyListeners();
      }
    }

    // Check service worker registration
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistration().then(registration => {
        if (registration) {
          logger.log('[PWA] Service worker registered, app is installable');
        }
      });
    }
  }

  // Trigger installation prompt
  async triggerInstall(): Promise<boolean> {
    if (!this.state.canInstall) {
      logger.warn('[PWA] Cannot install: not installable');
      return false;
    }

    if (this.state.installMethod === 'prompt' && this.state.installPromptEvent) {
      try {
        // Show the install prompt
        await this.state.installPromptEvent.prompt();
        
        // Wait for user choice
        const choiceResult = await this.state.installPromptEvent.userChoice;
        
        logger.log('[PWA] User choice:', choiceResult.outcome);
        
        if (choiceResult.outcome === 'accepted') {
          this.trackInstallation('prompt-accepted');
          return true;
        } else {
          this.trackInstallation('prompt-dismissed');
          return false;
        }
      } catch (error) {
        console.error('[PWA] Install prompt failed:', error);
        return false;
      } finally {
        // Clear the prompt event
        this.state.installPromptEvent = null;
        this.state.canInstall = false;
        this.notifyListeners();
      }
    } else if (this.state.installMethod === 'manual') {
      // Show manual installation instructions
      this.showManualInstallInstructions();
      this.trackInstallation('manual-instructions-shown');
      return true;
    }

    return false;
  }

  // Show manual installation instructions
  private showManualInstallInstructions() {
    const instructions = this.getManualInstallInstructions();
    
    // Dispatch custom event with instructions
    window.dispatchEvent(new CustomEvent('pwa-manual-install', {
      detail: { instructions, platform: this.state.platform }
    }));
  }

  // Get platform-specific installation instructions
  private getManualInstallInstructions(): string[] {
    switch (this.state.platform) {
      case 'ios':
        return [
          'Tap the Share button at the bottom of the screen',
          'Scroll down and tap "Add to Home Screen"',
          'Tap "Add" to install ECTRACC on your home screen'
        ];
      
      case 'android':
        return [
          'Tap the menu button (⋮) in your browser',
          'Select "Add to Home screen" or "Install app"',
          'Tap "Add" to install ECTRACC'
        ];
      
      case 'desktop':
        return [
          'Click the install icon in your browser\'s address bar',
          'Or go to browser menu and select "Install ECTRACC"',
          'Follow the prompts to complete installation'
        ];
      
      default:
        return [
          'Look for an "Install" or "Add to Home Screen" option in your browser',
          'Follow your browser\'s installation prompts'
        ];
    }
  }

  // Check if installation is recommended
  shouldRecommendInstall(): boolean {
    // Don't recommend if already installed
    if (this.state.isInstalled) {
      return false;
    }

    // Check usage patterns (simplified)
    const visitCount = parseInt(localStorage.getItem('ectracc-visit-count') || '0');
    const lastVisit = parseInt(localStorage.getItem('ectracc-last-visit') || '0');
    const now = Date.now();
    
    // Increment visit count
    localStorage.setItem('ectracc-visit-count', (visitCount + 1).toString());
    localStorage.setItem('ectracc-last-visit', now.toString());
    
    // Recommend after 3 visits or if user is returning after a week
    const weekInMs = 7 * 24 * 60 * 60 * 1000;
    const isReturningUser = now - lastVisit > weekInMs && visitCount > 0;
    
    return visitCount >= 3 || isReturningUser;
  }

  // Track installation events
  private trackInstallation(method: string) {
    // Track with analytics
    if ((window as any).mixpanel) {
      (window as any).mixpanel.track('PWA Installation', {
        method,
        platform: this.state.platform,
        user_agent: navigator.userAgent
      });
    }

    // Store installation info
    localStorage.setItem('ectracc-installed', 'true');
    localStorage.setItem('ectracc-install-date', Date.now().toString());
    localStorage.setItem('ectracc-install-method', method);
  }

  // Get installation analytics
  getInstallationAnalytics() {
    return {
      isInstalled: localStorage.getItem('ectracc-installed') === 'true',
      installDate: localStorage.getItem('ectracc-install-date'),
      installMethod: localStorage.getItem('ectracc-install-method'),
      visitCount: parseInt(localStorage.getItem('ectracc-visit-count') || '0'),
      lastVisit: localStorage.getItem('ectracc-last-visit')
    };
  }

  // Subscribe to state changes
  subscribe(listener: (state: PWAInstallState) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  // Get current state
  getState(): PWAInstallState {
    return { ...this.state };
  }

  // Notify listeners
  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.getState()));
  }

  // Check for updates
  async checkForUpdates(): Promise<boolean> {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.getRegistration();
        
        if (registration) {
          await registration.update();
          
          if (registration.waiting) {
            logger.log('[PWA] Update available');
            
            // Dispatch update available event
            window.dispatchEvent(new CustomEvent('pwa-update-available', {
              detail: { registration }
            }));
            
            return true;
          }
        }
      } catch (error) {
        console.error('[PWA] Update check failed:', error);
      }
    }
    
    return false;
  }

  // Apply pending update
  applyUpdate(): void {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistration().then(registration => {
        if (registration?.waiting) {
          registration.waiting.postMessage({ type: 'SKIP_WAITING' });
          
          // Reload page after update
          window.addEventListener('controllerchange', () => {
            window.location.reload();
          });
        }
      });
    }
  }

  // Get PWA capabilities
  getCapabilities() {
    return {
      serviceWorker: 'serviceWorker' in navigator,
      pushNotifications: 'PushManager' in window,
      backgroundSync: 'serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype,
      webShare: 'share' in navigator,
      fullscreen: 'requestFullscreen' in document.documentElement,
      deviceMotion: 'DeviceMotionEvent' in window,
      geolocation: 'geolocation' in navigator,
      camera: 'mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices,
      storage: 'storage' in navigator && 'estimate' in navigator.storage
    };
  }

  // Estimate storage usage
  async getStorageEstimate() {
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
}

// Create singleton instance
const pwaInstaller = new PWAInstallerService();

export default pwaInstaller;

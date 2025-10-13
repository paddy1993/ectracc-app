import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface AccessibilitySettings {
  // Visual preferences
  highContrast: boolean;
  reducedMotion: boolean;
  largeText: boolean;
  
  // Interaction preferences
  keyboardNavigation: boolean;
  screenReader: boolean;
  
  // Focus management
  focusVisible: boolean;
  skipLinks: boolean;
}

interface AccessibilityContextType {
  settings: AccessibilitySettings;
  updateSetting: (key: keyof AccessibilitySettings, value: boolean) => void;
  resetSettings: () => void;
  
  // Utility functions
  announceToScreenReader: (message: string, priority?: 'polite' | 'assertive') => void;
  setFocusTo: (elementId: string) => void;
  
  // Detection utilities
  isHighContrastMode: boolean;
  prefersReducedMotion: boolean;
  isKeyboardUser: boolean;
}

const defaultSettings: AccessibilitySettings = {
  highContrast: false,
  reducedMotion: false,
  largeText: false,
  keyboardNavigation: false,
  screenReader: false,
  focusVisible: true,
  skipLinks: true
};

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

interface AccessibilityProviderProps {
  children: ReactNode;
}

export function AccessibilityProvider({ children }: AccessibilityProviderProps) {
  const [settings, setSettings] = useState<AccessibilitySettings>(() => {
    // Load settings from localStorage
    const saved = localStorage.getItem('ectracc-accessibility-settings');
    return saved ? { ...defaultSettings, ...JSON.parse(saved) } : defaultSettings;
  });

  // System preference detection
  const [isHighContrastMode, setIsHighContrastMode] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [isKeyboardUser, setIsKeyboardUser] = useState(false);

  // Screen reader announcement element
  const [announcer, setAnnouncer] = useState<HTMLElement | null>(null);

  useEffect(() => {
    // Create screen reader announcer
    const announcerElement = document.createElement('div');
    announcerElement.setAttribute('aria-live', 'polite');
    announcerElement.setAttribute('aria-atomic', 'true');
    announcerElement.style.position = 'absolute';
    announcerElement.style.left = '-10000px';
    announcerElement.style.width = '1px';
    announcerElement.style.height = '1px';
    announcerElement.style.overflow = 'hidden';
    document.body.appendChild(announcerElement);
    setAnnouncer(announcerElement);

    return () => {
      if (announcerElement.parentNode) {
        announcerElement.parentNode.removeChild(announcerElement);
      }
    };
  }, []);

  useEffect(() => {
    // Detect system preferences
    const highContrastQuery = window.matchMedia('(prefers-contrast: high)');
    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    const updateHighContrast = (e: MediaQueryListEvent | MediaQueryList) => {
      setIsHighContrastMode(e.matches);
      if (e.matches) {
        updateSetting('highContrast', true);
      }
    };

    const updateReducedMotion = (e: MediaQueryListEvent | MediaQueryList) => {
      setPrefersReducedMotion(e.matches);
      if (e.matches) {
        updateSetting('reducedMotion', true);
      }
    };

    // Initial detection
    updateHighContrast(highContrastQuery);
    updateReducedMotion(reducedMotionQuery);

    // Listen for changes
    highContrastQuery.addEventListener('change', updateHighContrast);
    reducedMotionQuery.addEventListener('change', updateReducedMotion);

    return () => {
      highContrastQuery.removeEventListener('change', updateHighContrast);
      reducedMotionQuery.removeEventListener('change', updateReducedMotion);
    };
  }, []);

  useEffect(() => {
    // Detect keyboard usage
    let keyboardTimeout: NodeJS.Timeout;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        setIsKeyboardUser(true);
        updateSetting('keyboardNavigation', true);
        
        // Clear timeout if user continues using keyboard
        if (keyboardTimeout) {
          clearTimeout(keyboardTimeout);
        }
        
        // Reset keyboard user status after 5 seconds of no keyboard activity
        keyboardTimeout = setTimeout(() => {
          setIsKeyboardUser(false);
        }, 5000);
      }
    };

    const handleMouseDown = () => {
      setIsKeyboardUser(false);
      if (keyboardTimeout) {
        clearTimeout(keyboardTimeout);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleMouseDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleMouseDown);
      if (keyboardTimeout) {
        clearTimeout(keyboardTimeout);
      }
    };
  }, []);

  useEffect(() => {
    // Save settings to localStorage
    localStorage.setItem('ectracc-accessibility-settings', JSON.stringify(settings));
    
    // Apply settings to document
    document.documentElement.classList.toggle('high-contrast', settings.highContrast || isHighContrastMode);
    document.documentElement.classList.toggle('reduced-motion', settings.reducedMotion || prefersReducedMotion);
    document.documentElement.classList.toggle('large-text', settings.largeText);
    document.documentElement.classList.toggle('keyboard-navigation', settings.keyboardNavigation || isKeyboardUser);
  }, [settings, isHighContrastMode, prefersReducedMotion, isKeyboardUser]);

  const updateSetting = (key: keyof AccessibilitySettings, value: boolean) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const resetSettings = () => {
    setSettings(defaultSettings);
    localStorage.removeItem('ectracc-accessibility-settings');
  };

  const announceToScreenReader = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
    if (!announcer) return;
    
    // Set the priority
    announcer.setAttribute('aria-live', priority);
    
    // Clear and set the message
    announcer.textContent = '';
    setTimeout(() => {
      announcer.textContent = message;
    }, 100);
    
    // Clear the message after it's been announced
    setTimeout(() => {
      announcer.textContent = '';
      announcer.setAttribute('aria-live', 'polite'); // Reset to polite
    }, 1000);
  };

  const setFocusTo = (elementId: string) => {
    setTimeout(() => {
      const element = document.getElementById(elementId);
      if (element) {
        element.focus();
        
        // Announce focus change to screen readers
        const elementText = element.textContent || element.getAttribute('aria-label') || 'Element';
        announceToScreenReader(`Focused on ${elementText}`);
      }
    }, 100);
  };

  const value: AccessibilityContextType = {
    settings,
    updateSetting,
    resetSettings,
    announceToScreenReader,
    setFocusTo,
    isHighContrastMode,
    prefersReducedMotion,
    isKeyboardUser
  };

  return (
    <AccessibilityContext.Provider value={value}>
      {children}
    </AccessibilityContext.Provider>
  );
}

export function useAccessibility() {
  const context = useContext(AccessibilityContext);
  if (context === undefined) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
}

// Hook for keyboard navigation
export function useKeyboardNavigation() {
  const { isKeyboardUser, settings } = useAccessibility();
  
  return {
    isKeyboardUser: isKeyboardUser || settings.keyboardNavigation,
    handleKeyDown: (callback: () => void) => (event: React.KeyboardEvent) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        callback();
      }
    }
  };
}

// Hook for screen reader announcements
export function useScreenReader() {
  const { announceToScreenReader, settings } = useAccessibility();
  
  return {
    announce: announceToScreenReader,
    isScreenReaderUser: settings.screenReader
  };
}

// Hook for focus management
export function useFocusManagement() {
  const { setFocusTo, settings } = useAccessibility();
  
  return {
    setFocus: setFocusTo,
    focusVisible: settings.focusVisible
  };
}

export default AccessibilityContext;

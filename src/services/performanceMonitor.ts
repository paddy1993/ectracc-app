// Performance Monitoring Service for ECTRACC
import logger from '../utils/logger';

interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  url?: string;
  userAgent?: string;
}

interface WebVitalsMetric {
  name: 'CLS' | 'FID' | 'FCP' | 'LCP' | 'TTFB';
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
  id: string;
  timestamp: number;
}

interface ResourceTiming {
  name: string;
  duration: number;
  size: number;
  type: string;
  timestamp: number;
}

interface NavigationTiming {
  domContentLoaded: number;
  loadComplete: number;
  firstPaint: number;
  firstContentfulPaint: number;
  timeToInteractive: number;
  timestamp: number;
}

class PerformanceMonitorService {
  private metrics: PerformanceMetric[] = [];
  private webVitals: WebVitalsMetric[] = [];
  private resourceTimings: ResourceTiming[] = [];
  private navigationTiming: NavigationTiming | null = null;
  private observers: PerformanceObserver[] = [];
  private isMonitoring = false;

  constructor() {
    this.initializeMonitoring();
  }

  // Initialize performance monitoring
  private initializeMonitoring() {
    if (typeof window === 'undefined' || this.isMonitoring) {
      return;
    }

    this.isMonitoring = true;

    // Monitor Web Vitals
    this.initializeWebVitals();

    // Monitor resource loading
    this.initializeResourceMonitoring();

    // Monitor navigation timing
    this.initializeNavigationMonitoring();

    // Monitor long tasks
    this.initializeLongTaskMonitoring();

    // Monitor memory usage
    this.initializeMemoryMonitoring();

    // Send metrics periodically
    this.startPeriodicReporting();

    logger.log('[Performance] Monitoring initialized');
  }

  // Initialize Web Vitals monitoring
  private initializeWebVitals() {
    // We'll use a simplified version since web-vitals library isn't installed
    this.measureCLS();
    this.measureFCP();
    this.measureLCP();
    this.measureFID();
    this.measureTTFB();
  }

  // Cumulative Layout Shift
  private measureCLS() {
    if (!('LayoutShiftAttribution' in window)) return;

    let clsValue = 0;
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!(entry as any).hadRecentInput) {
          clsValue += (entry as any).value;
        }
      }

      this.recordWebVital('CLS', clsValue);
    });

    observer.observe({ type: 'layout-shift', buffered: true });
    this.observers.push(observer);
  }

  // First Contentful Paint
  private measureFCP() {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.name === 'first-contentful-paint') {
          this.recordWebVital('FCP', entry.startTime);
          observer.disconnect();
          break;
        }
      }
    });

    observer.observe({ type: 'paint', buffered: true });
    this.observers.push(observer);
  }

  // Largest Contentful Paint
  private measureLCP() {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      this.recordWebVital('LCP', lastEntry.startTime);
    });

    observer.observe({ type: 'largest-contentful-paint', buffered: true });
    this.observers.push(observer);
  }

  // First Input Delay
  private measureFID() {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        this.recordWebVital('FID', (entry as any).processingStart - entry.startTime);
        observer.disconnect();
        break;
      }
    });

    observer.observe({ type: 'first-input', buffered: true });
    this.observers.push(observer);
  }

  // Time to First Byte
  private measureTTFB() {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'navigation') {
          const navEntry = entry as PerformanceNavigationTiming;
          this.recordWebVital('TTFB', navEntry.responseStart - navEntry.requestStart);
          observer.disconnect();
          break;
        }
      }
    });

    observer.observe({ type: 'navigation', buffered: true });
    this.observers.push(observer);
  }

  // Record Web Vital metric
  private recordWebVital(name: WebVitalsMetric['name'], value: number) {
    const rating = this.getWebVitalRating(name, value);
    
    const metric: WebVitalsMetric = {
      name,
      value,
      rating,
      delta: value,
      id: this.generateId(),
      timestamp: Date.now()
    };

    this.webVitals.push(metric);
    this.recordMetric(`web-vital-${name.toLowerCase()}`, value);

    logger.log(`[Performance] ${name}: ${value.toFixed(2)}ms (${rating})`);
  }

  // Get Web Vital rating
  private getWebVitalRating(name: string, value: number): 'good' | 'needs-improvement' | 'poor' {
    const thresholds = {
      CLS: { good: 0.1, poor: 0.25 },
      FID: { good: 100, poor: 300 },
      FCP: { good: 1800, poor: 3000 },
      LCP: { good: 2500, poor: 4000 },
      TTFB: { good: 800, poor: 1800 }
    };

    const threshold = thresholds[name as keyof typeof thresholds];
    if (!threshold) return 'good';

    if (value <= threshold.good) return 'good';
    if (value <= threshold.poor) return 'needs-improvement';
    return 'poor';
  }

  // Initialize resource monitoring
  private initializeResourceMonitoring() {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'resource') {
          const resourceEntry = entry as PerformanceResourceTiming;
          
          this.resourceTimings.push({
            name: resourceEntry.name,
            duration: resourceEntry.duration,
            size: resourceEntry.transferSize || 0,
            type: this.getResourceType(resourceEntry.name),
            timestamp: Date.now()
          });

          // Record slow resources
          if (resourceEntry.duration > 1000) {
            this.recordMetric('slow-resource', resourceEntry.duration, resourceEntry.name);
          }
        }
      }
    });

    observer.observe({ type: 'resource', buffered: true });
    this.observers.push(observer);
  }

  // Initialize navigation monitoring
  private initializeNavigationMonitoring() {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'navigation') {
          const navEntry = entry as PerformanceNavigationTiming;
          
          this.navigationTiming = {
            domContentLoaded: navEntry.domContentLoadedEventEnd - navEntry.domContentLoadedEventStart,
            loadComplete: navEntry.loadEventEnd - navEntry.loadEventStart,
            firstPaint: 0, // Will be set by paint observer
            firstContentfulPaint: 0, // Will be set by paint observer
            timeToInteractive: this.calculateTTI(navEntry),
            timestamp: Date.now()
          };

          this.recordMetric('dom-content-loaded', this.navigationTiming.domContentLoaded);
          this.recordMetric('load-complete', this.navigationTiming.loadComplete);
        }
      }
    });

    observer.observe({ type: 'navigation', buffered: true });
    this.observers.push(observer);
  }

  // Initialize long task monitoring
  private initializeLongTaskMonitoring() {
    if (!('PerformanceLongTaskTiming' in window)) return;

    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        this.recordMetric('long-task', entry.duration);
        logger.warn(`[Performance] Long task detected: ${entry.duration.toFixed(2)}ms`);
      }
    });

    observer.observe({ type: 'longtask', buffered: true });
    this.observers.push(observer);
  }

  // Initialize memory monitoring
  private initializeMemoryMonitoring() {
    if (!('memory' in performance)) return;

    setInterval(() => {
      const memory = (performance as any).memory;
      
      this.recordMetric('memory-used', memory.usedJSHeapSize);
      this.recordMetric('memory-total', memory.totalJSHeapSize);
      this.recordMetric('memory-limit', memory.jsHeapSizeLimit);

      // Warn about high memory usage
      const usagePercent = (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100;
      if (usagePercent > 80) {
        logger.warn(`[Performance] High memory usage: ${usagePercent.toFixed(1)}%`);
      }
    }, 30000); // Check every 30 seconds
  }

  // Calculate Time to Interactive (simplified)
  private calculateTTI(navEntry: PerformanceNavigationTiming): number {
    // Simplified TTI calculation
    return navEntry.domInteractive - navEntry.fetchStart;
  }

  // Get resource type from URL
  private getResourceType(url: string): string {
    if (url.includes('.js')) return 'script';
    if (url.includes('.css')) return 'stylesheet';
    if (url.match(/\.(png|jpg|jpeg|gif|svg|webp)$/)) return 'image';
    if (url.includes('/api/')) return 'api';
    return 'other';
  }

  // Record custom metric
  recordMetric(name: string, value: number, url?: string) {
    const metric: PerformanceMetric = {
      name,
      value,
      timestamp: Date.now(),
      url,
      userAgent: navigator.userAgent
    };

    this.metrics.push(metric);

    // Keep only recent metrics to prevent memory leaks
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-500);
    }
  }

  // Mark performance milestone
  markMilestone(name: string) {
    if ('performance' in window && 'mark' in performance) {
      performance.mark(name);
      this.recordMetric(`milestone-${name}`, performance.now());
    }
  }

  // Measure time between milestones
  measureBetween(startMark: string, endMark: string, measureName: string) {
    if ('performance' in window && 'measure' in performance) {
      try {
        performance.measure(measureName, startMark, endMark);
        const measure = performance.getEntriesByName(measureName)[0];
        this.recordMetric(measureName, measure.duration);
        return measure.duration;
      } catch (error) {
        console.error('[Performance] Failed to measure:', error);
      }
    }
    return 0;
  }

  // Get performance summary
  getPerformanceSummary() {
    const summary = {
      webVitals: this.webVitals.reduce((acc, vital) => {
        acc[vital.name] = {
          value: vital.value,
          rating: vital.rating
        };
        return acc;
      }, {} as Record<string, any>),
      
      resourceCount: this.resourceTimings.length,
      slowResources: this.resourceTimings.filter(r => r.duration > 1000).length,
      
      totalResourceSize: this.resourceTimings.reduce((sum, r) => sum + r.size, 0),
      
      navigationTiming: this.navigationTiming,
      
      recentMetrics: this.metrics.slice(-10)
    };

    return summary;
  }

  // Start periodic reporting
  private startPeriodicReporting() {
    setInterval(() => {
      this.reportMetrics();
    }, 60000); // Report every minute
  }

  // Report metrics to analytics
  private reportMetrics() {
    if (this.metrics.length === 0) return;

    const summary = this.getPerformanceSummary();
    
    // Send to analytics service
    if ((window as any).mixpanel) {
      (window as any).mixpanel.track('Performance Metrics', {
        web_vitals: summary.webVitals,
        resource_count: summary.resourceCount,
        slow_resources: summary.slowResources,
        total_resource_size: summary.totalResourceSize,
        navigation_timing: summary.navigationTiming
      });
    }

    logger.log('[Performance] Metrics reported:', summary);
  }

  // Monitor React component performance
  monitorComponent(componentName: string, renderTime: number) {
    this.recordMetric(`component-render-${componentName}`, renderTime);
    
    if (renderTime > 16) { // Longer than one frame
      logger.warn(`[Performance] Slow component render: ${componentName} (${renderTime.toFixed(2)}ms)`);
    }
  }

  // Monitor API call performance
  monitorApiCall(endpoint: string, duration: number, success: boolean) {
    this.recordMetric(`api-call-${endpoint}`, duration);
    
    if (!success) {
      this.recordMetric(`api-error-${endpoint}`, 1);
    }
    
    if (duration > 5000) {
      logger.warn(`[Performance] Slow API call: ${endpoint} (${duration.toFixed(2)}ms)`);
    }
  }

  // Monitor user interactions
  monitorInteraction(type: string, duration: number) {
    this.recordMetric(`interaction-${type}`, duration);
    
    if (duration > 100) {
      logger.warn(`[Performance] Slow interaction: ${type} (${duration.toFixed(2)}ms)`);
    }
  }

  // Generate unique ID
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Cleanup observers
  cleanup() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
    this.isMonitoring = false;
  }
}

// Create singleton instance
const performanceMonitor = new PerformanceMonitorService();

export default performanceMonitor;

// React import for the hook
import React from 'react';

// Export React hook for component monitoring
export const usePerformanceMonitor = () => {
  const startTime = React.useRef<number>(0);
  
  React.useEffect(() => {
    startTime.current = performance.now();
    
    return () => {
      if (startTime.current) {
        const renderTime = performance.now() - startTime.current;
        performanceMonitor.monitorComponent('Unknown', renderTime);
      }
    };
  });

  return {
    markStart: (name: string) => {
      performanceMonitor.markMilestone(`${name}-start`);
    },
    markEnd: (name: string) => {
      performanceMonitor.markMilestone(`${name}-end`);
      return performanceMonitor.measureBetween(`${name}-start`, `${name}-end`, name);
    },
    recordMetric: performanceMonitor.recordMetric.bind(performanceMonitor)
  };
};

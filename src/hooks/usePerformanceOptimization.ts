import { useState, useEffect, useCallback, useRef } from 'react';
import logger from '../utils/logger';

// Performance cache with TTL
class PerformanceCache {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();
  
  set(key: string, data: any, ttl: number = 5 * 60 * 1000) { // 5 minutes default
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }
  
  get(key: string) {
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return item.data;
  }
  
  clear() {
    this.cache.clear();
  }
  
  delete(key: string) {
    this.cache.delete(key);
  }
}

export const performanceCache = new PerformanceCache();

// Debounce hook
export const useDebounce = <T>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

// Optimized API call hook with caching and deduplication
export const useOptimizedApiCall = <T>(
  apiCall: () => Promise<T>,
  cacheKey: string,
  dependencies: any[] = [],
  options: {
    ttl?: number;
    immediate?: boolean;
    retryCount?: number;
    retryDelay?: number;
  } = {}
) => {
  const {
    ttl = 5 * 60 * 1000, // 5 minutes
    immediate = true,
    retryCount = 2,
    retryDelay = 1000
  } = options;

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const retryCountRef = useRef(0);

  const executeApiCall = useCallback(async (forceRefresh = false) => {
    // Check cache first
    if (!forceRefresh) {
      const cachedData = performanceCache.get(cacheKey);
      if (cachedData) {
        setData(cachedData);
        return cachedData;
      }
    }

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    setLoading(true);
    setError(null);

    try {
      const result = await apiCall();
      
      // Cache the result
      performanceCache.set(cacheKey, result, ttl);
      setData(result);
      setError(null);
      retryCountRef.current = 0;
      
      return result;
    } catch (err) {
      const error = err as Error;
      
      // Retry logic
      if (retryCountRef.current < retryCount && error.name !== 'AbortError') {
        retryCountRef.current++;
        setTimeout(() => {
          executeApiCall(forceRefresh);
        }, retryDelay * retryCountRef.current);
        return;
      }
      
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [apiCall, cacheKey, ttl, retryCount, retryDelay]);

  useEffect(() => {
    if (immediate) {
      executeApiCall();
    }

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, dependencies);

  const refresh = useCallback(() => executeApiCall(true), [executeApiCall]);
  const clearCache = useCallback(() => performanceCache.delete(cacheKey), [cacheKey]);

  return {
    data,
    loading,
    error,
    refresh,
    clearCache,
    execute: executeApiCall
  };
};

// Intersection Observer hook for lazy loading
export const useIntersectionObserver = (
  options: IntersectionObserverInit = {}
) => {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [hasIntersected, setHasIntersected] = useState(false);
  const elementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const isIntersecting = entry.isIntersecting;
        setIsIntersecting(isIntersecting);
        
        if (isIntersecting && !hasIntersected) {
          setHasIntersected(true);
        }
      },
      {
        threshold: 0.1,
        rootMargin: '50px',
        ...options
      }
    );

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [hasIntersected, options]);

  return {
    elementRef,
    isIntersecting,
    hasIntersected
  };
};

// Prefetch hook for preloading data
export const usePrefetch = () => {
  const prefetchedData = useRef(new Map<string, any>());

  const prefetch = useCallback(async (
    key: string,
    apiCall: () => Promise<any>,
    ttl: number = 5 * 60 * 1000
  ) => {
    try {
      // Check if already prefetched
      if (prefetchedData.current.has(key)) {
        return;
      }

      const data = await apiCall();
      prefetchedData.current.set(key, data);
      performanceCache.set(key, data, ttl);
      
      // Clean up after TTL
      setTimeout(() => {
        prefetchedData.current.delete(key);
      }, ttl);
    } catch (error) {
      logger.warn(`Prefetch failed for ${key}:`, error);
    }
  }, []);

  const getPrefetchedData = useCallback((key: string) => {
    return prefetchedData.current.get(key) || performanceCache.get(key);
  }, []);

  return {
    prefetch,
    getPrefetchedData
  };
};

// Virtual scrolling hook for large lists
export const useVirtualScrolling = <T>(
  items: T[],
  itemHeight: number,
  containerHeight: number,
  overscan: number = 5
) => {
  const [scrollTop, setScrollTop] = useState(0);

  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(
    items.length - 1,
    Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
  );

  const visibleItems = items.slice(startIndex, endIndex + 1);
  const totalHeight = items.length * itemHeight;
  const offsetY = startIndex * itemHeight;

  const handleScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(event.currentTarget.scrollTop);
  }, []);

  return {
    visibleItems,
    totalHeight,
    offsetY,
    startIndex,
    endIndex,
    handleScroll
  };
};

export default {
  useDebounce,
  useOptimizedApiCall,
  useIntersectionObserver,
  usePrefetch,
  useVirtualScrolling,
  performanceCache
};

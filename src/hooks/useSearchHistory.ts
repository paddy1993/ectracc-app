import { useState, useEffect, useCallback } from 'react';
import logger from '../utils/logger';

const STORAGE_KEY = 'ectracc-search-history';
const MAX_HISTORY_ITEMS = 10;

export function useSearchHistory() {
  const [history, setHistory] = useState<string[]>([]);

  // Load history from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setHistory(parsed.slice(0, MAX_HISTORY_ITEMS));
        }
      }
    } catch (error) {
      logger.warn('Failed to load search history:', error);
    }
  }, []);

  // Save history to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    } catch (error) {
      logger.warn('Failed to save search history:', error);
    }
  }, [history]);

  const addToHistory = useCallback((term: string) => {
    const trimmedTerm = term.trim();
    if (!trimmedTerm || trimmedTerm.length < 2) {
      return; // Don't save very short searches
    }

    setHistory(prev => {
      // Remove existing occurrence if it exists
      const filtered = prev.filter(item => item.toLowerCase() !== trimmedTerm.toLowerCase());
      // Add to beginning and limit to MAX_HISTORY_ITEMS
      return [trimmedTerm, ...filtered].slice(0, MAX_HISTORY_ITEMS);
    });
  }, []);

  const removeFromHistory = useCallback((term: string) => {
    setHistory(prev => prev.filter(item => item !== term));
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
  }, []);

  return {
    history,
    addToHistory,
    removeFromHistory,
    clearHistory
  };
}

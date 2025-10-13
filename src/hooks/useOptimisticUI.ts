import { useState, useEffect, useCallback } from 'react';
import optimisticUI, { OptimisticState, OptimisticAction } from '../services/optimisticUI';

// Hook for using optimistic UI in components
export function useOptimisticUI() {
  const [state, setState] = useState<OptimisticState>(optimisticUI.getState());

  useEffect(() => {
    const unsubscribe = optimisticUI.subscribe(setState);
    return unsubscribe;
  }, []);

  const addOptimisticAction = useCallback(
    (type: OptimisticAction['type'], data: any, originalData?: any, maxRetries?: number) => {
      return optimisticUI.addOptimisticAction(type, data, originalData, maxRetries);
    },
    []
  );

  const removeOptimisticAction = useCallback((id: string) => {
    optimisticUI.removeOptimisticAction(id);
  }, []);

  const applyOptimisticUpdates = useCallback(<T>(originalData: T[], type: string): T[] => {
    return optimisticUI.applyOptimisticUpdates(originalData, type);
  }, []);

  const retryFailedActions = useCallback(() => {
    optimisticUI.retryFailedActions();
  }, []);

  const clearAllActions = useCallback(() => {
    optimisticUI.clearAllActions();
  }, []);

  return {
    state,
    addOptimisticAction,
    removeOptimisticAction,
    applyOptimisticUpdates,
    retryFailedActions,
    clearAllActions,
    pendingActions: state.actions.filter(a => a.status === 'pending'),
    failedActions: state.actions.filter(a => a.status === 'failed'),
    isOnline: state.isOnline,
    syncInProgress: state.syncInProgress
  };
}

// Hook for optimistic mutations
export function useOptimisticMutation<TData, TVariables>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options?: {
    onSuccess?: (data: TData, variables: TVariables) => void;
    onError?: (error: Error, variables: TVariables) => void;
    onSettled?: (data: TData | undefined, error: Error | null, variables: TVariables) => void;
  }
) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [data, setData] = useState<TData | undefined>(undefined);
  const { addOptimisticAction, isOnline } = useOptimisticUI();

  const mutate = useCallback(async (variables: TVariables) => {
    setIsLoading(true);
    setError(null);

    try {
      if (isOnline) {
        // Online: execute mutation immediately
        const result = await mutationFn(variables);
        setData(result);
        options?.onSuccess?.(result, variables);
        options?.onSettled?.(result, null, variables);
        return result;
      } else {
        // Offline: add optimistic action
        const actionId = addOptimisticAction('ADD_ENTRY', variables);
        
        // Simulate success for optimistic UI
        const mockResult = variables as unknown as TData;
        setData(mockResult);
        options?.onSuccess?.(mockResult, variables);
        options?.onSettled?.(mockResult, null, variables);
        
        return mockResult;
      }
    } catch (err) {
      const error = err as Error;
      setError(error);
      options?.onError?.(error, variables);
      options?.onSettled?.(undefined, error, variables);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [mutationFn, isOnline, addOptimisticAction, options]);

  const reset = useCallback(() => {
    setIsLoading(false);
    setError(null);
    setData(undefined);
  }, []);

  return {
    mutate,
    reset,
    isLoading,
    error,
    data,
    isSuccess: !!data && !error,
    isError: !!error
  };
}

// Hook for optimistic queries with offline support
export function useOptimisticQuery<TData>(
  queryKey: string,
  queryFn: () => Promise<TData>,
  options?: {
    enabled?: boolean;
    staleTime?: number;
    cacheTime?: number;
    refetchOnWindowFocus?: boolean;
    refetchOnReconnect?: boolean;
  }
) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [data, setData] = useState<TData | undefined>(undefined);
  const [lastFetch, setLastFetch] = useState<number>(0);
  const { applyOptimisticUpdates, isOnline } = useOptimisticUI();

  const fetchData = useCallback(async (force = false) => {
    const now = Date.now();
    const staleTime = options?.staleTime || 5 * 60 * 1000; // 5 minutes default
    
    if (!force && data && (now - lastFetch) < staleTime) {
      return data; // Return cached data if not stale
    }

    setIsLoading(true);
    setError(null);

    try {
      let result = await queryFn();
      
      // Apply optimistic updates if this is a list query
      if (Array.isArray(result)) {
        result = applyOptimisticUpdates(result, queryKey) as any;
      }
      
      setData(result);
      setLastFetch(now);
      return result;
    } catch (err) {
      const error = err as Error;
      setError(error);
      
      // Return cached data if available and offline
      if (!isOnline && data) {
        return data;
      }
      
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [queryFn, data, lastFetch, options?.staleTime, applyOptimisticUpdates, queryKey, isOnline]);

  const refetch = useCallback(() => {
    return fetchData(true);
  }, [fetchData]);

  // Initial fetch
  useEffect(() => {
    if (options?.enabled !== false) {
      fetchData();
    }
  }, [fetchData, options?.enabled]);

  // Refetch on reconnect
  useEffect(() => {
    if (options?.refetchOnReconnect !== false && isOnline) {
      fetchData();
    }
  }, [isOnline, fetchData, options?.refetchOnReconnect]);

  // Refetch on window focus
  useEffect(() => {
    if (options?.refetchOnWindowFocus !== false) {
      const handleFocus = () => fetchData();
      window.addEventListener('focus', handleFocus);
      return () => window.removeEventListener('focus', handleFocus);
    }
  }, [fetchData, options?.refetchOnWindowFocus]);

  return {
    data,
    error,
    isLoading,
    isSuccess: !!data && !error,
    isError: !!error,
    refetch,
    isStale: data && (Date.now() - lastFetch) > (options?.staleTime || 5 * 60 * 1000)
  };
}

export default useOptimisticUI;

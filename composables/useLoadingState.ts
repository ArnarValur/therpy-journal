// composables/useLoadingState.ts
/**
 * Manages loading states throughout the application
 * Can track multiple loading operations simultaneously
 */
export function useLoadingState() {
  // Global loading state
  const isLoading = useState('global-loading', () => false);
  
  // Loading operations registry with counts
  const operations = useState<Record<string, number>>('loading-operations', () => ({}));
  
  // Loading message to display
  const loadingMessage = useState<string>('loading-message', () => '');
  
  // Track if we've already passed the initial load
  // This helps avoid showing loaders on page refresh for logged-in users
  const initialLoadComplete = useState('initial-load-complete', () => false);

  /**
   * Start a loading operation
   * @param key Unique identifier for the operation
   * @param message Optional message to display during loading
   * @param forceShow Whether to show the loading indicator even after initial load
   */
  const startLoading = (key: string, message?: string, forceShow = false) => {
    // Skip showing loaders for app initialization if initial load is complete
    // unless forceShow is true (for operations that should always show a loader)
    if (initialLoadComplete.value && key.startsWith('app-') && !forceShow) {
      operations.value[key] = (operations.value[key] || 0) + 1;
      return;
    }
    
    operations.value[key] = (operations.value[key] || 0) + 1;
    isLoading.value = true;
    
    if (message) {
      loadingMessage.value = message;
    }
  };

  /**
   * End a loading operation
   * @param key Unique identifier for the operation
   */
  const endLoading = (key: string) => {
    if (operations.value[key]) {
      operations.value[key]--;
      
      if (operations.value[key] <= 0) {
        // Create a new object without the key
        const newOperations: Record<string, number> = {};
        Object.keys(operations.value).forEach((k) => {
          if (k !== key) {
            newOperations[k] = operations.value[k];
          }
        });
        operations.value = newOperations;
      }
    }
    
    // If no operations are in progress, set isLoading to false
    if (Object.keys(operations.value).length === 0) {
      isLoading.value = false;
      loadingMessage.value = '';
      
      // If we're completing app initialization, mark initial load as complete
      if (key === 'app-initialization') {
        initialLoadComplete.value = true;
      }
    }
  };

  /**
   * Run a function with loading state
   * @param key Unique identifier for the operation
   * @param fn Function to run
   * @param message Optional message to display during loading
   * @param forceShow Whether to show the loading indicator even after initial load
   */
  const withLoading = async <T>(key: string, fn: () => Promise<T>, message?: string, forceShow = false): Promise<T> => {
    startLoading(key, message, forceShow);
    
    try {
      return await fn();
    } finally {
      endLoading(key);
    }
  };

  return {
    isLoading, 
    loadingMessage,
    initialLoadComplete,
    startLoading,
    endLoading,
    withLoading
  };
} 
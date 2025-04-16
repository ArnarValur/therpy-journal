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

  /**
   * Start a loading operation
   * @param key Unique identifier for the operation
   * @param message Optional message to display during loading
   */
  const startLoading = (key: string, message?: string) => {
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
    }
  };

  /**
   * Run a function with loading state
   * @param key Unique identifier for the operation
   * @param fn Function to run
   * @param message Optional message to display during loading
   */
  const withLoading = async <T>(key: string, fn: () => Promise<T>, message?: string): Promise<T> => {
    startLoading(key, message);
    
    try {
      return await fn();
    } finally {
      endLoading(key);
    }
  };

  return {
    isLoading, 
    loadingMessage,
    startLoading,
    endLoading,
    withLoading
  };
} 
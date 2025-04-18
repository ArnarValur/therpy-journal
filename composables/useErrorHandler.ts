// composables/useErrorHandler.ts
import type { AuthError } from 'firebase/auth';

type ErrorCategory = 'auth' | 'data' | 'network' | 'validation' | 'unknown';

interface AppError {
  message: string;
  code?: string;
  category: ErrorCategory;
  timestamp: Date;
  details?: unknown;
}

/**
 * Provides consistent error handling throughout the application
 */
export function useErrorHandler() {
  // Store the most recent error
  const currentError = useState<AppError | null>('app-error', () => null);
  
  // Track if the error has been shown to the user
  const isErrorShown = useState<boolean>('error-shown', () => false);
  
  // Clear the current error
  const clearError = () => {
    currentError.value = null;
    isErrorShown.value = false;
  };
  
  // Handle Firebase auth errors with user-friendly messages
  const handleAuthError = (error: unknown): AppError => {
    const firebaseError = error as AuthError;
    const code = firebaseError.code || 'unknown';
    
    let message = 'An authentication error occurred. Please try again.';
    
    // Map common Firebase auth error codes to user-friendly messages
    switch (code) {
      case 'auth/user-not-found':
      case 'auth/wrong-password':
        message = 'Invalid email or password';
        break;
      case 'auth/invalid-email':
        message = 'Invalid email format';
        break;
      case 'auth/user-disabled':
        message = 'This account has been disabled';
        break;
      case 'auth/too-many-requests':
        message = 'Too many failed login attempts. Please try again later.';
        break;
      case 'auth/email-already-in-use':
        message = 'This email is already in use';
        break;
      case 'auth/weak-password':
        message = 'Password is too weak';
        break;
      case 'auth/network-request-failed':
        message = 'Network error. Please check your connection and try again.';
        break;
      case 'auth/popup-closed-by-user':
        message = 'Sign in was cancelled';
        break;
      case 'auth/popup-blocked':
        message = 'Sign in popup was blocked by your browser';
        break;
      case 'auth/account-exists-with-different-credential':
        message = 'An account already exists with the same email address but different sign-in credentials';
        break;
      case 'auth/requires-recent-login':
        message = 'This operation requires a more recent login. Please log in again.';
        break;
      case 'auth/user-token-expired':
      case 'auth/session-expired':
        message = 'Your session has expired. Please log in again.';
        break;
    }
    
    const appError: AppError = {
      message,
      code,
      category: 'auth',
      timestamp: new Date(),
      details: error
    };
    
    return appError;
  };
  
  // Handle network errors
  const handleNetworkError = (error: unknown): AppError => {
    let message = 'A network error occurred. Please check your connection and try again.';
    let code = 'network/unknown';
    
    // Try to extract more specific information if available
    if (error instanceof Error) {
      if (error.message.includes('timeout')) {
        message = 'The request timed out. Please try again.';
        code = 'network/timeout';
      } else if (error.message.includes('offline')) {
        message = 'You appear to be offline. Please check your connection.';
        code = 'network/offline';
      }
    }
    
    const appError: AppError = {
      message,
      code,
      category: 'network',
      timestamp: new Date(),
      details: error
    };
    
    return appError;
  };
  
  // General error handler that routes errors to specific handlers
  const handleError = (error: unknown, category?: ErrorCategory): AppError => {
    // If we already know the category, use that
    if (category === 'auth') {
      const authError = handleAuthError(error);
      currentError.value = authError;
      isErrorShown.value = false;
      return authError;
    }
    
    if (category === 'network') {
      const networkError = handleNetworkError(error);
      currentError.value = networkError;
      isErrorShown.value = false;
      return networkError;
    }
    
    // Try to determine the error type if not provided
    if (error && typeof error === 'object' && 'code' in error) {
      const errorCode = String(error.code || '');
      
      if (errorCode.startsWith('auth/')) {
        return handleError(error, 'auth');
      }
    }
    
    // Default error handling
    const defaultError: AppError = {
      message: error instanceof Error ? error.message : 'An unexpected error occurred',
      category: category || 'unknown',
      timestamp: new Date(),
      details: error
    };
    
    currentError.value = defaultError;
    isErrorShown.value = false;
    return defaultError;
  };
  
  // Handle errors with automatic logging
  const logError = (error: unknown, category?: ErrorCategory): AppError => {
    const appError = handleError(error, category);
    
    // Log the error to console
    console.error(`[${appError.category.toUpperCase()}] ${appError.message}`, appError);
    
    // In production, you could also log to a service like Sentry here
    
    return appError;
  };
  
  // Get a user-friendly error message
  const getErrorMessage = (error: unknown): string => {
    if (error === null || error === undefined) {
      return 'Unknown error';
    }
    
    if (typeof error === 'string') {
      return error;
    }
    
    if (error instanceof Error) {
      return error.message;
    }
    
    if (typeof error === 'object') {
      if ('message' in error && typeof error.message === 'string') {
        return error.message;
      }
    }
    
    return 'An unexpected error occurred';
  };
  
  return {
    currentError,
    isErrorShown,
    clearError,
    handleError,
    handleAuthError,
    handleNetworkError,
    logError,
    getErrorMessage
  };
} 
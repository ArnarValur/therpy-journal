import { onAuthStateChanged } from 'firebase/auth';
import { useAuthStore } from '~/stores/auth';

/**
 * Composable for Firebase auth utilities
 * Note: Basic auth state management is now handled by the auth.client.ts plugin
 * This composable is for additional auth utilities and manual state management if needed
 */
export function useFirebaseAuth() {
  const { $firebaseAuth } = useNuxtApp();
  const authStore = useAuthStore();
  
  /**
   * Manually set up an auth state listener
   * @returns Unsubscribe function to stop listening
   */
  const setupAuthListener = () => {
    return onAuthStateChanged($firebaseAuth, (firebaseUser) => {
      if (firebaseUser) {
        // User is logged in, update store
        authStore.user = {
          id: firebaseUser.uid,
          name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
          email: firebaseUser.email || '',
          photoURL: firebaseUser.photoURL || undefined
        };
      } else {
        // User is not logged in
        authStore.user = null;
      }
    });
  };
  
  /**
   * Get the current Firebase auth instance
   */
  const getAuth = () => $firebaseAuth;
  
  /**
   * Get the current user from Firebase (not from the store)
   */
  const getCurrentUser = () => $firebaseAuth.currentUser;
  
  return {
    auth: $firebaseAuth,
    setupAuthListener,
    getAuth,
    getCurrentUser
  };
} 
// plugins/auth.client.ts
import { useAuthStore } from '~/stores/auth';
import { setPersistence, browserLocalPersistence, type Auth } from 'firebase/auth';

/**
 * Auth plugin that initializes Firebase authentication on app startup
 * This plugin is only run on the client-side and depends on the firebase plugin
 */
export default defineNuxtPlugin({
  name: 'auth',
  enforce: 'default', // This runs after 'pre' plugins
  async setup(nuxtApp) {
    // Mark explicitly that we're on client-side for debugging
    console.log('[CLIENT] Auth plugin initializing');
    
    // Wait a brief moment to ensure Firebase plugin is done
    if (!nuxtApp.$firebaseAuth) {
      console.warn('[CLIENT] Firebase Auth not available, waiting...');
      await new Promise<void>(resolve => setTimeout(resolve, 100));
      
      // Check again after waiting
      if (!nuxtApp.$firebaseAuth) {
        console.error('[CLIENT] Firebase Auth still not available after waiting');
        return {
          provide: {
            isAuthenticated: () => false
          }
        };
      }
    }
    
    try {
      // Set persistence to LOCAL to survive browser refreshes
      // This ensures the user stays logged in even after closing the browser
      const auth = nuxtApp.$firebaseAuth as Auth;
      await setPersistence(auth, browserLocalPersistence);
      
      console.log('[CLIENT] Initializing Auth state');
      const authStore = useAuthStore();
      
      // Initialize auth state when app starts
      const user = await authStore.initialize();
      console.log('[CLIENT] Auth initialized, user:', user ? 'Logged in' : 'Not logged in');
      
      // Set up the persistent auth listener
      await authStore.checkAuth();
      console.log('[CLIENT] Auth listener set up');
      
      return {
        provide: {
          isAuthenticated: () => authStore.isLoggedIn
        }
      };
    } catch (error) {
      console.error('[CLIENT] Failed to initialize auth:', error);
      
      // Return a default implementation that assumes user is not authenticated
      return {
        provide: {
          isAuthenticated: () => false
        }
      };
    }
  }
}); 
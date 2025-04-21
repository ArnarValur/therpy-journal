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
    // Wait a brief moment to ensure Firebase plugin is done
    if (!nuxtApp.$firebaseAuth) {
      await new Promise<void>(resolve => setTimeout(resolve, 50));
      
      // Check again after waiting
      if (!nuxtApp.$firebaseAuth) {
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
      
      const authStore = useAuthStore();
      
      // Initialize auth state when app starts
      authStore.initialize();
      
      // Set up the persistent auth listener
      await authStore.checkAuth();
      
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
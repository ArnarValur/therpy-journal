import { watch } from 'vue';
import { useRouter } from '#app';
import { useAuthStore } from '~/stores/auth';
import { useFirebaseAuth } from '~/composables/useFirebaseAuth';

/**
 * Plugin to validate Firebase authentication tokens periodically
 * Will automatically log out users with invalid or expired tokens
 * This plugin only runs on the client side
 */
export default defineNuxtPlugin({
  name: 'token-validator',
  enforce: 'default',
  async setup() {
    const authStore = useAuthStore();
    const { isTokenValid } = useFirebaseAuth();
    const { $routes } = useNuxtApp();
    
    // Token validation interval in milliseconds (15 minutes)
    const VALIDATION_INTERVAL = 900000; // 15 minutes in milliseconds
    
    let validationInterval: NodeJS.Timeout | null = null;
    let isValidating = false; // Flag to prevent concurrent validations
    let failedAttempts = 0; // Counter for failed validation attempts
    
    // Function to validate token
    const validateToken = async () => {
      if (!authStore.isLoggedIn || isValidating) return;
      
      try {
        isValidating = true;
        const isValid = await isTokenValid();
        
        if (!isValid) {
          // Clear the interval before logout
          if (validationInterval) {
            clearInterval(validationInterval);
            validationInterval = null;
          }
          
          // Call the logout function
          await authStore.logout();
          
          // Get router instance
          const router = useRouter();
          
          // Redirect to login page with message
          await router.push({
            path: $routes.AUTH.LOGIN,
            query: { 
              reason: 'session-expired', 
              message: 'Your session has expired. Please log in again.' 
            }
          });
        } else {
          // Reset failed attempts on successful validation
          failedAttempts = 0;
        }
      } catch (error) {
        console.error('[Token Validator] Token validation error:', error);
        failedAttempts++;
        
        // If we've failed multiple times, stop the interval
        if (failedAttempts >= 3) {
          if (validationInterval) {
            clearInterval(validationInterval);
            validationInterval = null;
          }
          
          // Force logout after multiple failures
          await authStore.logout();
          const router = useRouter();
          await router.push({
            path: $routes.AUTH.LOGIN,
            query: { 
              reason: 'validation-error', 
              message: 'Session validation failed. Please log in again.' 
            }
          });
        }
      } finally {
        isValidating = false;
      }
    };
    
    // Start checking tokens when user logs in
    watch(() => authStore.isLoggedIn, (isLoggedIn) => {
      if (isLoggedIn && !validationInterval) {
        // Validate immediately then set up interval
        validateToken();
        validationInterval = setInterval(validateToken, VALIDATION_INTERVAL);
        
      } else if (!isLoggedIn && validationInterval) {
        // Clear interval when user logs out
        clearInterval(validationInterval);
        validationInterval = null;
      }
    }, { immediate: true });
    
    //[Vue warn]: onBeforeUnmount is called when there is no active component instance to be associated with. Lifecycle injection APIs can only be used during execution of setup(). If you are using async setup(), make sure to register lifecycle hooks before the first await statement.
    // Clean up on app unmount
    /*onBeforeUnmount(() => {
      if (validationInterval) {
        clearInterval(validationInterval);
        validationInterval = null;
      }
    });*/
  }
}); 
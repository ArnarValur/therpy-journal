import { useAuthStore } from '~/stores/auth';

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
    const VALIDATION_INTERVAL = 15 * 60 * 1000;
    
    let validationInterval: NodeJS.Timeout | null = null;
    
    // Function to validate token
    const validateToken = async () => {
      if (!authStore.isLoggedIn) return;
      
      const isValid = await isTokenValid();
      
      if (!isValid) {
        console.warn('Authentication token is invalid or expired. Logging out...');
        
        // Clear the interval before logout
        if (validationInterval) {
          clearInterval(validationInterval);
          validationInterval = null;
        }
        
        // Call the logout function
        await authStore.logout();
        
        // Redirect to login page with message
        const router = useRouter();
        await router.push({
          path: $routes.AUTH.LOGIN,
          query: { 
            reason: 'session-expired', 
            message: 'Your session has expired. Please log in again.' 
          }
        });
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
    
    // Clean up on app unmount
    /*onBeforeUnmount(() => {
      if (validationInterval) {
        clearInterval(validationInterval);
        validationInterval = null;
      }
    });*/
  }
}); 
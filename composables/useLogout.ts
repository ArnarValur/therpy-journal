// composables/useLogout.ts
import { ref } from 'vue';
import { useAuthStore } from '~/stores/auth';

/**
 * Composable for handling secure logout functionality
 * Can be used anywhere in the application for logging out
 */
export function useLogout() {
  const authStore = useAuthStore();
  const router = useRouter();
  const { $routes } = useNuxtApp();
  const isLoggingOut = ref(false);
  const error = ref<string | null>(null);
  
  /**
   * Performs the logout operation and redirects to login page
   * @param redirectTo Optional path to redirect after logout (defaults to $routes.AUTH.LOGIN)
   * @param showMessage Whether to show a success message after logout (defaults to true)
   * @returns Promise resolving to success status
   */
  const logout = async (redirectTo = $routes.AUTH.LOGIN, showMessage = true) => {
    if (isLoggingOut.value) return { success: false };
    
    isLoggingOut.value = true;
    error.value = null;
    
    try {
      // Call the auth store's logout method
      await authStore.logout();
      
      // Clear any session cookies if needed
      document.cookie.split(';').forEach(cookie => {
        const [name] = cookie.split('=');
        if (name.trim().startsWith('session-')) {
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;`;
        }
      });
      
      // Redirect to login page or specified route with message if requested
      if (showMessage) {
        await router.push({
          path: redirectTo,
          query: {
            reason: 'logged-out',
            message: 'You have been logged out successfully.'
          }
        });
      } else {
        await router.push(redirectTo);
      }
      
      return { success: true };
    } catch (err) {
      console.error('Logout failed:', err);
      error.value = authStore.error || 'Failed to logout. Please try again.';
      return { success: false, error: error.value };
    } finally {
      isLoggingOut.value = false;
    }
  };
  
  return {
    logout,
    isLoggingOut,
    error
  };
} 
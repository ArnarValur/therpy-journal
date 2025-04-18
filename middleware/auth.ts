// middleware/auth.ts
import { useAuthStore } from '~/stores/auth';

/**
 * Middleware to handle authentication state and redirects
 * @param to - The route to navigate to
 */
export default defineNuxtRouteMiddleware(async (to) => {
  // Skip auth check on server side - we'll handle auth purely on client side
  // This prevents the server from redirecting (which causes a flash of login page)
  if (import.meta.server) {
    console.log('Skipping auth check on server side');
    return;
  }

  const authStore = useAuthStore();
  const { $routes, $getPublicRoutes } = useNuxtApp();
  
  // Public routes that don't require authentication
  const publicRoutes = $getPublicRoutes();
  
  // Check if the route is one of our public routes
  const isPublicRoute = publicRoutes.some(route => 
    to.path === route || to.path.startsWith(`${route}/`)
  );

  // Optimization: Don't wait on public routes if not logged in
  if (isPublicRoute && !authStore.isLoggedIn && !authStore.isLoading) {
    return; // Continue navigation for public routes when not logged in
  }

  // If the auth state is loading, wait for it to complete
  if (authStore.isLoading) {
    console.log('Auth state is loading, waiting...');
    // Wait for auth to finish loading (max 2 seconds)
    const maxWait = 2000;
    const startTime = Date.now();
    
    while (authStore.isLoading && (Date.now() - startTime) < maxWait) {
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    
    // If we're still loading after the max wait time, allow navigation to continue
    // but log a warning. This prevents the user from getting stuck.
    if (authStore.isLoading) {
      console.warn('Auth state is still loading after max wait time. Proceeding with navigation.');
    }
  }

  // After waiting or if already loaded, check the auth state
  
  // Check if user is logged in but email is not verified
  if (authStore.isLoggedIn && !authStore.isEmailVerified && !isPublicRoute && to.path !== $routes.AUTH.VERIFY_EMAIL) {
    console.log('Redirecting unverified user to verification page');
    return navigateTo($routes.AUTH.VERIFY_EMAIL);
  }

  // If user is not logged in and trying to access a protected route
  if (!authStore.isLoggedIn && !isPublicRoute) {
    console.log('Redirecting unauthenticated user to login');
    
    // Store the intended destination to redirect after login
    if (to.fullPath !== $routes.HOME) {
      sessionStorage.setItem('authRedirect', to.fullPath);
    }
    
    return navigateTo({
      path: $routes.AUTH.LOGIN,
      query: { 
        redirect: 'auth_required',
        message: 'Please log in to access this page'
      }
    });
  }

  // If user is logged in and trying to access auth pages
  if (authStore.isLoggedIn && authStore.isEmailVerified && 
    (to.path === $routes.AUTH.LOGIN || to.path === $routes.AUTH.REGISTER || to.path === $routes.AUTH.VERIFY_EMAIL)) {
    console.log('Redirecting authenticated user to dashboard');
    return navigateTo($routes.HOME);
  }
  
  // Check if there's a stored redirect path after successful authentication
  if (authStore.isLoggedIn && authStore.isEmailVerified && to.path === $routes.HOME && import.meta.client) {
    const redirectPath = sessionStorage.getItem('authRedirect');
    if (redirectPath) {
      sessionStorage.removeItem('authRedirect');
      return navigateTo(redirectPath);
    }
  }
}); 
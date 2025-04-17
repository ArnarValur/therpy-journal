import { useAuthStore } from '~/stores/auth';

/**
 * Middleware to handle authentication state and redirects
 * @param to - The route to navigate to
 */
export default defineNuxtRouteMiddleware(async (to) => {
  // Skip auth check on server side - we'll handle auth purely on client side
  // This prevents the server from redirecting (which causes a flash of login page)
  /*if (import.meta.server) {
    console.log('Skipping auth check on server side');
    return;
  }*/

  const authStore = useAuthStore();
  
  // Public routes that don't require authentication
  const publicRoutes = [
    '/login', 
    '/register', 
    '/forgot-password', 
    '/reset-password',
    '/auth/callback'
  ];
  
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
  
  // If user is not logged in and trying to access a protected route
  if (!authStore.isLoggedIn && !isPublicRoute) {
    
    // Store the intended destination to redirect after login
    if (to.fullPath !== '/') {
      sessionStorage.setItem('authRedirect', to.fullPath);
    }
    
    return navigateTo({
      path: '/login',
      query: { 
        redirect: 'auth_required'
      }
    });
  }

  // If user is logged in and trying to access auth pages
  if (authStore.isLoggedIn && (to.path === '/login' || to.path === '/register')) {
    console.log('Redirecting authenticated user to dashboard');
    return navigateTo('/');
  }
  
  // Check if there's a stored redirect path after successful authentication
  if (authStore.isLoggedIn && to.path === '/' && import.meta.client) {
    const redirectPath = sessionStorage.getItem('authRedirect');
    if (redirectPath) {
      sessionStorage.removeItem('authRedirect');
      return navigateTo(redirectPath);
    }
  }
}); 
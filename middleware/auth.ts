import { useAuthStore } from '~/stores/auth';

export default defineNuxtRouteMiddleware(async (to) => {
  // Skip auth check on server side - we'll handle auth purely on client side
  // This prevents the server from redirecting (which causes a flash of login page)
  if (import.meta.server) {
    console.log('Skipping auth check on server side');
    return;
  }

  const authStore = useAuthStore();
  // Public routes that don't require authentication
  const publicRoutes = ['/login', '/register', '/forgot-password', '/reset-password'];
  const isPublicRoute = publicRoutes.includes(to.path);

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
  }

  // After waiting or if already loaded, check the auth state
  
  // If user is not logged in and trying to access a protected route
  if (!authStore.isLoggedIn && !isPublicRoute) {
    console.log('Redirecting unauthenticated user to login');
    return navigateTo('/login');
  }

  // If user is logged in and trying to access auth pages
  if (authStore.isLoggedIn && (to.path === '/login' || to.path === '/register')) {
    console.log('Redirecting authenticated user to dashboard');
    return navigateTo('/');
  }
}); 
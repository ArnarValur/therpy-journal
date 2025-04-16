export default defineNuxtRouteMiddleware((to) => {
  // This will be replaced with actual Firebase Auth check
  const isLoggedIn = false; // Just for testing, will be implemented with Firebase

  // If user is not logged in and trying to access a protected route
  if (!isLoggedIn && to.path !== '/login' && to.path !== '/register') {
    return navigateTo('/login');
  }

  // If user is logged in and trying to access auth pages
  if (isLoggedIn && (to.path === '/login' || to.path === '/register')) {
    return navigateTo('/');
  }
}); 
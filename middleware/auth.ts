import { useAuthStore } from '~/stores/auth';

export default defineNuxtRouteMiddleware((to) => {
  const authStore = useAuthStore();

  // If user is not logged in and trying to access a protected route
  if (!authStore.isLoggedIn && 
      to.path !== '/login' && 
      to.path !== '/register' && 
      to.path !== '/forgot-password' &&
      to.path !== '/reset-password') {
    return navigateTo('/login');
  }

  // If user is logged in and trying to access auth pages
  if (authStore.isLoggedIn && (to.path === '/login' || to.path === '/register')) {
    return navigateTo('/');
  }
}); 
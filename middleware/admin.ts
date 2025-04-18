// middleware/admin.ts
import { useAuthStore } from '~/stores/auth';

export default defineNuxtRouteMiddleware(async () => {
  // Skip auth check on server side
  if (import.meta.server) {
    return;
  }

  const authStore = useAuthStore();
  const adminEmail = 'arnarvalurjonsson@gmail.com';

  // Wait for auth to be initialized
  if (authStore.isLoading) {
    await new Promise(resolve => setTimeout(resolve, 50));
  }

  // Check if user is logged in and has admin email
  if (!authStore.isLoggedIn || authStore.user?.email !== adminEmail) {
    return navigateTo('/');
  }
}); 
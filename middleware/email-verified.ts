import { useAuthStore } from '~/stores/auth';

export default defineNuxtRouteMiddleware(async (to) => {
  // Skip verification check for auth-related routes and verification page
  const publicRoutes = [
    '/auth/login',
    '/auth/register',
    '/auth/reset-password',
    '/auth/verify-email',
    '/auth/verify-email-required'
  ];
  
  if (publicRoutes.includes(to.path)) {
    return;
  }

  const authStore = useAuthStore();
  
  // If user is not logged in, let auth middleware handle it
  if (!authStore.isLoggedIn) {
    return;
  }
  
  // Force a verification status check
  await authStore.checkEmailVerification();
  
  // If email is not verified, redirect to verification required page
  if (!authStore.isEmailVerified) {
    return navigateTo({
      path: '/auth/verify-email-required',
      query: {
        redirect: to.fullPath
      }
    });
  }
}); 
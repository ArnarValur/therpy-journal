// plugins/routes.ts
/**
 * Plugin to provide route constants globally
 * This allows using $routes.AUTH.LOGIN etc. throughout the app
 */

export default defineNuxtPlugin((_nuxtApp) => {
  const routes = {
    AUTH: {
      LOGIN: '/auth/login',
      REGISTER: '/auth/register',
      FORGOT_PASSWORD: '/auth/forgot-password',
      RESET_PASSWORD: '/auth/reset-password',
      VERIFY_EMAIL: '/auth/verify-email-required'
    },
    JOURNAL: {
      HOME: '/journal',
      NEW: '/journal/new',
      EDIT: (id: string) => `/journal/edit/${id}`,
      VIEW: (id: string) => `/journal/${id}`
    },
    LIFE_STORY: {
      HOME: '/life-story',
      NEW: '/life-story/new',
      EDIT: (id: string) => `/life-story/edit/${id}`,
      VIEW: (id: string) => `/life-story/${id}`
    },
    DASHBOARD: '/dashboard',
    LANDING: '/landing',
    HOME: '/'
  };

  // Return public routes for middleware
  const getPublicRoutes = () => [
    routes.AUTH.LOGIN,
    routes.AUTH.REGISTER,
    routes.AUTH.FORGOT_PASSWORD,
    routes.AUTH.RESET_PASSWORD,
    routes.AUTH.VERIFY_EMAIL,
    routes.LANDING,
    routes.HOME // Home route is public as it handles redirections
  ];

  return {
    provide: {
      routes,
      getPublicRoutes
    }
  };
}); 
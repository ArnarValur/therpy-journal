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
    HOME: '/'
  };

  // Return public routes for middleware
  const getPublicRoutes = () => [
    routes.AUTH.LOGIN,
    routes.AUTH.REGISTER,
    routes.AUTH.FORGOT_PASSWORD,
    routes.AUTH.RESET_PASSWORD,
    routes.AUTH.VERIFY_EMAIL
  ];

  return {
    provide: {
      routes,
      getPublicRoutes
    }
  };
}); 
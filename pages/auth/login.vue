<!-- pages/auth/login.vue -->
<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useAuthStore } from '~/stores/auth';
import { useErrorHandler } from '~/composables/useErrorHandler';
import { useLoadingState } from '~/composables/useLoadingState';

// Define page metadata with auth layout
definePageMeta({
  layout: 'auth',
  middleware: ['auth']
});

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();
const { logError } = useErrorHandler();
const { startLoading, endLoading } = useLoadingState();

const email = ref('');
const password = ref('');
const showPassword = ref(false);
const sessionMessage = ref('');

// Check for session expiration or other redirect messages
onMounted(() => {
  if (route.query.reason === 'session-expired') {
    sessionMessage.value = route.query.message as string || 'Your session has expired. Please log in again.';
    
    // Clear the URL query parameters after showing the message
    router.replace({ query: {} });
  } else if (route.query.reason === 'logged-out') {
    sessionMessage.value = route.query.message as string || 'You have been logged out successfully.';
    
    // Clear the URL query parameters after showing the message
    router.replace({ query: {} });
  } else if (route.query.redirect === 'auth_required') {
    sessionMessage.value = route.query.message as string || 'Please log in to access that page.';
    
    // Keep the URL parameters in case login needs them, but remove the message
    router.replace({
      ...route,
      query: {
        ...route.query,
        message: undefined
      }
    });
  }
});

const onEmailLogin = async () => {
  sessionMessage.value = '';
  
  if (!email.value || !password.value) {
    logError('Please enter both email and password', 'validation');
    return;
  }

  try {
    startLoading('login', 'Logging in...');
    await authStore.login(email.value, password.value);
    
    // Navigate to dashboard instead of home
    await router.push('/dashboard');
  } catch (error) {
    logError(error, 'auth');
  } finally {
    endLoading('login');
  }
};

const onGoogleLogin = async () => {
  sessionMessage.value = '';
  
  try {
    startLoading('google-login', 'Signing in with Google...');
    await authStore.loginWithGoogle();
    
    // Navigate to dashboard instead of home
    await router.push('/dashboard');
  } catch (error) {
    // Only show error if it's not a user cancellation
    if (error && typeof error === 'object' && 'code' in error) {
      const code = String(error.code || '');
      if (code !== 'auth/popup-closed-by-user' && code !== 'auth/cancelled-popup-request') {
        logError(error, 'auth');
      }
    } else {
      logError(error, 'auth');
    }
  } finally {
    endLoading('google-login');
  }
};
</script>

<template>
  <div class="space-y-6">
    <div class="text-center">
      <h2 class="text-2xl font-semibold mb-2 dark:text-white">Login</h2>
      <p class="text-gray-600 dark:text-gray-300">Welcome back to your journal</p>
    </div>

    <div v-if="sessionMessage" class="bg-blue-50 dark:bg-blue-900 text-blue-600 dark:text-blue-200 p-3 rounded text-sm">
      {{ sessionMessage }}
    </div>

    <form class="space-y-4" @submit.prevent="onEmailLogin">
      <div class="space-y-4">
        <div>
          <label for="email" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
          <input 
            id="email" 
            v-model="email"
            type="email" 
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
            placeholder="your@email.com"
            required>
        </div>
        
        <div>
          <div class="flex justify-between mb-1">
            <label for="password" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Password</label>
            <NuxtLink to="/auth/forgot-password" class="text-sm text-blue-500 hover:underline dark:text-blue-400">
              Forgot password?
            </NuxtLink>
          </div>
          <div class="relative">
            <input 
              id="password" 
              v-model="password"
              :type="showPassword ? 'text' : 'password'" 
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-10 dark:bg-gray-800 dark:text-white"
              placeholder="Your password"
              required>
            <button 
              type="button"
              class="absolute inset-y-0 right-0 pr-3 flex items-center"
              @click="showPassword = !showPassword"
            >
              <i :class="showPassword ? 'ri-eye-off-line' : 'ri-eye-line'" class="text-gray-500 dark:text-gray-400" />
            </button>
          </div>
        </div>
      </div>
      
      <!-- TODO: Add a button component -->
      <button
        type="submit"
        class="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-md transition duration-150 ease-in-out flex justify-center items-center"
        :disabled="authStore.isLoading"
      >
        <span v-if="authStore.isLoading" class="mr-2">
          <i class="ri-loader-4-line animate-spin" />
        </span>
        Login
      </button>
    </form>
    
    <div class="relative">
      <div class="absolute inset-0 flex items-center">
        <div class="w-full border-t border-gray-300 dark:border-gray-600" />
      </div>
      <div class="relative flex justify-center text-sm">
        <span class="border border-gray-300 dark:border-gray-600 px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">Or continue with</span>
      </div>
    </div>
    
    <!-- TODO: Add a button component -->
    <button
      type="button"
      class="w-full flex justify-center items-center py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-800 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-150 ease-in-out"
      :disabled="authStore.isLoading"
      @click="onGoogleLogin"
    >
      <span class="flex items-center">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 48 48" class="mr-2">
          <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" />
          <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" />
          <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z" />
          <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z" />
        </svg>
        Sign in with Google
      </span>
      <span v-if="authStore.isLoading" class="ml-2">
        <i class="ri-loader-4-line animate-spin" />
      </span>
    </button>
    
    <div class="text-center text-sm text-gray-600 dark:text-gray-300">
      Don't have an account?
      <NuxtLink to="/auth/register" class="text-blue-500 dark:text-blue-400 hover:underline">
        Sign up
      </NuxtLink>
    </div>
  </div>
</template> 

<style scoped>
.dark-mode .auth-span {
  background-color: var(--color-background-primary);
}
</style>


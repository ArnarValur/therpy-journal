<script setup lang="ts">
import { ref } from 'vue';
import { useAuthStore } from '~/stores/auth';
import { useErrorHandler } from '~/composables/useErrorHandler';
import { useLoadingState } from '~/composables/useLoadingState';

// Define page metadata with auth layout
definePageMeta({
  layout: 'auth',
  middleware: ['auth']
});

const router = useRouter();
const authStore = useAuthStore();
const { logError } = useErrorHandler();
const { startLoading, endLoading } = useLoadingState();

const name = ref('');
const email = ref('');
const password = ref('');
const confirmPassword = ref('');
const showPassword = ref(false);

const onRegister = async () => {
  // Basic validation
  if (!name.value || !email.value || !password.value) {
    logError('Please fill in all fields', 'validation');
    return;
  }
  
  if (password.value !== confirmPassword.value) {
    logError('Passwords do not match', 'validation');
    return;
  }
  
  if (password.value.length < 6) {
    logError('Password must be at least 6 characters', 'validation');
    return;
  }

  try {
    startLoading('register', 'Creating your account...');
    await authStore.register(name.value, email.value, password.value);
    await router.push('/');
  } catch (error) {
    logError(error, 'auth');
  } finally {
    endLoading('register');
  }
};

const onGoogleRegister = async () => {
  try {
    startLoading('google-register', 'Signing up with Google...');
    await authStore.loginWithGoogle();
    await router.push('/');
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
    endLoading('google-register');
  }
};
</script>

<template>
  <div class="space-y-6">
    <div class="text-center">
      <h2 class="text-2xl font-semibold mb-2 dark:text-white">Create Account</h2>
      <p class="text-gray-600 dark:text-gray-300">Start your therapeutic journey</p>
    </div>

    <form class="space-y-4" @submit.prevent="onRegister">
      <div class="space-y-4">
        <div>
          <label for="name" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label>
          <input 
            id="name" 
            v-model="name"
            type="text" 
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
            placeholder="Your name"
            required>
        </div>
        
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
          <label for="password" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password</label>
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
        
        <div>
          <label for="confirmPassword" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Confirm Password</label>
          <input 
            id="confirmPassword" 
            v-model="confirmPassword"
            :type="showPassword ? 'text' : 'password'" 
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
            placeholder="Confirm your password"
            required>
        </div>
      </div>
      
      <button
        type="submit"
        class="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-md transition duration-150 ease-in-out flex justify-center items-center"
        :disabled="authStore.isLoading"
      >
        <span v-if="authStore.isLoading" class="mr-2">
          <i class="ri-loader-4-line animate-spin" />
        </span>
        Create Account
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
    
    <button
      type="button"
      class="w-full flex justify-center items-center py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-800 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-150 ease-in-out"
      :disabled="authStore.isLoading"
      @click="onGoogleRegister"
    >
      <span class="flex items-center">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 48 48" class="mr-2">
          <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" />
          <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" />
          <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z" />
          <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z" />
        </svg>
        Sign up with Google
      </span>
      <span v-if="authStore.isLoading" class="ml-2">
        <i class="ri-loader-4-line animate-spin" />
      </span>
    </button>
    
    <div class="text-center text-sm text-gray-600 dark:text-gray-300">
      Already have an account?
      <NuxtLink to="/login" class="text-blue-500 dark:text-blue-400 hover:underline">
        Login
      </NuxtLink>
    </div>
  </div>
</template>

<style scoped>
.dark-mode .auth-span {
  background-color: var(--color-background-primary);
}
</style> 
<script setup lang="ts">
import { ref } from 'vue';
import { useAuthStore } from '~/stores/auth';
import { useErrorHandler } from '~/composables/useErrorHandler';
import { useLoadingState } from '~/composables/useLoadingState';

// Define page metadata with auth layout
definePageMeta({
  layout: 'auth',
});

const authStore = useAuthStore();
const { logError } = useErrorHandler();
const { startLoading, endLoading } = useLoadingState();

const email = ref('');
const isSubmitted = ref(false);

const onSubmit = async () => {
  if (!email.value) {
    logError('Please enter your email address', 'validation');
    return;
  }
  
  try {
    startLoading('reset-password', 'Sending reset link...');
    await authStore.resetPassword(email.value);
    isSubmitted.value = true;
  } catch (error) {
    logError(error, 'auth');
  } finally {
    endLoading('reset-password');
  }
};
</script>

<template>
  <div class="space-y-6">
    <div class="text-center">
      <h2 class="text-2xl font-semibold mb-2 dark:text-white">Reset Password</h2>
      <p class="text-gray-600 dark:text-gray-300">We'll send you a link to reset your password</p>
    </div>

    <div v-if="isSubmitted" class="bg-green-50 dark:bg-green-900 text-green-600 dark:text-green-200 p-4 rounded text-center">
      <p>If an account exists with this email, you will receive a password reset link.</p>
      <NuxtLink to="/login" class="block mt-4 text-blue-500 dark:text-blue-400 hover:underline">
        Return to login
      </NuxtLink>
    </div>
    
    <template v-else>
      <form class="space-y-6" @submit.prevent="onSubmit">
        <div>
          <label for="email" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
          <input 
            id="email" 
            v-model="email"
            type="email" 
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
            placeholder="Enter your registered email"
            required>
        </div>
        
        <button
          type="submit"
          class="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-md transition duration-150 ease-in-out flex justify-center items-center"
          :disabled="authStore.isLoading"
        >
          <span v-if="authStore.isLoading" class="mr-2">
            <i class="ri-loader-4-line animate-spin" />
          </span>
          Send Reset Link
        </button>
      </form>
      
      <div class="text-center text-sm pt-4 text-gray-600 dark:text-gray-300">
        <NuxtLink to="/login" class="text-blue-500 dark:text-blue-400 hover:underline">
          Back to login
        </NuxtLink>
      </div>
    </template>
  </div>
</template>

<style scoped>
.dark-mode .auth-span {
  background-color: var(--color-background-primary);
}
</style> 
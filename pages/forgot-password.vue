<script setup lang="ts">
import { ref } from 'vue';
import { useAuthStore } from '~/stores/auth';

// Define page metadata with auth layout
definePageMeta({
  layout: 'auth',
});

const authStore = useAuthStore();
const email = ref('');
const isSubmitted = ref(false);
const errorMessage = ref('');

const onSubmit = async () => {
  if (!email.value) {
    errorMessage.value = 'Please enter your email address';
    return;
  }
  
  try {
    await authStore.resetPassword(email.value);
    isSubmitted.value = true;
  } catch {
    errorMessage.value = authStore.error || 'Failed to send password reset email';
  }
};
</script>

<template>
  <div class="space-y-6">
    <div class="text-center">
      <h2 class="text-2xl font-semibold mb-2">Reset Password</h2>
      <p class="text-gray-600">We'll send you a link to reset your password</p>
    </div>

    <div v-if="isSubmitted" class="bg-green-50 text-green-600 p-4 rounded text-center">
      <p>If an account exists with this email, you will receive a password reset link.</p>
      <NuxtLink to="/login" class="block mt-4 text-blue-500 hover:underline">
        Return to login
      </NuxtLink>
    </div>
    
    <template v-else>
      <div v-if="errorMessage" class="bg-red-50 text-red-600 p-3 rounded text-sm">
        {{ errorMessage }}
      </div>

      <form class="space-y-6" @submit.prevent="onSubmit">
        <div>
          <label for="email" class="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input 
            id="email" 
            v-model="email"
            type="email" 
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
      
      <div class="text-center text-sm pt-4">
        <NuxtLink to="/login" class="text-blue-500 hover:underline">
          Back to login
        </NuxtLink>
      </div>
    </template>
  </div>
</template> 
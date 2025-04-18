<template>
  <div v-if="showBanner" class="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
    <div class="flex items-center">
      <div class="flex-shrink-0">
        <Icon name="heroicons:exclamation-triangle" class="h-5 w-5 text-yellow-400" aria-hidden="true" />
      </div>
      <div class="ml-3">
        <p class="text-sm text-yellow-700">
          Please verify your email address. 
          <button 
          :disabled="isLoading"
          class="font-medium text-yellow-700 underline hover:text-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed"
          @click="handleResendVerification" 
          >
            {{ isLoading ? 'Sending...' : 'Resend verification email' }}
          </button>
        </p>
      </div>
    </div>
    <!-- Success Message -->
    <div v-if="successMessage" class="mt-2 text-sm text-green-600">
      {{ successMessage }}
    </div>
    <!-- Error Message -->
    <div v-if="errorMessage" class="mt-2 text-sm text-red-600">
      {{ errorMessage }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useAuthStore } from '~/stores/auth';

const authStore = useAuthStore();
const isLoading = ref(false);
const successMessage = ref('');
const errorMessage = ref('');

// Only show banner if user is logged in but email is not verified
const showBanner = computed(() => {
  return authStore.isLoggedIn && !authStore.isEmailVerified;
});

// Handle resend verification email
const handleResendVerification = async () => {
  if (isLoading.value) return;
  
  try {
    isLoading.value = true;
    errorMessage.value = '';
    successMessage.value = '';
    
    await authStore.sendVerificationEmail();
    successMessage.value = 'Verification email sent! Please check your inbox.';
    
    // Start checking for verification
    startVerificationCheck();
  } catch {
    errorMessage.value = authStore.error || 'Failed to send verification email';
  } finally {
    isLoading.value = false;
  }
};

// Check verification status periodically after sending email
const startVerificationCheck = () => {
  const checkInterval = setInterval(async () => {
    const isVerified = await authStore.checkEmailVerification();
    if (isVerified) {
      clearInterval(checkInterval);
    }
  }, 5000); // Check every 5 seconds
  
  // Clean up after 5 minutes
  setTimeout(() => {
    clearInterval(checkInterval);
  }, 300000); // 5 minutes
};
</script> 
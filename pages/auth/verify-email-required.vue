<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-8">
      <div>
        <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Email Verification Required
        </h2>
        <p class="mt-2 text-center text-sm text-gray-600">
          Please verify your email address to continue using the app.
        </p>
      </div>
      
      <EmailVerificationBanner />
      
      <div class="text-center mt-4">
        <p class="text-sm text-gray-500">
          Already verified your email?
          <button 
          :disabled="isChecking"
          class="ml-1 font-medium text-indigo-600 hover:text-indigo-500 disabled:opacity-50"
          @click="checkVerification" 
          >
            {{ isChecking ? 'Checking...' : 'Click here to continue' }}
          </button>
        </p>
      </div>
      
      <div class="text-center mt-4">
        <button 
        class="text-sm font-medium text-red-600 hover:text-red-500"
        @click="handleLogout" 
        >
          Sign out
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useAuthStore } from '~/stores/auth';
import { useRouter, useRoute } from '#app';

// Define page metadata
definePageMeta({
  layout: 'auth',
  middleware: ['auth']
});

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();
const isChecking = ref(false);

// Store the original route to redirect back to
const redirectPath = ref('/');

onMounted(() => {
  // Get the redirect path from query parameters or default to home
  redirectPath.value = route.query.redirect?.toString() || '/';
});

// Check verification status and redirect if verified
const checkVerification = async () => {
  if (isChecking.value) return;
  
  try {
    isChecking.value = true;
    const isVerified = await authStore.checkEmailVerification();
    
    if (isVerified) {
      await router.push(redirectPath.value);
    }
  } finally {
    isChecking.value = false;
  }
};

// Handle logout
const handleLogout = async () => {
  try {
    await authStore.logout();
    await router.push('/auth/login');
  } catch (error) {
    console.error('Logout failed:', error);
  }
};

// Start periodic verification check
onMounted(() => {
  const checkInterval = setInterval(async () => {
    const isVerified = await authStore.checkEmailVerification();
    if (isVerified) {
      clearInterval(checkInterval);
      await router.push(redirectPath.value);
    }
  }, 5000); // Check every 5 seconds
  
  // Clean up interval after 5 minutes
  setTimeout(() => {
    clearInterval(checkInterval);
  }, 300000); // 5 minutes
  
  // Clean up on component unmount
  onBeforeUnmount(() => {
    clearInterval(checkInterval);
  });
});
</script> 
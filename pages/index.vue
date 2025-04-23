<!-- pages/index.vue -->
<script setup lang="ts">
import { useAuthStore } from '~/stores/auth';

// Remove middleware from index to allow both authenticated and unauthenticated users
definePageMeta({
  layout: 'default'
});

// Get required stores
const authStore = useAuthStore();
const router = useRouter();

// Determine whether to show landing page or dashboard based on auth state
onMounted(async () => {
  // Wait for auth state to be determined
  if (authStore.isLoading) {
    await new Promise(resolve => {
      const unwatch = watch(() => authStore.isLoading, (isLoading) => {
        if (!isLoading) {
          unwatch();
          resolve(true);
        }
      });
      
      // Set a timeout in case auth state takes too long
      setTimeout(() => {
        unwatch();
        resolve(false);
      }, 2000);
    });
  }
  
  // Route based on authentication state
  if (authStore.isLoggedIn && authStore.isEmailVerified) {
    await router.push('/dashboard');
  } else {
    await router.push('/landing');
  }
});
</script>

<template>
  <div class="flex justify-center items-center h-screen">
    <!-- Simple loading indicator while determining redirect -->
    <div v-if="authStore.isLoading" class="text-center">
      <div class="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
      <p class="mt-2 text-gray-600 dark:text-gray-400">Loading...</p>
    </div>
  </div>
</template> 
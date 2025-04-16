<script setup lang="ts">
import { useAuthStore } from '~/stores/auth';

// Get auth store to access loading state
const authStore = useAuthStore();

// Add a small delay before showing content to avoid flashing between pages
// This gives time for the auth state to be determined
const showContent = ref(false);
const isClient = ref(false);

onMounted(() => {
  // Mark that we're now on the client side
  isClient.value = true;
  
  setTimeout(() => {
    showContent.value = true;
  }, 300); // Increased delay to ensure auth is loaded
});

// Helper to check if we should show the page or loading state
const shouldShowContent = computed(() => {
  // Always show content on the server, but let client handle auth
  if (import.meta.server) return true;
  
  // On client, show content when either not loading or delay passed
  return showContent.value || !authStore.isLoading;
});
</script>

<template>
  <div>
    <!-- Show loading indicator while auth is initializing on client side only -->
    <div v-if="isClient && authStore.isLoading && !showContent" class="auth-loading">
      <div class="loading-spinner"></div>
    </div>
    
    <!-- Show content once we're ready -->
    <NuxtLayout v-if="shouldShowContent">
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>

<style scoped>
.auth-loading {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: rgba(255, 255, 255, 0.9);
  z-index: 9999;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #42A5F5;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>

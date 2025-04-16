<script setup lang="ts">
import { useAuthStore } from '~/stores/auth';
import { useLoadingState } from '~/composables/useLoadingState';

// Get auth store to access loading state
const authStore = useAuthStore();
const { startLoading, endLoading } = useLoadingState();

// Check if in development mode
const isDev = import.meta.dev || false;

// Add a small delay before showing content to avoid flashing between pages
// This gives time for the auth state to be determined
const showContent = ref(false);
const isClient = ref(false);

onMounted(() => {
  // Mark that we're now on the client side
  isClient.value = true;
  
  // Track auth loading state in our global loading system
  if (authStore.isLoading) {
    startLoading('auth-initialization', 'Initializing application...');
  }
  
  // Watch auth loading state and update global loading accordingly
  watch(() => authStore.isLoading, (isAuthLoading) => {
    if (isAuthLoading) {
      startLoading('auth-initialization', 'Initializing application...');
    } else {
      endLoading('auth-initialization');
    }
  });
  
  setTimeout(() => {
    showContent.value = true;
    // End loading after the delay regardless
    endLoading('auth-initialization');
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
  <div :class="{ 'dark': $colorMode.value === 'dark' }">
    <GlobalLoading />
    <ErrorToast />
    
    <!-- Show content once we're ready -->
    <NuxtLayout v-if="shouldShowContent">
      <NuxtPage />
    </NuxtLayout>

    <!-- Debug: Show current theme in bottom right corner during development -->
    <div v-if="isDev" class="fixed bottom-2 right-2 text-xs py-1 px-2 bg-opacity-70 rounded theme-debug">
      Theme: {{ $colorMode.preference }} ({{ $colorMode.value }})
    </div>
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
  background-color: var(--color-background-primary);
  opacity: 0.9;
  z-index: 9999;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 3px solid var(--color-background-tertiary);
  border-top: 3px solid var(--color-primary);
  animation: spin 1s linear infinite;
}

.theme-debug {
  background-color: var(--color-background-primary);
  color: var(--color-text-secondary);
  z-index: 100;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>

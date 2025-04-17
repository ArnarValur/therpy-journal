<script setup lang="ts">
import { useAuthStore } from '~/stores/auth';
import { useLoadingState } from '~/composables/useLoadingState';
import { useUserPreferences } from '~/composables/useUserPreferences';

// Get auth store and load user preferences
const authStore = useAuthStore();
const { startLoading, endLoading } = useLoadingState();
const { isLoading: prefsLoading, initPreferences } = useUserPreferences();

// Check if in development mode
const isDev = import.meta.dev || false;

// Initialize client-side state
const showContent = ref(true); // Default to showing content
const isClient = ref(false);
const appInitializing = ref(false);

// This will track if we have a logged-in user from SSR context
// We can use this to avoid loading indicators during hydration
const isAuthenticatedFromSSR = computed(() => authStore.user !== null);

// Wait for both auth AND preferences to be fully loaded
const fullyLoaded = computed(() => 
  !authStore.isLoading && !prefsLoading.value && !appInitializing.value
);

onMounted(async () => {
  // Mark that we're now on the client side
  isClient.value = true;
  
  // Skip all loading for authenticated users
  if (isAuthenticatedFromSSR.value) {
    // Just initialize in the background without showing any loaders
    setTimeout(() => {
      // Use a small timeout to ensure proper hydration
      authStore.initialize().then(() => {
        initPreferences();
      });
    }, 0);
    return;
  }
  
  // Check if we have a logged-in user from browser storage
  const cachedUser = localStorage.getItem('nuxt-auth-user');
  if (cachedUser) {
    // We have a cached user, just initialize in the background
    authStore.initialize().then(() => {
      initPreferences();
    });
    return;
  }
  
  // Only show loading for users who are not logged in at all
  appInitializing.value = true;
  showContent.value = false;
  
  // Normal initialization path for first load or logged-out users
  startLoading('app-initialization', 'Initializing application...');
  
  // Track auth loading state
  const onAuthChange = (isAuthLoading: boolean) => {
    if (isAuthLoading) {
      startLoading('auth-initialization', 'Initializing application...');
    } else {
      // When auth is ready, initialize user preferences
      endLoading('auth-initialization');
      
      // Only initialize preferences once
      if (appInitializing.value) {
        initPreferences().then(() => {
          appInitializing.value = false;
        });
      }
    }
  };
  
  // Set up the auth state watcher
  watch(() => authStore.isLoading, onAuthChange, { immediate: true });
  
  // When BOTH auth and preferences are loaded, show content
  watch(fullyLoaded, (isLoaded) => {
    if (isLoaded) {
      showContent.value = true;
      endLoading('app-initialization');
    }
  }, { immediate: true });
});
</script>

<template>
  <div :class="{ 'dark': $colorMode.value === 'dark' }">
    <!-- Only show global loading when user is not logged in and still loading -->
    <GlobalLoading v-if="!authStore.user && !showContent" />
    <ErrorToast />
    
    <!-- Only show loading overlay for first-time login or logged-out users -->
    <div v-if="isClient && !authStore.user && !showContent" class="loading-overlay">
      <div class="loading-spinner"></div>
      <p>Initializing application...</p>
    </div>
    
    <!-- Main app content - always show immediately for logged-in users -->
    <NuxtLayout v-if="isClient && (showContent || authStore.user)">
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

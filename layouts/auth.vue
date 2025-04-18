<!-- layouts/auth.vue -->
<script setup lang="ts">
// Auth layout for login and registration pages
</script>

<template>
  <div class="min-h-screen auth-bg flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-8">
      <div class="text-center">
        <h1 class="text-3xl font-bold mb-2 primary-text">TherapyJournal</h1>
        <p class="secondary-text">Your secure space for reflection</p>
      </div>
      
      <div class="auth-card shadow rounded-lg p-6">
        <slot />
      </div>
      
      <!-- Theme toggle in bottom corner -->
      <div class="absolute bottom-4 right-4">
        <ThemeToggle />
      </div>
    </div>
  </div>
</template>

<style scoped>
.auth-bg {
  background-color: var(--color-background-secondary);
}

.auth-card {
  background-color: var(--color-background-primary);
  border: 1px solid var(--color-border);
}

.primary-text {
  color: var(--color-primary);
}

.secondary-text {
  color: var(--color-text-secondary);
}
</style> 
<!-- layouts/auth.vue -->
<script setup lang="ts">
// Auth layout for login and registration pages
</script>

<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-8">
      <div class="text-center">
        <h1 class="text-3xl font-bold mb-2 text-blue-500">TherapyJournal</h1>
        <p class="text-gray-600 dark:text-gray-400">Your secure space for reflection</p>
      </div>
      
      <div class="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6 border border-gray-200 dark:border-gray-700 transition-colors duration-200">
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
/* Remove CSS variables and use Tailwind classes instead */
</style> 
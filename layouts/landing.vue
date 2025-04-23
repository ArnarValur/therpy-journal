<!-- layouts/landing.vue -->
<script setup lang="ts">
// Landing layout for public pages without sidebar
</script>

<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200 flex flex-col">
    <!-- Simple header with logo and auth buttons -->
    <header class="bg-white dark:bg-gray-800 shadow-sm py-4 px-6">
      <div class="container mx-auto flex justify-between items-center">
        <h1 class="text-2xl font-bold text-blue-500">TherapyJournal</h1>
        <div class="flex space-x-4">
          <NuxtLink 
            to="/auth/login" 
            class="px-4 py-2 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium transition-colors"
          >
            Login
          </NuxtLink>
          <NuxtLink 
            to="/auth/register" 
            class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors"
          >
            Sign Up
          </NuxtLink>
        </div>
      </div>
    </header>
    
    <!-- Main content -->
    <main class="flex-grow">
      <slot />
    </main>
    
    <!-- Footer -->
    <footer class="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 py-6 px-6">
      <div class="container mx-auto">
        <div class="flex flex-col md:flex-row justify-between items-center">
          <p class="text-gray-600 dark:text-gray-400 text-sm">
            © {{ new Date().getFullYear() }} TherapyJournal. All rights reserved.
          </p>
          <div class="mt-4 md:mt-0">
            <ThemeToggle />
          </div>
        </div>
      </div>
    </footer>
  </div>
</template>

<style scoped>
/* Use Tailwind classes for styling */
</style> 
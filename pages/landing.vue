<!-- pages/landing.vue -->
<script setup lang="ts">
import { useAuthStore } from '~/stores/auth';

// No auth middleware needed for landing page
definePageMeta({
  layout: 'landing'
});

const authStore = useAuthStore();
const router = useRouter();
const { $routes } = useNuxtApp();

// If user is already logged in, redirect to dashboard
onMounted(async () => {
  /*if (authStore.isLoggedIn && authStore.isEmailVerified) {
    await router.push('/dashboard');
  }*/
});

const navigateToLogin = () => {
  router.push($routes.AUTH.LOGIN);
};

const navigateToRegister = () => {
  router.push($routes.AUTH.REGISTER);
};
</script>

<template>
  <div class="min-h-screen flex flex-col">
    <!-- Hero Section -->
    <div class="flex flex-col items-center justify-center p-8 md:p-12 bg-gradient-to-b from-white to-blue-50 dark:from-gray-900 dark:to-gray-800 py-24">
      <div class="max-w-5xl mx-auto text-center">
        <h1 class="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-6">
          Track Your Therapy Journey
        </h1>
        <p class="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
          A secure, private journal to document your therapy sessions, track your progress, and reflect on your mental health journey.
        </p>
        
        <div class="flex flex-col sm:flex-row gap-4 justify-center">
          <button 
            class="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors duration-300 text-lg"
            @click="navigateToLogin"
          >
            Log In
          </button>
          <button 
            class="px-8 py-3 bg-white hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700 text-blue-600 dark:text-blue-400 font-medium rounded-md border border-blue-600 dark:border-blue-500 transition-colors duration-300 text-lg"
            @click="navigateToRegister"
          >
            Sign Up
          </button>
        </div>
      </div>
    </div>

    <!-- Features Section -->
    <div class="py-16 bg-white dark:bg-gray-900 px-4">
      <div class="max-w-6xl mx-auto">
        <h2 class="text-3xl font-bold text-center text-gray-900 dark:text-white mb-12">
          Key Features
        </h2>
        
        <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div class="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg shadow-sm">
            <div class="text-blue-600 dark:text-blue-400 mb-4">
              <i class="ri-shield-check-line text-3xl" />
            </div>
            <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">Private & Secure</h3>
            <p class="text-gray-600 dark:text-gray-300">Your journal entries are  and only accessible to you.</p>
          </div>
          
          <div class="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg shadow-sm">
            <div class="text-blue-600 dark:text-blue-400 mb-4">
              <i class="ri-emotion-line text-3xl" />
            </div>
            <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">Mood Tracking</h3>
            <p class="text-gray-600 dark:text-gray-300">Track your emotional state over time and identify patterns.</p>
          </div>
          
          <div class="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg shadow-sm">
            <div class="text-blue-600 dark:text-blue-400 mb-4">
              <i class="ri-book-open-line text-3xl" />
            </div>
            <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">Guided Reflection</h3>
            <p class="text-gray-600 dark:text-gray-300">Prompts and templates to help you get the most from your journaling.</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <footer class="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 py-6 px-6 mt-auto">
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
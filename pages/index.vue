<script setup lang="ts">
import { ref } from 'vue';
import { useAuthStore } from '~/stores/auth';

definePageMeta({
  layout: 'default',
  middleware: ['auth']
});

const authStore = useAuthStore();

// Mock data for recent entries
const recentEntries = ref([
  {
    id: 1,
    title: 'Morning Reflection',
    date: '2023-12-01',
    excerpt: 'Today I woke up feeling refreshed and ready to tackle the day...',
    sentiment: 'positive'
  },
  {
    id: 2,
    title: 'Evening Thoughts',
    date: '2023-11-29',
    excerpt: 'Reflecting on the challenges of today, I realized that...',
    sentiment: 'neutral'
  },
  {
    id: 3,
    title: 'Anxiety Session',
    date: '2023-11-25',
    excerpt: 'I felt overwhelmed by the upcoming deadline and noticed that...',
    sentiment: 'negative'
  }
]);

// Mock sentiment data for chart
const _sentimentData = {
  positive: 12,
  neutral: 8,
  negative: 5
};
</script>

<template>
  <div class="space-y-6 sm:space-y-8 p-4 sm:p-6 bg-gray-50 dark:bg-transparent rounded-lg">
    <!-- Header section with welcome and new entry button -->
    <div class="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
      <div>
        <h1 class="text-xl sm:text-2xl font-bold dark:text-white">Dashboard</h1>
        <p class="dark:text-gray-300 text-sm sm:text-base">Welcome, {{ authStore.user?.name || 'User' }}!</p>
      </div>
      <button class="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors w-full sm:w-auto flex items-center justify-center" to="/journal/new">
        <i class="ri-add-line mr-2" />
        New Entry
      </button>
    </div>

    <!-- Stats cards -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
      <div class="rounded-lg shadow-md bg-white dark:bg-gray-800 p-4 sm:p-6 border border-gray-100 dark:border-gray-700">
        <div class="flex justify-between items-center mb-2 sm:mb-4">
          <h3 class="text-base sm:text-lg font-medium dark:text-white">Total Entries</h3>
          <i class="ri-book-2-line text-[#42A5F5] text-xl" />
        </div>
        <p class="text-2xl sm:text-3xl font-bold dark:text-white">25</p>
        <p class="text-xs sm:text-sm mt-1 text-gray-600 dark:text-gray-400">Last entry 2 days ago</p>
      </div>
      
      <div class="rounded-lg shadow-md bg-white dark:bg-gray-800 p-4 sm:p-6 border border-gray-100 dark:border-gray-700">
        <div class="flex justify-between items-center mb-2 sm:mb-4">
          <h3 class="text-base sm:text-lg font-medium dark:text-white">Mood Trend</h3>
          <i class="ri-emotion-line text-[#26A69A] text-xl" />
        </div>
        <p class="text-2xl sm:text-3xl font-bold text-[#26A69A]">Positive</p>
        <p class="text-xs sm:text-sm mt-1 text-gray-600 dark:text-gray-400">Based on your recent entries</p>
      </div>
      
      <div class="rounded-lg shadow-md bg-gray-50 dark:bg-gray-800 p-4 sm:p-6 border border-gray-100 dark:border-gray-700">
        <div class="flex justify-between items-center mb-2 sm:mb-4">
          <h3 class="text-base sm:text-lg font-medium dark:text-white">Streak</h3>
          <i class="ri-fire-line text-orange-500 text-xl" />
        </div>
        <p class="text-2xl sm:text-3xl font-bold dark:text-white">7 days</p>
        <p class="text-xs sm:text-sm mt-1 text-gray-600 dark:text-gray-400">Keep up the good work!</p>
      </div>
    </div>

    <!-- Recent entries -->
    <div class="rounded-lg shadow-md bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
      <div class="border-b dark:border-gray-700 px-4 sm:px-6 py-3 sm:py-4">
        <h2 class="text-base sm:text-lg font-medium dark:text-white">Recent Entries</h2>
      </div>
      <div class="divide-y dark:divide-gray-700">
        <div
          v-for="entry in recentEntries"
          :key="entry.id"
          class="p-4 sm:p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer"
        >
          <div class="flex items-start justify-between">
            <div class="flex-1 pr-3">
              <h3 class="font-medium text-gray-800 dark:text-gray-200 text-sm sm:text-base">{{ entry.title }}</h3>
              <p class="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">{{ entry.date }}</p>
              <p class="mt-2 text-xs sm:text-sm text-gray-600 dark:text-gray-300 line-clamp-2 sm:line-clamp-none">{{ entry.excerpt }}</p>
            </div>
            <div 
              class="w-3 h-3 rounded-full mt-1 flex-shrink-0" 
              :class="{
                'bg-green-500': entry.sentiment === 'positive',
                'bg-gray-400 dark:bg-gray-500': entry.sentiment === 'neutral',
                'bg-red-500': entry.sentiment === 'negative'
              }"
            />
          </div>
        </div>
      </div>
      <div class="border-t dark:border-gray-700 px-4 sm:px-6 py-3 sm:py-4">
        <NuxtLink to="/journal" class="text-[#42A5F5] hover:text-[#2196F3] dark:text-blue-400 dark:hover:text-blue-300 hover:underline flex items-center text-sm sm:text-base">
          View all entries
          <i class="ri-arrow-right-line ml-1" />
        </NuxtLink>
      </div>
    </div>
  </div>
</template> 
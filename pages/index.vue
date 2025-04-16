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
  <div class="space-y-8">
    <div class="flex justify-between items-center">
      <div>
        <h1 class="text-2xl font-bold text-gray-800">Dashboard</h1>
        <p class="text-gray-600">Welcome, {{ authStore.user?.name || 'User' }}!</p>
      </div>
      <RButton variant="primary" to="/journal/new">
        <i class="ri-add-line mr-2" />
        New Entry
      </RButton>
    </div>

    <!-- Stats cards -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div class="bg-white rounded-lg shadow p-6">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-lg font-medium text-gray-700">Total Entries</h3>
          <i class="ri-book-2-line text-[#42A5F5] text-xl" />
        </div>
        <p class="text-3xl font-bold text-gray-800">25</p>
        <p class="text-sm text-gray-500 mt-1">Last entry 2 days ago</p>
      </div>
      
      <div class="bg-white rounded-lg shadow p-6">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-lg font-medium text-gray-700">Mood Trend</h3>
          <i class="ri-emotion-line text-[#26A69A] text-xl" />
        </div>
        <p class="text-3xl font-bold text-[#26A69A]">Positive</p>
        <p class="text-sm text-gray-500 mt-1">Based on your recent entries</p>
      </div>
      
      <div class="bg-white rounded-lg shadow p-6">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-lg font-medium text-gray-700">Streak</h3>
          <i class="ri-fire-line text-orange-500 text-xl" />
        </div>
        <p class="text-3xl font-bold text-gray-800">7 days</p>
        <p class="text-sm text-gray-500 mt-1">Keep up the good work!</p>
      </div>
    </div>

    <!-- Recent entries -->
    <div class="bg-white rounded-lg shadow">
      <div class="border-b px-6 py-4">
        <h2 class="text-lg font-medium text-gray-700">Recent Entries</h2>
      </div>
      <div class="divide-y">
        <div
          v-for="entry in recentEntries"
          :key="entry.id"
          class="p-6 hover:bg-gray-50 transition-colors"
        >
          <div class="flex items-start justify-between">
            <div>
              <h3 class="font-medium text-gray-800">{{ entry.title }}</h3>
              <p class="text-sm text-gray-500 mt-1">{{ entry.date }}</p>
              <p class="mt-2 text-gray-600">{{ entry.excerpt }}</p>
            </div>
            <div 
              class="w-3 h-3 rounded-full mt-1" 
              :class="{
                'bg-green-500': entry.sentiment === 'positive',
                'bg-gray-400': entry.sentiment === 'neutral',
                'bg-red-500': entry.sentiment === 'negative'
              }"
            />
          </div>
        </div>
      </div>
      <div class="border-t px-6 py-4">
        <NuxtLink to="/journal" class="text-[#42A5F5] hover:underline flex items-center">
          View all entries
          <i class="ri-arrow-right-line ml-1" />
        </NuxtLink>
      </div>
    </div>
  </div>
</template> 
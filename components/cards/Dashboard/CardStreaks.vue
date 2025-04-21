<!-- components/cards/Dashboard/CardStreaks.vue -->
<script setup lang="ts">
import { computed } from 'vue';
import { useStreaks } from '~/composables/useStreaks';

const { currentStreak, isLoading } = useStreaks();

// Dynamic streak message based on streak count
const streakMessage = computed(() => {
  if (currentStreak.value === 0) return 'Start your writing streak today!';
  if (currentStreak.value === 1) return 'Great start! Keep writing!';
  if (currentStreak.value < 5) return 'Keep up the good work!';
  if (currentStreak.value < 10) return 'Impressive dedication!';
  if (currentStreak.value < 30) return 'You\'re on fire!';
  return 'Amazing consistency! You\'re a journaling pro!';
});
</script> 

<template>
  <div class="rounded-lg shadow-md bg-gray-50 dark:bg-gray-800 p-4 sm:p-6 border border-gray-100 dark:border-gray-700">
    <div class="flex justify-between items-center mb-2 sm:mb-4">
        <h3 class="text-base sm:text-lg font-medium dark:text-white">Streak</h3>
        <i class="ri-fire-line text-orange-500 text-xl" />
    </div>
    <div v-if="isLoading" class="animate-pulse">
      <div class="h-8 w-24 bg-gray-200 dark:bg-gray-700 rounded" />
      <div class="h-4 w-40 bg-gray-200 dark:bg-gray-700 rounded mt-2" />
    </div>
    <template v-else>
      <p class="text-2xl sm:text-3xl font-bold dark:text-white">
        {{ currentStreak }} {{ currentStreak === 1 ? 'day' : 'days' }}
      </p>
      <p class="text-xs sm:text-sm mt-1 text-gray-600 dark:text-gray-400">{{ streakMessage }}</p>
    </template>
  </div>
</template>
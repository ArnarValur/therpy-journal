<!-- components/cards/Dashboard/CardTotal.vue -->
<script setup lang="ts">
import { computed } from 'vue';
import { useJournalEntry } from '~/composables/useJournalEntry';

const { entries } = useJournalEntry();

// Filter out draft entries for the dashboard
const publishedEntries = computed(() => {
  const publishedEntries = entries.value.filter(entry => !entry.isDraft);
  return publishedEntries;
});

// Check if there are any published entries
const hasEntries = computed(() => publishedEntries.value.length > 0);

// Get the last entry date if it exists
const lastEntryDate = computed(() => {
  if (hasEntries.value) {
    const lastEntry = publishedEntries.value[publishedEntries.value.length - 1];
    return lastEntry.createdAt instanceof Date 
      ? lastEntry.createdAt 
      : new Date(lastEntry.createdAt);
  }
  return null;
});

// Format date
const formatDate = (date: Date | null) => {
  if (!date) return 'No entries yet';
  return new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
};
</script> 

<template>
  <div class="rounded-lg shadow-md bg-white dark:bg-gray-800 p-4 sm:p-6 border border-gray-100 dark:border-gray-700">
    <div class="flex justify-between items-center mb-2 sm:mb-4">
        <h3 class="text-base sm:text-lg font-medium dark:text-white">Total Entries</h3>
        <i class="ri-book-2-line text-blue-500 text-xl" />
    </div>
    <p class="text-2xl sm:text-3xl font-bold dark:text-white">{{ publishedEntries.length }}</p>
    <p class="text-xs sm:text-sm mt-1 text-gray-600 dark:text-gray-400">
      {{ hasEntries ? `Last entry ${formatDate(lastEntryDate)}` : 'No entries yet' }}
    </p>
  </div>
</template>
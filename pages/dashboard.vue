<!-- pages/dashboard.vue -->
<script setup lang="ts">
import { computed } from 'vue';
import { useAuthStore } from '~/stores/auth';
import EntryButton from '~/components/buttons/EntryButton.vue';
import CardTotal from '~/components/cards/Dashboard/CardTotal.vue';
import CardMood from '~/components/cards/Dashboard/CardMood.vue';
import CardStreaks from '~/components/cards/Dashboard/CardStreaks.vue';

definePageMeta({
  layout: 'default',
  middleware: ['auth']
});

// Check if user is authenticated
onMounted(async () => {
  if (!authStore.isLoggedIn) {
    await router.push(useNuxtApp().$routes.AUTH.LOGIN);
    return;
  }
  
  // Load journal entries for the user
  await loadEntries();
});

// TODO: add loading state and error handling
const { loadEntries, entries } = useJournalEntry();
const { sanitize } = useSanitize();

// Get required stores
const authStore = useAuthStore();

// Get router
const router = useRouter();

// Filter out draft entries for the dashboard
const publishedEntries = computed(() => {
  const publishedEntries = entries.value.filter(entry => !entry.isDraft);
  return publishedEntries;
});

// Function to strip HTML from journal entry content and get preview
const getContentPreview = (content: string) => {
  // First sanitize the HTML
  const sanitizedHtml = sanitize(content);
  // Create a temporary div to parse HTML and get text content
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = sanitizedHtml;
  const textContent = tempDiv.textContent || tempDiv.innerText || '';
  // Return truncated text
  return textContent.substring(0, 150) + (textContent.length > 50 ? '...' : '');
};

// Function to format date
const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
};

// Handle journal entry viewing
const handleViewEntry = (id: string) => {
  const { $routes } = useNuxtApp();
  router.push($routes.JOURNAL.VIEW(id));
};

// Handle new journal entry creation
const handleNewEntry = () => {
  router.push('/journal/new');
};
</script>

<template>
  <div class="space-y-6 sm:space-y-8 p-4 sm:p-6 bg-gray-50 dark:bg-transparent rounded-lg">
    
    <!-- Header section with welcome and new entry button -->
    <div class="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
      <div>
        <h1 class="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white">Dashboard</h1>
      </div>
      <EntryButton 
        class="text-white"
        @click="handleNewEntry"
      >
        <i class="ri-add-line mr-2" />
        New Entry
      </EntryButton>
    </div>

    <!-- Stats cards -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
      
      <CardTotal />
      
      <CardMood />
      
      <CardStreaks />
    </div>

    <!-- Recent entries -->
    <div class="rounded-lg shadow-md bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
      <div class="border-b dark:border-gray-700 px-4 sm:px-6 py-3 sm:py-4">
        <h2 class="text-base sm:text-lg font-medium dark:text-white">Recent Entries</h2>
      </div>
      <div class="divide-y dark:divide-gray-700">
        <div
          v-for="entry in publishedEntries"
          :key="entry.id"
          class="p-4 sm:p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer"
          @click="handleViewEntry(entry.id as string)"
        >
          <div class="flex items-start justify-between">
            <div class="flex-1 pr-3">
              <h3 class="font-medium text-gray-800 dark:text-gray-200 text-sm sm:text-base">{{ entry.title }}</h3>
              <p class="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">{{ formatDate(entry.createdAt instanceof Date ? entry.createdAt : new Date()) }}</p>
              <p class="mt-2 text-xs sm:text-sm text-gray-600 dark:text-gray-300 line-clamp-2 sm:line-clamp-none">{{ getContentPreview(entry.content) }}</p>
            </div>
          </div>
        </div>
      </div>
      <div class="border-t dark:border-gray-700 px-4 sm:px-6 py-3 sm:py-4">
        <NuxtLink to="/journal" class="text-blue-500 hover:text-[#2196F3] dark:text-blue-400 dark:hover:text-blue-300 hover:underline flex items-center text-sm sm:text-base">
          View all entries
          <i class="ri-arrow-right-line ml-1" />
        </NuxtLink>
      </div>
    </div>
  </div>
</template> 
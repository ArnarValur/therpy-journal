<script setup lang="ts">
import { onMounted, ref, computed } from 'vue';
import EntryButton from '~/components/button/EntryButton.vue';
import FilterButton from '~/components/button/FilterButton.vue';
import { useSanitize } from '~/composables/useSanitize';

// Get required composables
const { loadEntries, entries, isLoading, error, deleteEntry } = useJournalEntry();
const { sanitize } = useSanitize();

// Get required stores
const authStore = useAuthStore();

// Get router
const router = useRouter();

// Date filter state
const dateFilter = ref('all');
const customDateRange = ref({
  from: '',
  to: ''
});

// Confirmation modal state
const showDeleteModal = ref(false);
const entryToDelete = ref<string | null>(null);

// Check if user is authenticated
onMounted(async () => {
  if (!authStore.isLoggedIn) {
    await router.push(useNuxtApp().$routes.AUTH.LOGIN);
    return;
  }
  
  // Load journal entries for the user
  await loadEntries();
});

// Format date in a readable way
const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
};

// Get date x days ago
const getDateDaysAgo = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
};

// Function to strip HTML from journal entry content and get preview
const getContentPreview = (content: string) => {
  // First sanitize the HTML
  const sanitizedHtml = sanitize(content);
  // Create a temporary div to parse HTML and get text content
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = sanitizedHtml;
  const textContent = tempDiv.textContent || tempDiv.innerText || '';
  // Return truncated text
  return textContent.substring(0, 200) + (textContent.length > 200 ? '...' : '');
};

// Filter entries by date
const filteredEntries = computed(() => {
  if (!entries.value.length) return [];
  
  let today: Date;
  let weekAgo: Date;
  let monthAgo: Date;
  let fromDate: Date | null;
  let toDate: Date | null;
  
  switch (dateFilter.value) {
    case 'today':
      today = new Date();
      today.setHours(0, 0, 0, 0);
      return entries.value.filter(entry => 
        entry.createdAt instanceof Date && entry.createdAt >= today
      );
    case 'week':
      weekAgo = getDateDaysAgo(7);
      return entries.value.filter(entry => 
        entry.createdAt instanceof Date && entry.createdAt >= weekAgo
      );
    case 'month':
      monthAgo = getDateDaysAgo(30);
      return entries.value.filter(entry => 
        entry.createdAt instanceof Date && entry.createdAt >= monthAgo
      );
    case 'custom':
      fromDate = customDateRange.value.from ? new Date(customDateRange.value.from) : null;
      toDate = customDateRange.value.to ? new Date(customDateRange.value.to) : null;
      
      if (fromDate && toDate) {
        // Set end of day for toDate
        const toDateCopy = new Date(toDate);
        toDateCopy.setHours(23, 59, 59, 999);
        
        return entries.value.filter(entry => 
          entry.createdAt instanceof Date && 
          fromDate && entry.createdAt >= fromDate && 
          entry.createdAt <= toDateCopy
        );
      } else if (fromDate) {
        return entries.value.filter(entry => 
          entry.createdAt instanceof Date && 
          fromDate && entry.createdAt >= fromDate
        );
      } else if (toDate) {
        // Create a copy before modifying
        const toDateCopy = new Date(toDate);
        toDateCopy.setHours(23, 59, 59, 999);
        return entries.value.filter(entry => 
          entry.createdAt instanceof Date && 
          toDate && entry.createdAt <= toDateCopy
        );
      }
      return entries.value;
    default:
      return entries.value;
  }
});

// Handle new journal entry creation
const handleNewEntry = () => {
  const { $routes } = useNuxtApp();
  router.push($routes.JOURNAL.NEW);
};

// Handle journal entry viewing
const handleViewEntry = (id: string) => {
  const { $routes } = useNuxtApp();
  router.push($routes.JOURNAL.VIEW(id));
};

// Handle journal entry editing
const handleEditEntry = (event: Event, id: string) => {
  event.stopPropagation();
  const { $routes } = useNuxtApp();
  router.push($routes.JOURNAL.EDIT(id));
};

// Show delete confirmation dialog
const confirmDelete = (event: Event, id: string) => {
  event.stopPropagation();
  entryToDelete.value = id;
  showDeleteModal.value = true;
};

// Handle journal entry deletion
const handleDeleteEntry = async () => {
  if (entryToDelete.value) {
    await deleteEntry(entryToDelete.value);
    showDeleteModal.value = false;
    entryToDelete.value = null;
  }
};

// Cancel deletion
const cancelDelete = () => {
  showDeleteModal.value = false;
  entryToDelete.value = null;
};

// Get class for sentiment circle
const getSentimentClass = (entry: JournalEntry) => {
  if (!entry.sentiments) return 'bg-gray-400 dark:bg-gray-500';
  
  // Calculate average sentiment value
  const values = Object.values(entry.sentiments) as number[];
  if (!values.length) return 'bg-gray-400 dark:bg-gray-500';
  
  const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
  
  if (avg >= 7) return 'bg-green-500';
  if (avg <= 3) return 'bg-red-500';
  return 'bg-yellow-500';
};
</script>

<template>
  <div class="space-y-6 sm:space-y-8 p-4 sm:p-6 bg-gray-50 dark:bg-transparent rounded-lg">

      <!-- Header section and new entry button -->
      <div class="flex items-center justify-between mb-6">
        <h1 class="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white">My Journals</h1>
        <EntryButton 
          class="text-white"
          @click="handleNewEntry"
        >
          <i class="ri-add-line mr-2" />
          New Entry
        </EntryButton>
      </div>
      
      <!-- Filter options -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-6">
        <div class="flex flex-col md:flex-row gap-4 items-end">
          <div class="flex-grow">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Filter by date
            </label>
            <div class="flex flex-wrap gap-2">
              <FilterButton 
                class=""
                :is-active="dateFilter === 'all'"
                @click="dateFilter = 'all'" 
              >
                All
              </FilterButton>
              <FilterButton 
                :is-active="dateFilter === 'today'"
                @click="dateFilter = 'today'" 
              >
                Today
              </FilterButton>
              <FilterButton 
                :is-active="dateFilter === 'week'"
                @click="dateFilter = 'week'" 
              >
                Last 7 days
              </FilterButton>
              <FilterButton 
                :is-active="dateFilter === 'month'"
                @click="dateFilter = 'month'" 
              >
                Last 30 days
              </FilterButton>
              <FilterButton 
                :is-active="dateFilter === 'custom'"
                @click="dateFilter = 'custom'" 
              >
                Custom range
              </FilterButton>
            </div>
          </div>
          
          <div v-if="dateFilter === 'custom'" class="flex flex-col md:flex-row gap-4 w-full md:w-auto">
            <div>
              <label for="from-date" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">From</label>
              <input 
                id="from-date" 
                v-model="customDateRange.from"
                type="date" 
                class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
            </div>
            <div>
              <label for="to-date" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">To</label>
              <input 
                id="to-date" 
                v-model="customDateRange.to"
                type="date" 
                class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
            </div>
          </div>
        </div>
      </div>

      <!-- Loading state -->
      <div v-if="isLoading" class="flex justify-center py-12">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 dark:border-indigo-400" />
      </div>

      <!-- Error message -->
      <div v-if="error" class="mb-4 p-4 bg-red-50 border border-red-200 rounded-md dark:bg-red-900/30 dark:border-red-800">
        <div class="flex">
          <div class="flex-shrink-0">
            <i class="ri-error-warning-line text-red-400 dark:text-red-300" />
          </div>
          <div class="ml-3">
            <h3 class="text-sm font-medium text-red-800 dark:text-red-200">Error</h3>
            <div class="mt-2 text-sm text-red-700 dark:text-red-300">{{ error }}</div>
          </div>
        </div>
      </div>

      <!-- No entries yet message -->
      <div v-if="!isLoading && entries.length === 0" class="text-center py-16 bg-white dark:bg-gray-800 rounded-lg shadow">
        <i class="ri-book-line text-5xl text-gray-400 mb-4" />
        <h3 class="text-lg font-medium text-gray-700 dark:text-gray-300">No journal entries yet</h3>
        <p class="text-gray-500 dark:text-gray-400 mt-2 mb-6">Start writing your thoughts and feelings</p>
        <EntryButton 
          class="mx-auto"
          @click="handleNewEntry"
        >
          <i class="ri-add-line mr-2" />
          Create your first entry
        </EntryButton>
      </div>

      <!-- No matching entries message -->
      <div v-else-if="!isLoading && entries.length > 0 && filteredEntries.length === 0" class="text-center py-16 bg-white dark:bg-gray-800 rounded-lg shadow">
        <i class="ri-filter-off-line text-5xl text-gray-400 mb-4" />
        <h3 class="text-lg font-medium text-gray-700 dark:text-gray-300">No entries match your filter</h3>
        <p class="text-gray-500 dark:text-gray-400 mt-2">Try changing your date filter to see more entries</p>
      </div>

      <!-- Journal entries list -->
      <div v-else-if="!isLoading && filteredEntries.length > 0" class="space-y-4">
        <div 
          v-for="entry in filteredEntries" 
          :key="entry.id" 
          class="bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-md transition-shadow overflow-hidden"
          @click="handleViewEntry(entry.id as string)"
        >
          <div class="p-5 cursor-pointer">
            <div class="flex justify-between items-start">
              <div class="flex items-start space-x-3">
                <div 
                  class="w-3 h-3 rounded-full mt-2 flex-shrink-0" 
                  :class="getSentimentClass(entry)"
                />
                <h3 class="text-xl font-semibold text-gray-800 dark:text-white">{{ entry.title }}</h3>
              </div>
              <div class="text-sm text-gray-500 dark:text-gray-400">
                {{ formatDate(entry.createdAt instanceof Date ? entry.createdAt : new Date()) }}
              </div>
            </div>
            
            <!-- Preview of content (limited characters) -->
            <!-- TODO: componentize this -->
            <div class="mt-3 text-gray-600 dark:text-gray-300 line-clamp-2 prose dark:prose-invert max-w-none ml-6">
              <div>{{ getContentPreview(entry.content) }}</div>
            </div>

            <!-- Tags if present -->
            <div v-if="entry.tags && entry.tags.length > 0" class="mt-3 ml-6 flex flex-wrap gap-2">
              <span 
                v-for="tag in entry.tags.slice(0, 3)" 
                :key="tag"
                class="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full dark:bg-blue-900 dark:text-blue-200"
              >
                {{ tag }}
              </span>
              <span 
                v-if="entry.tags.length > 3" 
                class="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full dark:bg-gray-700 dark:text-gray-300"
              >
                +{{ entry.tags.length - 3 }} more
              </span>
            </div>
          </div>

          <!-- Action buttons -->
          <div class="border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-3 flex justify-end space-x-2">
            <!-- TODO: componentize these buttons -->
            <button 
              type="button"
              class="px-3 py-1 text-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 rounded border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors flex items-center"
              @click="handleViewEntry(entry.id as string)" 
            >
              <i class="ri-eye-line mr-1" />
              Open
            </button>
            <button 
              type="button"
              class="px-3 py-1 text-sm text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-900/30 rounded border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors flex items-center"
              @click="(e) => handleEditEntry(e, entry.id as string)" 
            >
              <i class="ri-edit-line mr-1" />
              Edit
            </button>
            <button 
              type="button"
              class="px-3 py-1 text-sm text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-900/30 rounded border border-red-200 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors flex items-center"
              @click="(e) => confirmDelete(e, entry.id as string)" 
            >
              <i class="ri-delete-bin-line mr-1" />
              Delete
            </button>
          </div>
        </div>
      </div>
  </div>

  <!-- Delete confirmation modal -->
  <div v-if="showDeleteModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-md w-full p-6">
      <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">Confirm Deletion</h3>
      <p class="text-gray-600 dark:text-gray-300 mb-6">Are you sure you want to delete this journal entry? This action cannot be undone.</p>
      
      <div class="flex justify-end space-x-3">
        <button 
          type="button"
          class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
          @click="cancelDelete" 
        >
          Cancel
        </button>
        <button 
          type="button"
          class="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          @click="handleDeleteEntry"
        >
          Delete
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style> 
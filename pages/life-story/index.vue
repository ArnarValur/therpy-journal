<script setup lang="ts">
import { onMounted, ref, computed } from 'vue';
import { useLifeStories } from '~/composables/useLifeStories';
import { useAuthStore } from '~/stores/auth';
import EntryButton from '~/components/buttons/EntryButton.vue';
import OpenButton from '~/components/buttons/OpenButton.vue';
import EditButton from '~/components/buttons/EditButton.vue';
import DeleteButton from '~/components/buttons/DeleteButton.vue';
import { useActionHandler } from '~/composables/useActionHandler';
import { useModalSystem } from '~/composables/useModalSystem';
import type { LifeStoryEntry } from '~/types/lifeStory';
import type { Timestamp } from 'firebase/firestore';
useModalSystem();

// Get the life stories composable
const { lifeStories, pending, isLoading, error, deleteLifeStory } = useLifeStories();

// Get auth store
const authStore = useAuthStore();

// Get router
const router = useRouter();

// Filter state
const granularityFilter = ref('all');
const yearFilter = ref<number | null>(null);
const currentYear = new Date().getFullYear();
const yearOptions = computed(() => {
  const options = [];
  for (let i = currentYear; i >= currentYear - 100; i--) {
    options.push(i);
  }
  return options;
});

// Delete story state
const {
  execute: executeDelete,
  isLoading: isDeleting,
  error: _deleteError,
} = useActionHandler<string, boolean>({
  actionFn: deleteLifeStory,
  confirmation: {
    title: 'Confirm Deletion',
    message: 'Are you sure you want to delete this life story? This action cannot be undone.'
  },
  successMessage: 'Life story deleted successfully',
  errorMessage: 'Failed to delete life story',
  onSuccess: (result, id) => { console.log('Deleted story:', id); },
  onError: (err, id) => { console.error(`Error deleting story ${id}:`, err); }
});

const requestDeleteStory = (event: Event, id: string) => {
  event.stopPropagation();
  executeDelete(id);
};

// Check if user is authenticated
onMounted(async () => {
  if (!authStore.isLoggedIn) {
    await router.push(useNuxtApp().$routes.AUTH.LOGIN);
    return;
  }
});

// Function to convert Timestamp or Date to a JS Date
const ensureDate = (timestamp: Date | Timestamp | null | undefined): Date | null => {
  if (!timestamp) return null;
  
  if (timestamp instanceof Date) return timestamp;
  
  // If it's a Firestore Timestamp
  if ('toDate' in timestamp && typeof timestamp.toDate === 'function') {
    return timestamp.toDate();
  }
  
  return null;
};

// Format date based on granularity
const formatEventDate = (entry: Partial<LifeStoryEntry>): string => {
  if (!entry.eventTimestamp) return 'Unknown date';
  
  const date = ensureDate(entry.eventTimestamp);
  if (!date) return 'Unknown date';
  
  switch (entry.eventGranularity) {
    case 'day':
      return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }).format(date);
    case 'month':
      return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'long'
      }).format(date);
    case 'year':
      return new Intl.DateTimeFormat('en-US', {
        year: 'numeric'
      }).format(date);
    case 'range': {
      // Convert end date
      const endDate = ensureDate(entry.eventEndDate);
      
      if (!endDate) return `From ${formatEventDate({ ...entry, eventGranularity: 'day' })}`;
      
      return `${formatEventDate({ ...entry, eventGranularity: 'day' })} to ${new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }).format(endDate)}`;
    }
    case 'era':
      return entry.eventLabel || 'Unnamed Era';
    default:
      return new Intl.DateTimeFormat('en-US').format(date);
  }
};

// Filtered entries based on selected filters
const filteredEntries = computed(() => {
  if (!lifeStories.value.length) return [];
  
  let filtered = lifeStories.value;
  
  // Filter by granularity
  if (granularityFilter.value !== 'all') {
    filtered = filtered.filter(entry => entry.eventGranularity === granularityFilter.value);
  }
  
  // Filter by year
  if (yearFilter.value) {
    const year = yearFilter.value;
    
    filtered = filtered.filter(entry => {
      if (!entry.eventTimestamp) return false;
      
      const date = ensureDate(entry.eventTimestamp);
      return date ? date.getFullYear() === year : false;
    });
  }
  
  return filtered;
});

// Handle new life story creation
const handleNewStory = () => {
  // Use route constants
  const { $routes } = useNuxtApp();
  router.push($routes.LIFE_STORY.NEW);
};

// Handle life story viewing
const handleViewStory = (id: string) => {
  // Use route constants
  const { $routes } = useNuxtApp();
  router.push($routes.LIFE_STORY.VIEW(id));
};

// Handle life story editing
const handleEditStory = (event: Event, id: string) => {
  event.stopPropagation();
  // Use route constants
  const { $routes } = useNuxtApp();
  router.push($routes.LIFE_STORY.EDIT(id));
};
</script>

<template>
  <div class="space-y-6 sm:space-y-8 p-4 sm:p-6 bg-gray-50 dark:bg-transparent rounded-lg">

    <!-- Header section and new entry button -->
    <div class="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
      <div>
        <h1 class="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white">Life Story</h1>
        <p class="text-gray-600 dark:text-gray-300 mt-1">Record and explore your life journey</p>
      </div>
      <EntryButton 
        class="text-white"
        @click="handleNewStory"
      >
        <i class="ri-add-line mr-2" />
        New Story
      </EntryButton>
    </div>
      
    <!-- Filter options -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-6">
      <div class="flex flex-col md:flex-row gap-4 items-end">
        <div class="flex-grow">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Filter by granularity
          </label>
          <div class="flex flex-wrap gap-2">
            <button 
              :class="[
                'px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
                granularityFilter === 'all' 
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              ]"
              @click="granularityFilter = 'all'" 
            >
              All
            </button>
            <button 
              :class="[
                'px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
                granularityFilter === 'day' 
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              ]"
              @click="granularityFilter = 'day'" 
            >
              Day
            </button>
            <button 
              :class="[
                'px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
                granularityFilter === 'month' 
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              ]"
              @click="granularityFilter = 'month'" 
            >
              Month
            </button>
            <button 
              :class="[
                'px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
                granularityFilter === 'year' 
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              ]"
              @click="granularityFilter = 'year'" 
            >
              Year
            </button>
            <button 
              :class="[
                'px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
                granularityFilter === 'range' 
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              ]"
              @click="granularityFilter = 'range'" 
            >
              Range
            </button>
            <button 
              :class="[
                'px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
                granularityFilter === 'era' 
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              ]"
              @click="granularityFilter = 'era'" 
            >
              Era
            </button>
          </div>
        </div>
        
        <div class="w-full md:w-48">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Year
          </label>
          <select 
            v-model="yearFilter"
            class="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 py-2 px-3 text-sm"
          >
            <option :value="null">All Years</option>
            <option v-for="year in yearOptions" :key="year" :value="year">{{ year }}</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Loading state -->
    <div v-if="isLoading || pending" class="flex justify-center items-center py-12">
      <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>

    <!-- Error state -->
    <div v-else-if="error" class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-center">
      <p class="text-red-700 dark:text-red-400">{{ error.message || 'An error occurred loading your life stories' }}</p>
      <button class="mt-2 text-red-600 dark:text-red-400 underline" @click="error = null">Try Again</button>
    </div>
    
    <!-- Empty state -->
    <div v-else-if="!filteredEntries.length && (!pending && !isLoading)" class="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
      <div class="mx-auto w-24 h-24 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-4">
        <i class="ri-book-open-line text-4xl text-blue-500"></i>
      </div>
      <h3 class="text-xl font-semibold text-gray-800 dark:text-white mb-2">Start Your Life Story</h3>
      <p class="text-gray-600 dark:text-gray-300 mb-6">Record meaningful moments, periods, and eras from your life journey</p>
      <EntryButton @click="handleNewStory">
        <i class="ri-add-line mr-2" />
        Create Your First Entry
      </EntryButton>
    </div>
    
    <!-- Life stories list -->
    <div v-else-if="filteredEntries.length" class="space-y-4">
      <div 
        v-for="entry in filteredEntries" 
        :key="entry.id" 
        class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow cursor-pointer"
        @click="handleViewStory(entry.id)"
      >
        <div class="p-4 sm:p-6">
          <div class="flex items-start justify-between mb-3">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">{{ entry.encryptedTitle }}</h3>
            
            <div class="flex space-x-2">
              <OpenButton @click="handleViewStory(entry.id)" />
              <EditButton @click="(e) => handleEditStory(e, entry.id)" />
              <DeleteButton @click="(e) => requestDeleteStory(e, entry.id)" :is-loading="isDeleting" />
            </div>
          </div>
          
          <div class="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 text-sm text-gray-600 dark:text-gray-300 mb-4">
            <!-- Event date/time period -->
            <div class="flex items-center">
              <i class="ri-calendar-line mr-2 text-gray-400 dark:text-gray-500"></i>
              <span>{{ formatEventDate(entry) }}</span>
            </div>
            
            <!-- Location if available -->
            <div v-if="entry.location?.country || entry.location?.city" class="flex items-center">
              <i class="ri-map-pin-line mr-2 text-gray-400 dark:text-gray-500"></i>
              <span>
                {{ [entry.location.city, entry.location.country].filter(Boolean).join(', ') }}
              </span>
            </div>
          </div>
          
          <!-- Preview of content (truncated) -->
          <p class="text-gray-600 dark:text-gray-300 line-clamp-2">
            {{ entry.encryptedContent }}
          </p>
        </div>
      </div>
    </div>
    
    <!-- No results after filtering -->
    <div v-else class="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
      <p class="text-gray-600 dark:text-gray-300">No life stories match your filters</p>
      <button 
        class="mt-4 text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300"
        @click="granularityFilter = 'all'; yearFilter = null"
      >
        Clear Filters
      </button>
    </div>
  </div>
</template> 
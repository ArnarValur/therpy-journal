<!-- pages/life-story/index.vue -->
<script setup lang="ts">
import { onMounted, ref, computed, watch } from 'vue';
import { useLifeStories } from '~/composables/useLifeStories';
import { useAuthStore } from '~/stores/auth';
import { useActionHandler } from '~/composables/useActionHandler';
import { useModalSystem } from '~/composables/useModalSystem';
import type { LifeStoryEntry } from '~/types/lifeStory';
import type { Timestamp } from 'firebase/firestore';

// Components
import EntryButton from '~/components/buttons/EntryButton.vue';
import OpenButton from '~/components/buttons/OpenButton.vue';
import EditButton from '~/components/buttons/EditButton.vue';
import DeleteButton from '~/components/buttons/DeleteButton.vue';
import FilterButton from '~/components/buttons/FilterButton.vue';
import ConfirmationModal from '~/components/modals/ConfirmationModal.vue';

// Use the modal system to get state and actions
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

// New filter states for different granularities
const dateFilter = ref<string | null>(null);
const monthFilter = ref<string | null>(null);
const startYearFilter = ref<number | null>(null);
const endYearFilter = ref<number | null>(null);
const eraFilter = ref<string | null>(null);

// Compute available eras from life stories
const availableEras = computed(() => {
  const eras = new Set<string>();
  lifeStories.value.forEach(entry => {
    if (entry.eventGranularity === 'era' && entry.eventLabel) {
      eras.add(entry.eventLabel);
    }
  });
  return Array.from(eras);
});

const yearOptions = computed(() => {
  // Use the year range computed from the life stories
  if (!yearRange.value) return [];
  const options = [];
  for (let year = yearRange.value.max; year >= yearRange.value.min; year--) {
    options.push(year);
  }
  return options;
});

// Compute a set of unique years from the life stories
const entryYears = computed(() => {
  const years = new Set<number>();
  lifeStories.value.forEach(entry => {
    const date = ensureDate(entry.eventTimestamp);
    if (date) {
      years.add(date.getFullYear());
    }
    // Check eventEndDate if granularity is range
    if (entry.eventGranularity === 'range' && entry.eventEndDate) {
      const endDate = ensureDate(entry.eventEndDate);
      if (endDate) {
        years.add(endDate.getFullYear());
      }
    }
  });
  return years;
});

// Compute the minimum and maximum years from available entry years
const yearRange = computed(() => {
  if (entryYears.value.size === 0) 
  return null;

  const yearsArray = Array.from(entryYears.value);
  return {
    min: Math.min(...yearsArray),
    max: Math.max(...yearsArray)
  };
});

// Reset all filters when granularity changes
watch(granularityFilter, () => {
  yearFilter.value = null;
  dateFilter.value = null;
  monthFilter.value = null;
  startYearFilter.value = null;
  endYearFilter.value = null;
  eraFilter.value = null;
});

// Delete story state
const {
  execute: executeDelete,
  isLoading: isDeleting,
  error: deleteError,
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

// Request delete story
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

// Helper to parse date string to Date object
const getDateFromString = (dateString: string | null): Date | null => {
  if (!dateString) return null;
  return new Date(dateString);
};

// Helper to extract year and month from date string (format: YYYY-MM)
const getYearMonthFromString = (monthString: string | null): { year: number, month: number } | null => {
  if (!monthString) return null;
  const [year, month] = monthString.split('-').map(Number);
  if (isNaN(year) || isNaN(month)) return null;
  return { year, month: month - 1 }; // Month is 0-indexed in JavaScript Date
};

// Filtered entries based on selected filters
const filteredEntries = computed(() => {
  if (!lifeStories.value.length) return [];
  
  let filtered = lifeStories.value;
  
  // If "all" is selected, we don't filter by granularity type
  // Instead, we only filter based on the active filter controls
  switch (granularityFilter.value) {
    case 'all':
      // No filtering by granularity
      break;
      
    case 'day': 
      if (dateFilter.value) {
        const selectedDate = getDateFromString(dateFilter.value);
        if (selectedDate) {
          // Set time to beginning of day for comparison
          selectedDate.setHours(0, 0, 0, 0);
          
          filtered = filtered.filter(entry => {
            // Check if the entry's date matches the selected date
            const startDate = ensureDate(entry.eventTimestamp);
            if (!startDate) return false;
            
            // For single date entries, check exact match
            if (!entry.eventEndDate) {
              return startDate.getFullYear() === selectedDate.getFullYear() &&
                    startDate.getMonth() === selectedDate.getMonth() &&
                    startDate.getDate() === selectedDate.getDate();
            }
            
            // For range entries, check if selected date falls within the range
            const endDate = ensureDate(entry.eventEndDate);
            if (!endDate) return false;
            
            // Make copies to avoid modifying original date references
            const startCopy = new Date(startDate);
            const endCopy = new Date(endDate);
            
            // Set times to beginning and end of day for proper comparison
            startCopy.setHours(0, 0, 0, 0);
            endCopy.setHours(23, 59, 59, 999);
            
            return selectedDate >= startCopy && selectedDate <= endCopy;
          });
        }
      }
      break;
      
    case 'month':
      if (monthFilter.value) {
        const selectedYearMonth = getYearMonthFromString(monthFilter.value);
        if (selectedYearMonth) {
          filtered = filtered.filter(entry => {
            const startDate = ensureDate(entry.eventTimestamp);
            if (!startDate) return false;
            
            // Create a date object for the first day of the selected month
            const selectedMonthStart = new Date(selectedYearMonth.year, selectedYearMonth.month, 1);
            
            // Create a date object for the first day of the next month
            const selectedMonthEnd = new Date(selectedYearMonth.year, selectedYearMonth.month + 1, 0);
            selectedMonthStart.setHours(0, 0, 0, 0);
            selectedMonthEnd.setHours(23, 59, 59, 999);
            
            // For single date entries
            if (!entry.eventEndDate) {
              return startDate.getFullYear() === selectedYearMonth.year &&
                    startDate.getMonth() === selectedYearMonth.month;
            }
            
            // For range entries, check if any part of the range overlaps with the selected month
            const endDate = ensureDate(entry.eventEndDate);
            if (!endDate) return false;
            
            // Check if the range overlaps with the selected month
            return (
              // Either the entry starts within the month
              (startDate >= selectedMonthStart && startDate <= selectedMonthEnd) ||
              // Or the entry ends within the month
              (endDate >= selectedMonthStart && endDate <= selectedMonthEnd) ||
              // Or the entry spans over the month
              (startDate <= selectedMonthStart && endDate >= selectedMonthEnd)
            );
          });
        }
      }
      break;
      
    case 'year':
      if (yearFilter.value !== null) {
        const selectedYear = yearFilter.value;
        filtered = filtered.filter(entry => {
          if (!entry.eventTimestamp) return false;
          
          const startDate = ensureDate(entry.eventTimestamp);
          if (!startDate) return false;
          
          // For single date entries
          if (!entry.eventEndDate) {
            return startDate.getFullYear() === selectedYear;
          }
          
          // For range entries, check if the selectedYear falls within the range
          const endDate = ensureDate(entry.eventEndDate);
          if (!endDate) return false;
          
          return (
            // Either the start year is our year
            startDate.getFullYear() === selectedYear ||
            // Or the end year is our year
            endDate.getFullYear() === selectedYear ||
            // Or our year is between start and end
            (startDate.getFullYear() < selectedYear && endDate.getFullYear() > selectedYear)
          );
        });
      }
      break;
      
    case 'range':
      if (startYearFilter.value !== null || endYearFilter.value !== null) {
        filtered = filtered.filter(entry => {
          if (!entry.eventTimestamp) return false;
          
          const entryStartDate = ensureDate(entry.eventTimestamp);
          const entryEndDate = entry.eventEndDate ? ensureDate(entry.eventEndDate) : entryStartDate;
          
          if (!entryStartDate || !entryEndDate) return false;
          
          const entryStartYear = entryStartDate.getFullYear();
          const entryEndYear = entryEndDate.getFullYear();
          
          // If only start year is provided
          if (startYearFilter.value !== null && endYearFilter.value === null) {
            return entryEndYear >= startYearFilter.value;
          }
          
          // If only end year is provided
          if (startYearFilter.value === null && endYearFilter.value !== null) {
            return entryStartYear <= endYearFilter.value;
          }
          
          // If both are provided, check for any overlap between the ranges
          return (
            // The entry's range overlaps with or is contained in our filter range
            (entryStartYear <= endYearFilter.value! && entryEndYear >= startYearFilter.value!)
          );
        });
      }
      break;
      
    case 'era':
      if (eraFilter.value) {
        filtered = filtered.filter(entry => entry.eventLabel === eraFilter.value);
      }
      break;
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
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-6 border border-gray-100 dark:border-gray-700">
      <div class="flex flex-col md:flex-row gap-4 items-end">
        <div class="flex-grow">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Filter by granularity
          </label>
          <div class="flex flex-wrap gap-2">
            <FilterButton 
              :is-active="granularityFilter === 'all'"
              @click="granularityFilter = 'all'" 
            >
              All
            </FilterButton>
            <FilterButton 
              :is-active="granularityFilter === 'day'"
              @click="granularityFilter = 'day'" 
            >
              Day
            </FilterButton>
            <FilterButton 
              :is-active="granularityFilter === 'month'"
              @click="granularityFilter = 'month'" 
            >
              Month
            </FilterButton>
            <FilterButton 
              :is-active="granularityFilter === 'year'"
              @click="granularityFilter = 'year'" 
            >
              Year
            </FilterButton>
            <FilterButton 
              :is-active="granularityFilter === 'range'"
              @click="granularityFilter = 'range'" 
            >
              Range
            </FilterButton>
            <FilterButton 
              :is-active="granularityFilter === 'era'"
              @click="granularityFilter = 'era'" 
            >
              Era
            </FilterButton>
          </div>
        </div>
        
        <!-- Dynamic filter inputs based on selected granularity -->
        <div v-if="granularityFilter !== 'all'" class="w-full md:w-auto">
          <!-- Day filter - date picker -->
          <div v-if="granularityFilter === 'day'" class="w-full md:w-48">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Select Date
            </label>
            <input 
              v-model="dateFilter"
              type="date" 
              class="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 py-2 px-3 text-sm"
            >
          </div>
          
          <!-- Month filter - month picker -->
          <div v-else-if="granularityFilter === 'month'" class="w-full md:w-48">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Select Month
            </label>
            <input 
              v-model="monthFilter"
              type="month" 
              class="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 py-2 px-3 text-sm"
            >
          </div>
          
          <!-- Year filter - year dropdown -->
          <div v-else-if="granularityFilter === 'year'" class="w-full md:w-48">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Select Year
            </label>
            <select 
              v-model="yearFilter"
              class="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 py-2 px-3 text-sm"
            >
              <option :value="null">All Years</option>
              <option v-for="year in yearOptions" :key="year" :value="year">{{ year }}</option>
            </select>
          </div>
          
          <!-- Range filter - start and end year -->
          <div v-else-if="granularityFilter === 'range'" class="w-full flex flex-col md:flex-row gap-2">
            <div class="w-full md:w-32">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                From Year
              </label>
              <select 
                v-model="startYearFilter"
                class="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 py-2 px-3 text-sm"
              >
                <option :value="null">Any</option>
                <option v-for="year in yearOptions" :key="year" :value="year">{{ year }}</option>
              </select>
            </div>
            <div class="w-full md:w-32">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                To Year
              </label>
              <select 
                v-model="endYearFilter"
                class="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 py-2 px-3 text-sm"
              >
                <option :value="null">Any</option>
                <option v-for="year in yearOptions" :key="year" :value="year">{{ year }}</option>
              </select>
            </div>
          </div>
          
          <!-- Era filter - era dropdown -->
          <div v-else-if="granularityFilter === 'era'" class="w-full md:w-48">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Select Era
            </label>
            <select 
              v-model="eraFilter"
              class="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 py-2 px-3 text-sm"
            >
              <option :value="null">All Eras</option>
              <option v-for="era in availableEras" :key="era" :value="era">{{ era }}</option>
            </select>
          </div>
        </div>
      </div>
    </div>

    <!-- Loading state -->
    <div v-if="isLoading || pending" class="flex justify-center items-center py-12">
      <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500" />
    </div>

    <!-- Error message -->
    <div v-else-if="error" class="mb-4 p-4 bg-red-50 border border-red-200 rounded-md dark:bg-red-900/30 dark:border-red-800">
      <p class="text-red-700 dark:text-red-400">{{ error.message || 'An error occurred loading your life stories' }}</p>
      <button class="mt-2 text-red-600 dark:text-red-400 underline" @click="error = null">Try Again</button>
    </div>
    
    <!-- No stories yet message -->
    <div v-else-if="!filteredEntries.length && (!pending && !isLoading)" class="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center border border-gray-100 dark:border-gray-700">
      <div class="mx-auto w-24 h-24 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-4">
        <i class="ri-book-open-line text-4xl text-blue-500" />
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
        class="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow overflow-hidden"
      >

        <!-- Life Story Card -->
        <div class="p-5 sm:p-6">
          <!-- Title -->
          <div class="flex items-start justify-between mb-3">
            <div class="flex items-center gap-2">
              <h3 class="text-xl font-semibold text-gray-800 dark:text-white">{{ entry.title }}</h3>
              
              <!-- Draft tag -->
              <span 
                v-if="entry.isDraft" 
                class="inline-flex items-center px-2.5 py-0.5 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full dark:bg-yellow-900/30 dark:text-yellow-300"
              >
                <i class="ri-draft-line mr-1" />
                Draft
              </span>
            </div>
          </div>

          <!-- Date and Location -->
          <div class="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 text-sm text-gray-500 dark:text-gray-400">
            <!-- Event date/time period -->
            <div class="flex items-center">
              <i class="ri-calendar-line mr-2 text-gray-400 dark:text-gray-500" />
              <span>{{ formatEventDate(entry) }}</span>
            </div>
            
            <!-- Location if available -->
            <div v-if="entry.location?.country || entry.location?.city" class="flex items-center">
              <i class="ri-map-pin-line mr-2 text-gray-400 dark:text-gray-500" />
              <span>
                {{ [entry.location.city, entry.location.country].filter(Boolean).join(', ') }}
              </span>
            </div>
          </div>
          
          <!-- Preview of content (truncated) -->
          <div class="mt-3 text-gray-600 dark:text-gray-300 line-clamp-2 prose dark:prose-invert max-w-none">
            <div v-html="entry.content" />
          </div>
        </div>

        <!-- Action buttons -->
        <div class="border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-3 flex justify-end space-x-2">
          <OpenButton 
            @click="handleViewStory(entry.id as string)" 
          >
            <i class="ri-eye-line mr-1" />
            Open
          </OpenButton>
          <EditButton 
            @click="(e) => handleEditStory(e, entry.id as string)" 
          >
            <i class="ri-edit-line mr-1" />
            Edit
          </EditButton>
          <DeleteButton 
            :disabled="isDeleting"
            @click="(e) => requestDeleteStory(e, entry.id as string)"
          >
            <i v-if="!isDeleting" class="ri-delete-bin-line mr-1" />
            <i v-else class="ri-loader-line animate-spin mr-1" />
            {{ isDeleting ? 'Deleting...' : 'Delete' }}
          </DeleteButton>
        </div>
        <div v-if="deleteError && !isDeleting" class="text-red-500 text-sm p-3">
          {{ deleteError.message }}
        </div>
      </div>
    </div>
    
    <!-- No results after filtering -->
    <div v-else class="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center border border-gray-100 dark:border-gray-700">
      <p class="text-gray-600 dark:text-gray-300">No life stories match your filters</p>
      <button 
        class="mt-4 text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300"
        @click="granularityFilter = 'all'; yearFilter = null; dateFilter = null; monthFilter = null; startYearFilter = null; endYearFilter = null; eraFilter = null;"
      >
        Clear Filters
      </button>
    </div>
  </div>

  <!-- Confirmation modal -->
  <ConfirmationModal />
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
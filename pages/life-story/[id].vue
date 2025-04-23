<script setup lang="ts">
import { onMounted, ref, computed, watch } from 'vue';
import { useLifeStories } from '~/composables/useLifeStories';
import { useAuthStore } from '~/stores/auth';
import type { Timestamp } from 'firebase/firestore';
import EditButton from '~/components/buttons/EditButton.vue';
import DeleteButton from '~/components/buttons/DeleteButton.vue';
import BackButton from '~/components/buttons/BackButton.vue';

// Get router and route configurations
const router = useRouter();
const route = useRoute();
const { $routes } = useNuxtApp();

// Get story ID from route params
const storyId = computed(() => route.params.id as string);

// Get auth store and life stories composable
const authStore = useAuthStore();
const { lifeStories, deleteLifeStory, error, pending } = useLifeStories();

// Component state
const isDeleting = ref(false);
const deleteError = ref<string | null>(null);
const isLoading = ref(true);
const loadError = ref<string | null>(null);

// Get the current life story data
const currentStory = computed(() => {
  if (!lifeStories.value || !storyId.value) return null;
  return lifeStories.value.find(story => story.id === storyId.value);
});

// Watch for data loading completion
watch(pending, (isPending) => {
  if (!isPending) {
    isLoading.value = false;
    
    // Verify the story exists
    if (!currentStory.value) {
      loadError.value = 'Life story not found';
    }
  }
});

// Check if user is authenticated and story exists
onMounted(async () => {
  if (!authStore.isLoggedIn) {
    await router.push($routes.AUTH.LOGIN);
    return;
  }
});

// Helper to format dates based on granularity
const formatDate = (timestamp: Timestamp | null | undefined, granularity: string): string => {
  if (!timestamp) return 'Unknown date';
  
  const date = timestamp instanceof Date ? timestamp : timestamp.toDate();
  
  switch (granularity) {
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
    case 'era':
      return currentStory.value?.eventLabel || 'Unnamed Era';
    default:
      return new Intl.DateTimeFormat('en-US').format(date);
  }
};

// Format event date based on granularity
const formattedEventDate = computed(() => {
  if (!currentStory.value) return '';
  
  const { eventTimestamp, eventGranularity, eventEndDate, eventLabel } = currentStory.value;
  
  if (eventGranularity === 'range' && eventEndDate) {
    return `${formatDate(eventTimestamp, 'day')} to ${formatDate(eventEndDate, 'day')}`;
  } else if (eventGranularity === 'era') {
    return eventLabel || 'Unnamed Era';
  } else {
    return formatDate(eventTimestamp, eventGranularity);
  }
});

// Handle edit
const handleEdit = () => {
  if (!storyId.value) return;
  router.push($routes.LIFE_STORY.EDIT(storyId.value));
};

// Handle delete
const handleDelete = async () => {
  if (!storyId.value || !confirm('Are you sure you want to delete this life story? This action cannot be undone.')) return;
  
  isDeleting.value = true;
  deleteError.value = null;
  
  try {
    const success = await deleteLifeStory(storyId.value);
    
    if (success) {
      // Redirect to the life stories list page
      await router.push($routes.LIFE_STORY.HOME);
    } else {
      deleteError.value = 'Failed to delete life story. Please try again.';
    }
  } catch (err) {
    console.error('Error deleting life story:', err);
    deleteError.value = error.value?.message || 'An unexpected error occurred.';
  } finally {
    isDeleting.value = false;
  }
};

// Handle back
const handleBack = () => {
  router.push($routes.LIFE_STORY.HOME);
};
</script>

<template>
  <div class="container px-4 py-8 mx-auto">
    <!-- Loading state -->
    <div v-if="isLoading" class="p-8 text-center">
      <div class="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4" />
      <p class="text-lg">Loading life story...</p>
    </div>
    
    <!-- Error state -->
    <div v-else-if="loadError" class="p-6 bg-danger/10 rounded-lg border border-danger/20 text-danger">
      <h3 class="text-lg font-medium mb-2">Error</h3>
      <p>{{ loadError }}</p>
      <div class="mt-4">
        <button 
          class="px-4 py-2 bg-primary text-white rounded-md"
          @click="handleBack">
          Back to Life Stories
        </button>
      </div>
    </div>
    
    <!-- Life story content -->
    <div v-else-if="currentStory" class="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden border border-gray-100 dark:border-gray-700">
      <!-- Header with actions -->
      <div class="p-6 border-b border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">{{ currentStory.Title }}</h1>
          <div class="flex flex-wrap items-center gap-x-6 gap-y-2 mt-2 text-sm text-gray-500 dark:text-gray-400">
            <!-- Time period -->
            <div class="flex items-center">
              <i class="ri-calendar-line mr-2" />
              <span>{{ formattedEventDate }}</span>
            </div>
            
            <!-- Location if available -->
            <div v-if="currentStory.location?.country || currentStory.location?.city" class="flex items-center">
              <i class="ri-map-pin-line mr-2" />
              <span>
                {{ [currentStory.location.city, currentStory.location.country].filter(Boolean).join(', ') }}
              </span>
            </div>
          </div>
        </div>
        
        
      </div>
      
      <!-- Content -->
      <div class="p-6">
        <!-- Content rendered as HTML -->
        <div class="prose dark:prose-invert max-w-none" v-html="currentStory.Content" />
        
        <!-- Delete error message if any -->
        <div v-if="deleteError" class="mt-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded">
          <p class="text-red-700 dark:text-red-400">{{ deleteError }}</p>
        </div>
        
        <!-- Location details -->
        <div v-if="currentStory.location?.Details" class="mt-8 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">Location Details</h3>
          <p class="text-gray-700 dark:text-gray-300">{{ currentStory.location.Details }}</p>
        </div>
        
        <!-- Custom fields -->
        <div v-if="currentStory.customFields && currentStory.customFields.length > 0" class="mt-8">
          <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">Additional Information</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div 
              v-for="field in currentStory.customFields" 
              :key="field.fieldName"
              class="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg"
            >
              <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{{ field.fieldName }}</h4>
              <p class="text-gray-900 dark:text-white">{{ field.Value }}</p>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Footer -->
      <div class="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex justify-between">
        <BackButton 
          class=""
          @click="handleBack"
        >
          <i class="ri-arrow-left-line mr-2" />
          Back to Life Stories
        </BackButton>
        <div class="flex space-x-3">
          <EditButton 
            class=""
            @click="handleEdit"
          >
            <i class="ri-edit-line mr-2" />
            Edit Story
          </EditButton>
          
          <DeleteButton 
            class=""
            :disabled="isDeleting"
            @click="handleDelete"
          >
            <i v-if="!isDeleting" class="ri-delete-bin-line mr-2" />
            <i v-else class="ri-loader-4-line animate-spin mr-2" />
            {{ isDeleting ? 'Deleting...' : 'Delete Story' }}
          </DeleteButton>
        </div>
      </div>
    </div>
    
    <!-- Fallback for no story found -->
    <div v-else class="p-6 bg-warning/10 rounded-lg border border-warning/20">
      <p class="mb-4">Life story not found or it may have been deleted.</p>
      <button 
        class="px-4 py-2 bg-primary text-white rounded-md"
        @click="handleBack">
        Back to Life Stories
      </button>
    </div>
  </div>
</template> 
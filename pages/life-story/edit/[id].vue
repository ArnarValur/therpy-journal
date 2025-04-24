<script setup lang="ts">
import { onMounted, ref, computed, watch } from 'vue';
import { useLifeStories } from '~/composables/useLifeStories';
import { useAuthStore } from '~/stores/auth';
import { tryOnBeforeUnmount } from '@vueuse/core';
import LifeStoryForm from '~/components/form/LifeStoryForm.vue';
import type { 
  LifeStoryEntry, 
  LifeStoryGranularity, 
  LifeStoryLocation, 
  CustomField 
} from '~/types/lifeStory';
import { useAutosave } from '~/composables/useAutosave';
import type { Timestamp } from 'firebase/firestore';

// Get router and route configurations
const router = useRouter();
const route = useRoute();
const { $routes } = useNuxtApp();

// Get story ID from route params
const storyId = computed(() => route.params.id as string);

// Get auth store and life stories composable
const authStore = useAuthStore();
const { lifeStories, updateLifeStory, error, pending } = useLifeStories();

// Error message for user display
const errorMessage = computed(() => {
  if (error.value instanceof Error) {
    return error.value.message;
  }
  return null;
});

// Component state
const isSubmitting = ref(false);
const submissionError = ref<string | null>(null);
const isLoading = ref(true);
const loadError = ref<string | null>(null);

// Get the current life story data
const currentStory = computed(() => {
  if (!lifeStories.value || !storyId.value) return null;
  return lifeStories.value.find(story => story.id === storyId.value);
});

// Define the form data interface
interface LifeStoryFormData {
  title?: string;
  content?: string;
  eventDate?: Timestamp;
  granularity?: LifeStoryGranularity;
  endDate?: Timestamp | null;
  label?: string | null;
  location?: LifeStoryLocation | null;
  customFields?: CustomField[] | null;
}

// Create the save function for the autosave composable
const saveLifeStory = async (data: Partial<LifeStoryFormData>, isDraft: boolean): Promise<string | boolean | null> => {
  if (!storyId.value) return false;
  
  const formattedData: Partial<Omit<LifeStoryEntry, 'id' | 'userId' | 'createdAt' | 'updatedAt'>> = {
    Title: data.title,
    Content: data.content,
    eventTimestamp: data.eventDate,
    eventGranularity: data.granularity,
    eventEndDate: data.endDate || null,
    eventLabel: data.label || null,
    location: data.location || null,
    customFields: data.customFields || null,
    isDraft
  };
  
  try {
    const success = await updateLifeStory(storyId.value, formattedData);
    return success ? storyId.value : false;
  } catch (err) {
    console.error('Error saving life story:', err);
    return false;
  }
};

// Initialize the autosave composable
const autosave = useAutosave<Partial<LifeStoryFormData>>({
  initialData: {},
  saveFn: saveLifeStory,
  debounceMs: 2000,
  entityId: storyId
});

// Watch for data loading completion
watch(pending, (isPending) => {
  if (!isPending) {
    isLoading.value = false;
    
    // Verify the story exists
    if (!currentStory.value) {
      loadError.value = 'Life story not found';
    } else {
      // Initialize the autosave with the loaded data
      autosave.setOriginalData({
        title: currentStory.value.Title,
        content: currentStory.value.Content,
        eventDate: currentStory.value.eventTimestamp,
        granularity: currentStory.value.eventGranularity,
        endDate: currentStory.value.eventEndDate,
        label: currentStory.value.eventLabel,
        location: currentStory.value.location,
        customFields: currentStory.value.customFields
      });
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

// Handle form submission
const handleSubmit = async (formData: Omit<LifeStoryEntry, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
  if (!storyId.value) return;
  
  isSubmitting.value = true;
  submissionError.value = null;
  
  try {
    const success = await autosave.saveData({
      title: formData.Title,
      content: formData.Content,
      eventDate: formData.eventTimestamp,
      granularity: formData.eventGranularity,
      endDate: formData.eventEndDate,
      label: formData.eventLabel,
      location: formData.location,
      customFields: formData.customFields
    }, false);
    
    if (success) {
      // Redirect to the life story view page
      await router.push($routes.LIFE_STORY.VIEW(storyId.value));
    } else {
      submissionError.value = 'Failed to update life story. Please try again.';
    }
  } catch (err) {
    console.error('Error updating life story:', err);
    submissionError.value = errorMessage.value ?? 'An unexpected error occurred.';
  } finally {
    isSubmitting.value = false;
    autosave.finishSaving();
  }
};

// Handle form updates for autosave
const handleFormUpdate = (formData: Omit<LifeStoryEntry, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
  autosave.updateFormData({
    title: formData.Title,
    content: formData.Content,
    eventDate: formData.eventTimestamp,
    granularity: formData.eventGranularity,
    endDate: formData.eventEndDate,
    label: formData.eventLabel,
    location: formData.location,
    customFields: formData.customFields
  });
};

// Handle cancel
const handleCancel = async () => {
  // Will only save as draft if changes were made
  await autosave.saveAsDraft();
  
  if (storyId.value) {
    router.push($routes.LIFE_STORY.VIEW(storyId.value));
  } else {
    router.push($routes.LIFE_STORY.HOME);
  }
};

// Clean up before component unmount
tryOnBeforeUnmount(async () => {
  // Will only save as draft if changes were made
  await autosave.saveAsDraft();
});
</script>

<template>
  <div class="container px-4 py-8 mx-auto">
    <div class="flex items-center gap-2 mb-6">
      <h1 class="text-2xl font-bold">Edit Life Story</h1>
      <span 
        v-if="autosave.dataHasChanged.value"
        class="inline-flex items-center px-2.5 py-0.5 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full dark:bg-yellow-900/30 dark:text-yellow-300"
      >
        <i class="ri-draft-line mr-1" />
        Draft
      </span>
    </div>
    
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
          @click="() => router.push($routes.LIFE_STORY.HOME)">
          Back to Life Stories
        </button>
      </div>
    </div>
    
    <!-- Form -->
    <div v-else-if="currentStory">
      <LifeStoryForm 
        :initial-data="currentStory" 
        :is-submitting="isSubmitting"
        :is-autosaving="autosave.isAutosaving.value"
        :last-autosave-time="autosave.lastAutosaveTime.value"
        @submit="handleSubmit"
        @update="handleFormUpdate"
        @cancel="handleCancel"
      />
      
      <!-- Show submission error if any -->
      <div v-if="submissionError" class="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
        <p class="text-red-700 dark:text-red-400">{{ submissionError }}</p>
      </div>
    </div>
    
    <!-- Fallback for no story found -->
    <div v-else class="p-6 bg-warning/10 rounded-lg border border-warning/20">
      <p class="mb-4">Life story not found or it may have been deleted.</p>
      <button 
        class="px-4 py-2 bg-primary text-white rounded-md"
        @click="() => router.push($routes.LIFE_STORY.HOME)">
        Back to Life Stories
      </button>
    </div>
  </div>
</template> 
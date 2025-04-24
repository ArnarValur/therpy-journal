<script setup lang="ts">
import { onMounted, ref, computed } from 'vue';
import { useLifeStories } from '~/composables/useLifeStories';
import { useAuthStore } from '~/stores/auth';
import { tryOnBeforeUnmount } from '@vueuse/core';
import LifeStoryForm from '~/components/form/LifeStoryForm.vue';
import type { LifeStoryEntry, LifeStoryGranularity, LifeStoryLocation, CustomField } from '~/types/lifeStory';
import { useAutosave, type AutosavableData } from '~/composables/useAutosave';
import type { Timestamp } from 'firebase/firestore';

// Get router and route configurations
const router = useRouter();
const { $routes } = useNuxtApp();

// Get auth store and life stories composable
const authStore = useAuthStore();
const { addLifeStory, updateLifeStory, error: lifeStoryError } = useLifeStories();

// Error message for user display
const errorMessage = computed(() => {
  if (lifeStoryError.value instanceof Error) {
    return lifeStoryError.value.message;
  }
  return null;
});

// Define type for life story data
interface LifeStoryFormData extends AutosavableData {
  title: string;
  content: string;
  eventDate: Timestamp;
  granularity: LifeStoryGranularity;
  endDate?: Timestamp | null;
  label?: string | null;
  location?: LifeStoryLocation | null;
  customFields?: CustomField[] | null;
}

// Create the save function for the autosave composable
const saveLifeStory = async (data: Partial<LifeStoryFormData>, isDraft = false): Promise<string | boolean | null> => {
  if (!authStore.user) return null;
  
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
    if (autosave.entityId.value) {
      const success = await updateLifeStory(autosave.entityId.value, formattedData);
      return success ? autosave.entityId.value : false;
    } else {
      const result = await addLifeStory(formattedData as Omit<LifeStoryEntry, 'id' | 'userId' | 'createdAt' | 'updatedAt'>);
      if (result?.id) {
        autosave.entityId.value = result.id;
        return result.id;
      }
      return false;
    }
  } catch (err) {
    console.error('Error saving life story:', err);
    return false;
  }
};

// Initialize the autosave composable
const autosave = useAutosave<Partial<LifeStoryFormData>>({
  initialData: {
    title: '',
    content: '',
    granularity: 'day' as LifeStoryGranularity,
    label: null,
    location: null,
    customFields: null
  },
  saveFn: saveLifeStory,
  debounceMs: 2000
});

// Submission state
const isSubmitting = ref(false);
const submissionError = ref<string | null>(null);

// Check if user is authenticated
onMounted(async () => {
  if (!authStore.isLoggedIn) {
    await router.push($routes.AUTH.LOGIN);
    return;
  }
  
  // Set the original data for proper change tracking
  autosave.setOriginalData(autosave.formData.value);
});

// Handle form submission
const handleSubmit = async (formData: Omit<LifeStoryEntry, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
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
      // If we have an ID, navigate to that story's page
      if (typeof success === 'string' || autosave.entityId.value) {
        const id = typeof success === 'string' ? success : autosave.entityId.value;
        await router.push($routes.LIFE_STORY.VIEW(id as string));
      } else {
        await router.push($routes.LIFE_STORY.HOME);
      }
    } else {
      submissionError.value = 'Failed to create life story. Please try again.';
    }
  } catch (err) {
    console.error('Error creating life story:', err);
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
  router.push($routes.LIFE_STORY.HOME);
};

// Add cleanup to ensure drafts are saved when navigating away
tryOnBeforeUnmount(async () => {
  // Will only save as draft if changes were made
  await autosave.saveAsDraft();
});
</script>

<template>
  <div class="space-y-6 sm:space-y-8 p-4 sm:p-6 bg-gray-50 dark:bg-transparent rounded-lg">

    <!-- Header section and new entry button -->
    <div class="flex items-center justify-between mb-6">
      <div class="flex items-center gap-2">
        <h1 class="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white">New Life Story</h1>
        <span 
          v-if="autosave.dataHasChanged.value"
          class="inline-flex items-center px-2.5 py-0.5 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full dark:bg-yellow-900/30 dark:text-yellow-300"
        >
          <i class="ri-draft-line mr-1" />
          Draft
        </span>
      </div>
    </div>
    
    <!-- Error message -->
    <div v-if="submissionError" class="mb-4 p-4 bg-red-50 border border-red-200 rounded-md dark:bg-red-900/30 dark:border-red-800">
      <div class="flex">
        <div class="flex-shrink-0">
          <i class="ri-error-warning-line text-red-400 dark:text-red-300" />
        </div>
        <div class="ml-3">
          <h3 class="text-sm font-medium text-red-800 dark:text-red-200">Error</h3>
          <div class="mt-2 text-sm text-red-700 dark:text-red-300">
            {{ submissionError }}
          </div>
        </div>
      </div>
    </div>
    
    <!-- Life Story form -->
    <LifeStoryForm 
      :is-submitting="isSubmitting"
      :is-autosaving="autosave.isAutosaving.value"
      :last-autosave-time="autosave.lastAutosaveTime.value"
      @submit="handleSubmit" 
      @update="handleFormUpdate"
      @cancel="handleCancel" 
    />
  </div>
</template> 
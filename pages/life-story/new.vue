<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useLifeStories } from '~/composables/useLifeStories';
import { useAuthStore } from '~/stores/auth';
import LifeStoryForm from '~/components/form/LifeStoryForm.vue';
import type { LifeStoryEntry } from '~/types/lifeStory';

// Get router and route configurations
const router = useRouter();
const { $routes } = useNuxtApp();

// Get auth store and life stories composable
const authStore = useAuthStore();
const { addLifeStory, error } = useLifeStories();

// Submission state
const isSubmitting = ref(false);
const submissionError = ref<string | null>(null);

// Check if user is authenticated
onMounted(async () => {
  if (!authStore.isLoggedIn) {
    await router.push($routes.AUTH.LOGIN);
    return;
  }
});

// Handle form submission
const handleSubmit = async (formData: Omit<LifeStoryEntry, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
  isSubmitting.value = true;
  submissionError.value = null;
  
  try {
    const result = await addLifeStory(formData);
    
    if (result && result.id) {
      // Redirect to the life story view page
      await router.push($routes.LIFE_STORY.VIEW(result.id));
    } else {
      submissionError.value = 'Failed to create life story. Please try again.';
    }
  } catch (err) {
    console.error('Error creating life story:', err);
    submissionError.value = error.value?.message || 'An unexpected error occurred.';
  } finally {
    isSubmitting.value = false;
  }
};

// Handle cancel
const handleCancel = () => {
  router.push($routes.LIFE_STORY.HOME);
};
</script>

<template>
  <div class="space-y-6 sm:space-y-8 p-4 sm:p-6 bg-gray-50 dark:bg-transparent rounded-lg">

    <!-- Header section and new entry button -->
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white">New Life Story</h1>
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
    
    <!-- Life Story form -->
    <LifeStoryForm 
      :is-submitting="isSubmitting" 
      @submit="handleSubmit" 
      @cancel="handleCancel" 
    />
  </div>
</template> 
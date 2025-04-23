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
    <div class="flex items-center justify-between">
      <h1 class="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white">New Life Story</h1>
    </div>
    
    <!-- Display error if any -->
    <div v-if="submissionError" class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 rounded-lg">
      <p class="text-red-700 dark:text-red-400">{{ submissionError }}</p>
    </div>
    
    <!-- Life Story form -->
    <LifeStoryForm 
      :is-submitting="isSubmitting" 
      @submit="handleSubmit" 
      @cancel="handleCancel" 
    />
  </div>
</template> 
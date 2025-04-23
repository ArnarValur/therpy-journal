<script setup lang="ts">
import { onMounted, ref, computed, watch } from 'vue';
import { useLifeStories } from '~/composables/useLifeStories';
import { useAuthStore } from '~/stores/auth';
import LifeStoryForm from '~/components/form/LifeStoryForm.vue';
import type { LifeStoryEntry } from '~/types/lifeStory';

// Get router and route configurations
const router = useRouter();
const route = useRoute();
const { $routes } = useNuxtApp();

// Get story ID from route params
const storyId = computed(() => route.params.id as string);

// Get auth store and life stories composable
const authStore = useAuthStore();
const { lifeStories, updateLifeStory, error, pending } = useLifeStories();

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

// Handle form submission
const handleSubmit = async (formData: Omit<LifeStoryEntry, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
  if (!storyId.value) return;
  
  isSubmitting.value = true;
  submissionError.value = null;
  
  try {
    const success = await updateLifeStory(storyId.value, formData);
    
    if (success) {
      // Redirect to the life story view page
      await router.push($routes.LIFE_STORY.VIEW(storyId.value));
    } else {
      submissionError.value = 'Failed to update life story. Please try again.';
    }
  } catch (err) {
    console.error('Error updating life story:', err);
    submissionError.value = error.value?.message || 'An unexpected error occurred.';
  } finally {
    isSubmitting.value = false;
  }
};

// Handle cancel
const handleCancel = () => {
  if (storyId.value) {
    router.push($routes.LIFE_STORY.VIEW(storyId.value));
  } else {
    router.push($routes.LIFE_STORY.HOME);
  }
};
</script>

<template>
  <div class="container px-4 py-8 mx-auto">
    <h1 class="text-2xl font-bold mb-6">Edit Life Story</h1>
    
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
        @submit="handleSubmit"
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
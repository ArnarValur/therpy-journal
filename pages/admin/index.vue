<!-- pages/admin/index.vue -->
<script setup lang="ts">
import { useFeatureFlagsStore } from '~/stores/featureFlags';
import FeedbackContainer from '~/components/admin/FeedbackContainer.vue';

// Define page metadata with admin middleware
definePageMeta({
  middleware: ['admin']
});

const featureFlagsStore = useFeatureFlagsStore();

// Load feature flags when component mounts
onMounted(async () => {
  await featureFlagsStore.loadFeatureFlags();
});

// Handle toggle change
const onToggleChange = async (flagName: string, value: boolean) => {
  await featureFlagsStore.updateFeatureFlag(flagName, value);
};
</script>

<template>
  <div class="max-w-4xl mx-auto p-6">
    <h1 class="text-2xl font-semibold mb-6 dark:text-white">Admin Panel</h1>

    <!-- Feature Flags Section -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h2 class="text-lg font-medium mb-4 dark:text-white">Feature Flags</h2>

      <div v-if="featureFlagsStore.isLoading" class="flex items-center justify-center py-4">
        <i class="ri-loader-4-line animate-spin text-blue-500 text-2xl" />
      </div>

      <div v-else class="space-y-4">
        <!-- Error Message -->
        <div v-if="featureFlagsStore.error" class="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-200 p-3 rounded text-sm">
          {{ featureFlagsStore.error }}
        </div>

        <!-- Therapist Link Toggle -->
        <div class="flex items-center justify-between py-2">
          <div>
            <h3 class="font-medium dark:text-white">Show Therapist Link</h3>
            <p class="text-sm text-gray-500 dark:text-gray-400">Toggle visibility of the Therapist link in the side menu</p>
          </div>
          <label class="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              :checked="featureFlagsStore.showTherapistLink"
              class="sr-only peer"
              @change="onToggleChange('showTherapistLink', !featureFlagsStore.showTherapistLink)"
            >
            <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600" />
          </label>
        </div>
        
          <!-- Sentiment Badge Toggle -->
          <div class="flex items-center justify-between py-2">
            <div>
              <h3 class="font-medium dark:text-white">Show Sentiment Badge</h3>
              <p class="text-sm text-gray-500 dark:text-gray-400">Toggle visibility of the Sentiment Badge in the journal entries</p>
            </div>
            <label class="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                :checked="featureFlagsStore.showSentimentBadge"
                class="sr-only peer"
                @change="onToggleChange('showSentimentBadge', !featureFlagsStore.showSentimentBadge)"
              >
              <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600" />
            </label>
          </div>

      </div>
    </div>
    
    <!-- Feedback Container -->
    <FeedbackContainer />
  </div>
</template> 
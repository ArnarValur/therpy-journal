<script setup lang="ts">
import { ref } from 'vue';
import { useFeedback } from '~/composables/useFeedback';

definePageMeta({
  layout: 'default'
});

const { submitFeedback, isLoading, error } = useFeedback();
const title = ref('');
const feedback = ref('');
const isSuccess = ref(false);

const handleSubmit = async () => {
  if (!title.value.trim() || !feedback.value.trim()) {
    return;
  }

  const success = await submitFeedback(title.value, feedback.value);
  
  if (success) {
    title.value = '';
    feedback.value = '';
    isSuccess.value = true;
    
    // Hide success message after 3 seconds
    setTimeout(() => {
      isSuccess.value = false;
    }, 3000);
  }
};
</script>

<template>
  <div class="max-w-2xl mx-auto">
    <h1 class="text-2xl font-bold mb-6">Send Feedback</h1>
    
    <p class="mb-6 text-gray-600 dark:text-gray-300">
      We value your feedback! Please let us know about your experience, suggestions, or any issues you've encountered.
    </p>
    
    <div v-if="isSuccess" class="mb-4 p-3 bg-green-100 dark:bg-green-800 rounded-md text-green-800 dark:text-green-100">
      Thank you for your feedback! It has been sent to the administrator.
    </div>
    
    <div v-if="error" class="mb-4 p-3 bg-red-100 dark:bg-red-800 rounded-md text-red-800 dark:text-red-100">
      {{ error }}
    </div>

    <form class="space-y-4" @submit.prevent="handleSubmit">
      <div>
        <label for="feedback-title" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title</label>
        <input
          id="feedback-title"
          v-model="title"
          type="text"
          placeholder="Brief title for your feedback"
          class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 
                 focus:outline-none focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700
                 dark:text-white"
          :disabled="isLoading"
        >
      </div>
      
      <div>
        <label for="feedback-content" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Feedback</label>
        <textarea
          id="feedback-content"
          v-model="feedback"
          placeholder="Please share your thoughts, suggestions, or issues..."
          rows="6"
          class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400
                 focus:outline-none focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700
                 dark:text-white resize-none"
          :disabled="isLoading"
        />
      </div>

      <div class="flex justify-end pt-2">
        <button
          type="submit"
          class="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-md shadow-sm transition-colors"
          :disabled="isLoading || !title.trim() || !feedback.trim()"
        >
          {{ isLoading ? 'Sending...' : 'Send Feedback' }}
        </button>
      </div>
    </form>
  </div>
</template> 
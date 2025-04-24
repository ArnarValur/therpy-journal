<!-- components/modals/FeedbackModal.vue -->
<script setup lang="ts">
import { ref } from 'vue';
import { addDoc, collection } from 'firebase/firestore';
import { useFirestore } from 'vuefire';
import { useEncryption } from '~/composables/useEncryption';
import { useAuthStore } from '~/stores/auth';
import CancelButton from '~/components/buttons/CancelButton.vue';
import ConfirmButton from '~/components/buttons/ConfirmButton.vue';

// Define props and emits
defineProps<{
  isOpen: boolean;
}>();

const emit = defineEmits(['close']);

// Get Firestore instance
const db = useFirestore();
const authStore = useAuthStore();
const { encrypt } = useEncryption();

// Form data
const title = ref('');
const feedback = ref('');
const isSubmitting = ref(false);
const isSuccess = ref(false);
const error = ref<string | null>(null);

// Handle form submission
const submitFeedback = async () => {
  if (!title.value.trim() || !feedback.value.trim()) {
    error.value = 'Please fill in both title and feedback fields';
    return;
  }

  if (!authStore.user) {
    error.value = 'You must be logged in to submit feedback';
    return;
  }

  isSubmitting.value = true;
  error.value = null;

  try {
    // Create feedback document
    await addDoc(collection(db, 'feedbacks'), {
      title: title.value.trim(),
      feedback: feedback.value.trim(),
      userName: encrypt(authStore.user.name),
      userId: encrypt(authStore.user.id),
      createdAt: new Date(),
      isRead: false
    });

    // Reset form and show success message
    title.value = '';
    feedback.value = '';
    isSuccess.value = true;

    // Close modal after 2 seconds
    setTimeout(() => {
      isSuccess.value = false;
      emit('close');
    }, 2000);
  } catch (err) {
    console.error('Error submitting feedback:', err);
    error.value = 'Failed to submit feedback. Please try again.';
  } finally {
    isSubmitting.value = false;
  }
};

// Close the modal
const closeModal = () => {
  if (!isSubmitting.value) {
    title.value = '';
    feedback.value = '';
    error.value = null;
    isSuccess.value = false;
    emit('close');
  }
};
</script>

<template>
  <Transition name="modal-fade">
    <div v-if="isOpen" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm">
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full m-4">
        <div class="p-6">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Send Feedback</h3>
          
          <div v-if="isSuccess" class="mb-4 p-3 bg-green-100 dark:bg-green-800 rounded-md text-green-800 dark:text-green-100">
            Thank you for your feedback! It has been sent to the administrator.
          </div>
          
          <div v-if="error" class="mb-4 p-3 bg-red-100 dark:bg-red-800 rounded-md text-red-800 dark:text-red-100">
            {{ error }}
          </div>

          <form class="space-y-4" @submit.prevent="submitFeedback">
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
                :disabled="isSubmitting"
              >
            </div>
            
            <div>
              <label for="feedback-content" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Feedback</label>
              <textarea
                id="feedback-content"
                v-model="feedback"
                placeholder="Please share your thoughts, suggestions, or issues..."
                rows="4"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400
                       focus:outline-none focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700
                       dark:text-white resize-none"
                :disabled="isSubmitting"
              />
            </div>

            <div class="flex justify-end space-x-3 pt-2">
              <CancelButton
                type="button"
                :disabled="isSubmitting"
                @click="closeModal"
              >
                Cancel
              </CancelButton>
              <ConfirmButton
                type="submit"
                :disabled="isSubmitting"
              >
                {{ isSubmitting ? 'Sending...' : 'Send Feedback' }}
              </ConfirmButton>
            </div>
          </form>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.3s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

/* Optional: Add transition for the modal dialog itself */
.modal-fade-enter-active .dark\:bg-gray-800,
.modal-fade-leave-active .dark\:bg-gray-800 {
   transition: all 0.3s ease-in-out;
}
.modal-fade-enter-from .dark\:bg-gray-800,
.modal-fade-leave-to .dark\:bg-gray-800 {
   opacity: 0;
   transform: scale(0.95);
}
</style>

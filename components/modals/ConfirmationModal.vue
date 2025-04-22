<script setup lang="ts">
import { useModalSystem } from '~/composables/useModalSystem';
import CancelButton from '~/components/buttons/CancelButton.vue';
import ConfirmButton from '~/components/buttons/ConfirmButton.vue';

// Use the modal system to get state and actions
const { isOpen, title, message, confirm, cancel } = useModalSystem();

// Define props if you prefer passing data down instead of using the composable directly
// const props = defineProps<{
//   isOpen: boolean;
//   title: string;
//   message: string;
// }>();
// const emit = defineEmits(['confirm', 'cancel']);
</script>

<template>
  <Transition name="modal-fade">
    <div v-if="isOpen" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm">
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full m-4">
        <div class="p-6">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">{{ title }}</h3>
          <p class="text-gray-600 dark:text-gray-300 mb-6 whitespace-pre-wrap">{{ message }}</p>

          <div class="flex justify-end space-x-3">
            <CancelButton
              type="button"
              class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
              @click="cancel"
              >
              Cancel
            </CancelButton>
            <ConfirmButton
              type="button"
              @click="confirm"
              >
              Confirm
            </ConfirmButton>
          </div>
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
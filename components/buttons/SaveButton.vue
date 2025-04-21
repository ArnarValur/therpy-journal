<!-- components/button/SaveButton.vue -->
<script setup lang="ts">
defineProps<{
  isLoading?: boolean;
  disabled?: boolean;
}>();
</script>

<template>
  <button 
    type="button" 
    class="px-3 py-1 text-sm text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/30 rounded border border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors flex items-center"
    :disabled="disabled"
  >
    <i v-if="isLoading" class="ri-loader-4-line animate-spin mr-2" />
    <i v-else class="ri-save-line mr-2" />
    <slot>Save Changes</slot>
  </button>
</template> 
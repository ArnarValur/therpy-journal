<script setup lang="ts">
defineProps<{
  isLoading?: boolean;
  disabled?: boolean;
}>();
</script>

<template>
  <button 
    type="button" 
    class="h-10 px-4 rounded-md shadow-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 dark:bg-indigo-500 dark:hover:bg-indigo-600 cursor-pointer items-center flex"
    :disabled="disabled"
  >
    <i v-if="isLoading" class="ri-loader-4-line animate-spin mr-2" />
    <i v-else class="ri-save-line mr-2" />
    <slot>Save Changes</slot>
  </button>
</template> 
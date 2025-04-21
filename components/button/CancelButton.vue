<!-- components/button/CancelButton.vue -->
<script setup lang="ts">
defineProps<{
  disabled?: boolean;
}>();
</script>

<template>
  <button 
    type="button" 
    class="h-10 px-4 rounded-md shadow-sm font-medium text-gray-700 bg-white hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-600 cursor-pointer items-center flex"
  >
    <slot/>
  </button>
</template>
<!-- components/button/CancelButton.vue -->
<script setup lang="ts">
defineProps<{
  disabled?: boolean;
}>();
</script>

<template>
  <button 
    type="button" 
    class="px-3 py-1 text-sm text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-500/30 rounded border border-gray-400 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-gray-900/50 transition-colors flex items-center"
  >
    <slot/>
  </button>
</template>
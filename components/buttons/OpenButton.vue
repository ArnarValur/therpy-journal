<!-- components/button/OpenButton.vue -->
<script setup lang="ts">
const emit = defineEmits(['click']);
</script> 

<template>
  <button
    type="button"
    class="px-3 py-1 text-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 rounded border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors flex items-center"
    @click="emit('click')"
  >
    <slot />
  </button>
</template>
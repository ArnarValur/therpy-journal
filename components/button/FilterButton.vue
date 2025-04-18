<!-- components/button/FilterButton.vue -->
<script setup lang="ts">
defineProps({
  isActive: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['click']);
</script> 

<template>
  <button
    type="button"
    class="px-4 py-2 rounded-md text-sm"
    :class="isActive ? 'bg-blue-200 text-blue-800 dark:bg-blue-900 dark:text-blue-200' : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'"
    @click="emit('click')"
  >
    <slot />
  </button>
</template>

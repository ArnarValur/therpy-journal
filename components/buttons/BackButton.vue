<!-- components/button/BackButton.vue -->
<script setup lang="ts">
const emit = defineEmits(['click']);
</script> 

<template>
  <button
    type="button"
    class="px-3 py-2 text-sm text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/30 rounded border border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors flex items-center font-medium"
    @click="emit('click')"
  >
    <slot />
  </button>
</template>
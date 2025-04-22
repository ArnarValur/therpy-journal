<!-- components/button/EditButton.vue -->
<script setup lang="ts">
const emit = defineEmits(['click']);
</script> 

<template>
  <button
    type="button"
    class="px-3 py-1 text-sm text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-900/30 rounded border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors flex items-center"
    @click="(event) => emit('click', event)"
  >
    <slot />
  </button>
</template>
<!-- components/button/EntryButton.vue -->
<script setup lang="ts">
const emit = defineEmits(['click']);
</script> 

<template>
  <button
    type="button"
    class="bg-blue-400 px-4 py-2 rounded-md hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 transition-colors w-full sm:w-auto flex items-center justify-center cursor-pointer"
    @click="emit('click')"
  >
    <slot />
  </button>
</template>
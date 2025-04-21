<!-- components/button/EditButton.vue -->
<script setup lang="ts">
const emit = defineEmits(['click']);

</script> 

<template>
  <button
    type="button"
    class="px-3 py-1 text-sm text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-900/30 rounded border border-red-200 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors flex items-center"
    @click="(event) => emit('click', event)"
  >
    <slot />
  </button>
</template>
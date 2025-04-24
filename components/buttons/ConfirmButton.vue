<!-- components/button/CancelButton.vue -->
<script setup lang="ts">
defineProps<{
  disabled?: boolean;
}>();
</script>

<template>
  <button 
    type="button" 
    class="px-3 py-1 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
  >
    <slot/>
  </button>
</template>
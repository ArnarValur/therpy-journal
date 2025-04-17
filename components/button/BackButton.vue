<script setup lang="ts">
const emit = defineEmits(['click']);
</script> 

<template>
  <button
    type="button"
    class="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors w-full sm:w-auto flex items-center justify-center cursor-pointer"
    @click="emit('click')"
  >
    <slot />
  </button>
</template>
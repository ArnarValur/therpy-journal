<!-- components/GlobalLoading.vue -->
<script setup lang="ts">
const { isLoading, loadingMessage } = useLoadingState();
</script>

<template>
  <Transition name="fade">
    <div 
      v-if="isLoading" 
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    >
      <div class="bg-white p-6 rounded-lg shadow-lg flex flex-col items-center max-w-sm mx-auto">
        <div class="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <p v-if="loadingMessage" class="mt-4 text-gray-700">{{ loadingMessage }}</p>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style> 
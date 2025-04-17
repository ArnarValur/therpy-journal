<script setup lang="ts">
const { currentError, isErrorShown, clearError } = useErrorHandler();

// Auto-hide the error after 5 seconds
watch(() => currentError.value, (error) => {
  if (error && !isErrorShown.value) {
    isErrorShown.value = true;
    setTimeout(() => {
      if (currentError.value?.timestamp === error.timestamp) {
        clearError();
      }
    }, 6000); // Increased from 5000 to 6000 to give users more time to read
  }
}, { immediate: true });
</script>

<template>
  <Transition name="slide-fade">
    <div 
      v-if="currentError && isErrorShown" 
      class="fixed bottom-4 right-4 md:bottom-6 md:right-6 z-50 max-w-md bg-white rounded-lg shadow-xl border-l-4"
      :class="{
        'border-red-500': currentError.category === 'auth' || currentError.category === 'unknown',
        'border-yellow-500': currentError.category === 'network',
        'border-orange-500': currentError.category === 'validation',
        'border-blue-500': currentError.category === 'data'
      }"
    >
      <div class="p-4 pr-12 flex items-start">
        <div 
          class="mr-3 text-2xl"
          :class="{
            'text-red-500': currentError.category === 'auth' || currentError.category === 'unknown',
            'text-yellow-500': currentError.category === 'network',
            'text-orange-500': currentError.category === 'validation',
            'text-blue-500': currentError.category === 'data'
          }"
        >
          <i 
            :class="{
              'ri-error-warning-fill': currentError.category === 'auth' || currentError.category === 'unknown',
              'ri-wifi-off-fill': currentError.category === 'network',
              'ri-information-fill': currentError.category === 'validation',
              'ri-database-2-fill': currentError.category === 'data'
            }"
          />
        </div>
        <div>
          <h4 class="font-medium text-gray-800 text-base">
            {{ 
              currentError.category === 'auth' ? 'Authentication Error' : 
              currentError.category === 'network' ? 'Network Error' :
              currentError.category === 'validation' ? 'Validation Error' :
              currentError.category === 'data' ? 'Data Error' : 'Error'
            }}
          </h4>
          <p class="text-gray-700 mt-1">{{ currentError.message }}</p>
        </div>
        <button 
          class="absolute top-2 right-2 text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100"
          aria-label="Close"
          @click="clearError"
        >
          <i class="ri-close-line" />
        </button>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: all 0.3s ease;
}

.slide-fade-enter-from,
.slide-fade-leave-to {
  transform: translateY(20px);
  opacity: 0;
}
</style> 
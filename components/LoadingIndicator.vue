<script setup lang="ts">
defineProps({
  size: {
    type: String,
    default: 'md',
    validator: (value: string) => ['sm', 'md', 'lg'].includes(value)
  },
  color: {
    type: String,
    default: 'primary'
  },
  label: {
    type: String,
    default: ''
  },
  fullPage: {
    type: Boolean,
    default: false
  }
});
</script>

<template>
  <div 
    :class="[
      'flex items-center justify-center',
      fullPage ? 'fixed inset-0 bg-white bg-opacity-80 z-50' : ''
    ]"
  >
    <div class="flex flex-col items-center">
      <div 
        :class="[
          'animate-spin rounded-full border-t-transparent',
          size === 'sm' ? 'w-4 h-4 border-2' : size === 'md' ? 'w-6 h-6 border-2' : 'w-10 h-10 border-4',
          color === 'primary' ? 'border-blue-500' : 
          color === 'success' ? 'border-green-500' : 
          color === 'danger' ? 'border-red-500' : 
          color === 'warning' ? 'border-yellow-500' : 
          color === 'light' ? 'border-gray-300' : 'border-gray-700'
        ]"
      />
      <span v-if="label" class="mt-2 text-sm text-gray-600">{{ label }}</span>
    </div>
  </div>
</template> 
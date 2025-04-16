<script setup lang="ts">
// Auth layout for login and registration pages
</script>

<template>
  <div class="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-8">
      <div class="text-center">
        <h1 class="text-3xl font-bold text-[#42A5F5] mb-2">TherapyJournal</h1>
        <p class="text-gray-600">Your secure space for reflection</p>
      </div>
      
      <div class="bg-white shadow rounded-lg p-6">
        <slot />
      </div>
    </div>
  </div>
</template>

<style scoped>
.bg-gray-50 {
  background-color: #fafafa;
}
</style> 
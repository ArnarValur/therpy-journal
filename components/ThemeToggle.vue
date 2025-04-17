<script setup lang="ts">
const colorMode = useColorMode();

const isDark = computed(() => colorMode.value === 'dark');

// Function to toggle between light and dark modes
const toggleTheme = () => {
  // If we're in system mode, we need to toggle between light and dark
  // while keeping the preference as system
  if (colorMode.preference === 'system') {
    // Force a specific theme while keeping system preference
    colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark';
  } else {
    // Toggle between light and dark directly
    colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark';
  }
};
</script>

<template>
  <button
    class="theme-toggle inline-flex items-center justify-center p-2 rounded-md transition-colors"
    :class="isDark ? 'bg-gray-800 text-gray-200' : 'bg-gray-200 text-gray-800'"
    :title="isDark ? 'Switch to light mode' : 'Switch to dark mode'"
    aria-label="Toggle theme"
    @click="toggleTheme"
  >
    <!-- Sun icon for light mode -->
    <span v-if="isDark" class="text-lg block">
      <i class="ri-sun-line" aria-hidden="true" />
    </span>
    <!-- Moon icon for dark mode -->
    <span v-else class="text-lg block">
      <i class="ri-moon-line" aria-hidden="true" />
    </span>
  </button>
</template>

<style scoped>
.theme-toggle {
  /* Use our CSS variables */
  background-color: var(--color-background-tertiary);
  color: var(--color-text-primary);
  border: 1px solid var(--color-border);
  width: 36px;
  height: 36px;
}

.theme-toggle:hover {
  background-color: var(--color-background-secondary);
}

.theme-toggle:focus {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

.dark .theme-toggle {
  background-color: var(--color-background-tertiary);
  color: var(--color-text-primary);
}
</style> 
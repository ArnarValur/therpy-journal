<script setup lang="ts">
const colorMode = useColorMode();

const themeOptions = [
  { value: 'system', label: 'System', icon: 'ri-computer-line' },
  { value: 'light', label: 'Light', icon: 'ri-sun-line' },
  { value: 'dark', label: 'Dark', icon: 'ri-moon-line' }
];

// Current theme display label
const currentThemeLabel = computed(() => {
  const option = themeOptions.find(opt => opt.value === colorMode.preference);
  return option?.label || 'System';
});

// Current value display (accounts for system detecting light/dark)
const currentThemeValue = computed(() => {
  if (colorMode.preference === 'system') {
    return `System (${colorMode.value === 'dark' ? 'Dark' : 'Light'})`;
  }
  return currentThemeLabel.value;
});
</script>

<template>
  <div class="theme-selector space-y-4">
    <h3 class="text-base font-medium">Theme Preference</h3>
    <p class="text-sm text-gray-500 dark:text-gray-400">
      Current theme: {{ currentThemeValue }}
    </p>
    
    <div class="grid grid-cols-3 gap-3">
      <button
        v-for="option in themeOptions"
        :key="option.value"
        class="theme-option flex flex-col items-center justify-center p-4 rounded-lg transition-all"
        :class="[
          colorMode.preference === option.value ? 'theme-option-active' : 'theme-option-inactive',
        ]"
        @click="colorMode.preference = option.value"
      >
        <i :class="[option.icon, 'text-2xl mb-2']" aria-hidden="true"></i>
        <span class="text-sm">{{ option.label }}</span>
      </button>
    </div>
    
    <p class="text-xs text-gray-400 dark:text-gray-500 mt-2">
      System mode will automatically switch based on your operating system's settings.
    </p>
  </div>
</template>

<style scoped>
.theme-selector {
  color: var(--color-text-primary);
}

.theme-option {
  background-color: var(--color-background-secondary);
  color: var(--color-text-primary);
  border: 1px solid var(--color-border);
}

.theme-option:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.theme-option-active {
  background-color: var(--color-primary);
  color: white;
  border-color: var(--color-primary-dark);
}

.theme-option-inactive {
  opacity: 0.9;
}

.theme-option-inactive:hover {
  opacity: 1;
}
</style> 
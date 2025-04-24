<!-- components/form/JournalEntryItems/SentimentManager.vue -->
<script setup lang="ts">
import { ref, watch } from 'vue';

type Sentiment = {
  name: string;
  key: string;
  value: number;
  min: number;
  max: number;
};

// Props & Emits
const props = defineProps<{
  modelValue: Record<string, number>; // Use v-model for two-way binding
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', sentiments: Record<string, number>): void;
}>();

// Internal state
const sentimentOptions = ref<Array<Sentiment>>(
  Object.entries(props.modelValue || {}).map(([key, value]) => ({
    name: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    key,
    value,
    min: 0,
    max: 10
  }))
);
const newSentimentName = ref('');

// Watch for external changes to modelValue (e.g., initial load)
watch(() => props.modelValue, (newSentiments) => {
  // Avoid infinite loops if the change came from within this component
  const currentInternalSentiments = sentimentOptions.value.reduce((acc, s) => {
    acc[s.key] = s.value;
    return acc;
  }, {} as Record<string, number>);

  if (JSON.stringify(newSentiments) !== JSON.stringify(currentInternalSentiments)) {
     sentimentOptions.value = Object.entries(newSentiments || {}).map(([key, value]) => ({
      name: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      key,
      value,
      min: 0,
      max: 10
    }));
  }
}, { deep: true });


// Emit updates whenever internal options change
const emitUpdate = () => {
  const updatedSentiments = sentimentOptions.value.reduce((acc, sentiment) => {
    acc[sentiment.key] = sentiment.value;
    return acc;
  }, {} as Record<string, number>);
  emit('update:modelValue', updatedSentiments);
};

// Add a new custom sentiment slider
const addSentimentSlider = () => {
  const name = newSentimentName.value.trim();
  if (!name) return;

  const key = name.toLowerCase().replace(/\s+/g, '_');

  if (sentimentOptions.value.some(s => s.key === key)) {
    console.warn(`Sentiment with key "${key}" already exists.`);
    return;
  }

  sentimentOptions.value.push({
    name,
    key,
    value: 5,
    min: 0,
    max: 10
  });

  newSentimentName.value = '';
  emitUpdate(); // Emit after adding
};

// Remove a sentiment slider by key
const removeSentimentSlider = (key: string) => {
  sentimentOptions.value = sentimentOptions.value.filter(s => s.key !== key);
  emitUpdate(); // Emit after removing
};

// Update a specific sentiment's value
const updateSentimentValue = (key: string, value: number) => {
  const sentiment = sentimentOptions.value.find(s => s.key === key);
  if (sentiment) {
    sentiment.value = value;
    emitUpdate(); // Emit after updating value
  }
};

// Handle direct input event from range slider
const handleSliderInput = (event: Event, key: string) => {
  const target = event.target as HTMLInputElement;
  updateSentimentValue(key, Number(target.value));
};

// Handle key press for custom feeling input
const handleSentimentKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Enter') {
    event.preventDefault();
    addSentimentSlider();
  }
};

</script>

<template>
  <div class="mb-6">
    <div class="flex items-center justify-between mb-3">
      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
        How are you feeling?
      </label>

      <!-- Add new sentiment slider -->
      <div class="flex">
        <input
          v-model="newSentimentName"
          type="text"
          placeholder="Add custom feeling"
          class="w-40 md:w-48 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm"
          @keydown="handleSentimentKeydown"
        >
        <button
          type="button"
          class="ml-2 px-3 py-2 border border-gray-300 rounded-md shadow-sm text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-600"
          :disabled="!newSentimentName.trim()"
          @click="addSentimentSlider"
        >
          Add Slider
        </button>
      </div>
    </div>

    <div v-if="sentimentOptions.length > 0" class="space-y-4">
      <div v-for="sentiment in sentimentOptions" :key="sentiment.key" class="flex items-center">
        <div class="flex justify-between items-center w-24 md:w-32">
           <span class="text-sm text-gray-600 dark:text-gray-400 truncate" :title="sentiment.name">
             {{ sentiment.name }}
           </span>
          <button
            type="button"
            class="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 focus:outline-none ml-1 flex-shrink-0"
            title="Remove this slider"
            @click="removeSentimentSlider(sentiment.key)"
          >
            <i class="ri-delete-bin-line" />
          </button>
        </div>
        <input
          :value="sentiment.value"
          type="range"
          :min="sentiment.min"
          :max="sentiment.max"
          class="flex-grow h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer mx-3 dark:bg-gray-700"
          @input="handleSliderInput($event, sentiment.key)"
        >
        <span class="w-6 text-center text-sm text-gray-600 dark:text-gray-400">{{ sentiment.value }}</span>
      </div>
    </div>

    <div v-else class="text-center py-4 text-gray-500 dark:text-gray-400 text-sm border border-dashed border-gray-300 dark:border-gray-700 rounded-md mt-2">
      Add custom feelings and rate them on a scale from 0 to 10
    </div>
  </div>
</template> 
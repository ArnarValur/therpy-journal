<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useEditor } from '@tiptap/vue-3';
import StarterKit from '@tiptap/starter-kit';
import { useDebounceFn } from '@vueuse/core';

import CancelButton from '~/components/buttons/CancelButton.vue';
import SaveButton from '~/components/buttons/SaveButton.vue';
import JournalEditor from '~/components/editor/JournalEditor.vue';

interface Props {
  initialData?: {
    title?: string;
    content?: string | null;
    tags?: string[];
    sentiments?: Record<string, number>;
    isDraft?: boolean;
  };
  isSubmitting?: boolean;
  isAutosaving?: boolean;
  lastAutosaveTime?: Date | null;
}

const props = withDefaults(defineProps<Props>(), {
  initialData: () => ({}),
  isSubmitting: false,
  isAutosaving: false,
  lastAutosaveTime: null
});

const emit = defineEmits<{
  (e: 'submit', data: {
    title: string;
    content: string | null;
    tags: string[];
    sentiments: Record<string, number>;
    isDraft: boolean;
  }): void;
  (e: 'cancel'): void;
  (e: 'update', data: {
    title: string;
    content: string | null;
    tags: string[];
    sentiments: Record<string, number>;
  }): void;
}>();

// Journal entry state
const title = ref(props.initialData?.title || '');
const content = ref<string | null>(props.initialData?.content || null);
const tags = ref<string[]>(props.initialData?.tags || []);
const currentTag = ref('');
const sentimentOptions = ref<Array<{name: string; key: string; value: number; min: number; max: number}>>(
  Object.entries(props.initialData?.sentiments || {}).map(([key, value]) => ({
    name: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    key,
    value,
    min: 0,
    max: 10
  }))
);
const newSentimentName = ref('');

// Form validation
const isTitleValid = computed(() => title.value.trim().length > 0);
const isContentValid = computed(() => Boolean(content.value?.length) || true); // Always valid to allow empty content
const isFormValid = computed(() => isTitleValid.value && isContentValid.value);

// Autosave status message
const autosaveStatus = computed(() => {
  if (props.isAutosaving) return 'Saving...';
  if (props.lastAutosaveTime) return `Last saved at ${props.lastAutosaveTime.toLocaleTimeString()}`;
  return '';
});

// Handle editor content updates
const handleEditorUpdate = (html: string) => {
  content.value = html;
  emitUpdate();
};

// TipTap editor configuration
const _editor = useEditor({
  content: content.value || '',
  extensions: [StarterKit],
  onUpdate: ({ editor }) => {
    content.value = editor.getHTML();
    emitUpdate();
  }
});

// Watch for changes in title and trigger update
watch(title, () => {
  emitUpdate();
});

// Watch for changes in tags and trigger update
watch(tags, () => {
  emitUpdate();
}, { deep: true });

// Watch for changes in sentiment sliders and trigger update
watch(sentimentOptions, () => {
  emitUpdate();
}, { deep: true });

// Emit update event with current form data
const debouncedEmitUpdate = useDebounceFn(() => {
  const updatedSentiments = sentimentOptions.value.reduce((acc, sentiment) => {
    acc[sentiment.key] = sentiment.value;
    return acc;
  }, {} as Record<string, number>);

  emit('update', {
    title: title.value,
    content: content.value,
    tags: tags.value,
    sentiments: updatedSentiments
  });
}, 500);

const emitUpdate = () => {
  debouncedEmitUpdate();
};

// Add a tag to the tags list
const addTag = () => {
  const tag = currentTag.value.trim();
  if (tag && !tags.value.includes(tag)) {
    tags.value.push(tag);
    currentTag.value = '';
  }
};

// Remove a tag from the tags list
const removeTag = (tag: string) => {
  tags.value = tags.value.filter(t => t !== tag);
};

// Handle key press for tag input
const handleTagKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Enter') {
    event.preventDefault();
    addTag();
  }
};

// Handle key press for custom feeling input
const handleSentimentKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Enter') {
    event.preventDefault();
    addSentimentSlider();
  }
};

// Add a new custom sentiment slider
const addSentimentSlider = () => {
  const name = newSentimentName.value.trim();
  if (!name) return;
  
  // Create a key from the name (lowercase, no spaces)
  const key = name.toLowerCase().replace(/\s+/g, '_');
  
  // Check if this sentiment already exists
  if (sentimentOptions.value.some(s => s.key === key)) {
    return;
  }
  
  // Add the new sentiment slider
  sentimentOptions.value.push({
    name,
    key,
    value: 5,
    min: 0,
    max: 10
  });
  
  // Clear the input
  newSentimentName.value = '';
};

// Remove a sentiment slider
const removeSentimentSlider = (key: string) => {
  sentimentOptions.value = sentimentOptions.value.filter(s => s.key !== key);
};

// Update sentiment values
const updateSentiment = (key: string, value: number) => {
  const sentiment = sentimentOptions.value.find(s => s.key === key);
  if (sentiment) {
    sentiment.value = value;
  }
};

// Save the journal entry
const handleSubmit = () => {
  if (!isFormValid.value) return;

  // Update sentiments object from sliders
  const updatedSentiments = sentimentOptions.value.reduce((acc, sentiment) => {
    acc[sentiment.key] = sentiment.value;
    return acc;
  }, {} as Record<string, number>);

  const formData = {
    title: title.value,
    content: content.value || '<p></p>', // Use HTML content directly
    tags: tags.value,
    sentiments: updatedSentiments,
    isDraft: false // Explicitly mark as not a draft
  };

  emit('submit', formData);
};

// Handle Cancel button click
const handleCancel = () => {
  emit('cancel');
};
</script>

<template>
  <form class="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-100 dark:border-gray-700" @submit.prevent="handleSubmit">

    <!-- Title input -->
    <div class="mb-6">
      <label for="title" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        Title <span class="text-red-500">*</span>
      </label>
      <input
        id="title"
        v-model="title"
        type="text"
        placeholder="Give your entry a title"
        class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
        :class="{ 'border-red-500': !isTitleValid && title.length > 0 }"
      >
    </div>

    <!-- Rich text editor -->
    <div class="mb-6 relative">
      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        Content
      </label>
      <JournalEditor
        :initial-content="content"
        @update="handleEditorUpdate"
      />
      
      <!-- Autosave status -->
      <div 
        v-if="autosaveStatus" 
        class="absolute bottom-0 right-0 translate-y-full pt-2 text-sm text-gray-500 dark:text-gray-400"
      >
        {{ autosaveStatus }}
      </div>
    </div>

    <!-- Tags input -->
    <div class="mb-6">
      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        Tags
      </label>
      <div class="flex">
        <input
          v-model="currentTag"
          type="text"
          placeholder="Add tags (press Enter)"
          class="flex-grow px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          @keydown="handleTagKeydown"
        >
        <button 
          type="button"
          class="ml-2 px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-600"
          :disabled="!currentTag.trim()"
          @click="addTag"
        >
          Add
        </button>
      </div>
      
      <!-- Tags display -->
      <div v-if="tags.length > 0" class="mt-3 flex flex-wrap gap-2">
        <div 
          v-for="tag in tags" 
          :key="tag" 
          class="px-3 py-1 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200 flex items-center"
        >
          {{ tag }}
          <button 
            class="ml-2 text-blue-500 hover:text-blue-700 dark:text-blue-300 dark:hover:text-blue-100 focus:outline-none"
            type="button"
            @click="removeTag(tag)" 
          >
            <i class="ri-close-line" />
          </button>
        </div>
      </div>
    </div>

    <!-- Custom Sentiment sliders -->
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
          <div class="flex justify-between w-24 md:w-32">
            <span class="text-sm text-gray-600 dark:text-gray-400">{{ sentiment.name }}</span>
            <button 
              type="button"
              class="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 focus:outline-none"
              title="Remove this slider"
              @click="removeSentimentSlider(sentiment.key)" 
            >
              <i class="ri-delete-bin-line" />
            </button>
          </div>
          <input 
            v-model="sentiment.value" 
            type="range" 
            :min="sentiment.min" 
            :max="sentiment.max"
            class="flex-grow h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer mx-3 dark:bg-gray-700"
            @input="updateSentiment(sentiment.key, sentiment.value)"
          >
          <span class="w-6 text-center text-sm text-gray-600 dark:text-gray-400">{{ sentiment.value }}</span>
        </div>
      </div>
      
      <div v-if="sentimentOptions.length === 0" class="text-center py-4 text-gray-500 dark:text-gray-400 text-sm border border-dashed border-gray-300 dark:border-gray-700 rounded-md mt-2">
        Add custom feelings and rate them on a scale from 0 to 10
      </div>
    </div>

    <div class="flex gap-3 justify-end">
      <CancelButton 
        type="button" 
        @click="handleCancel"
      >
        Cancel
      </CancelButton>
      <SaveButton 
        type="submit"
        :disabled="!isFormValid || isSubmitting"
      >
        <i v-if="isSubmitting" class="ri-loader-4-line animate-spin mr-2" />
        Save Entry
      </SaveButton>
    </div>
  </form>
</template>

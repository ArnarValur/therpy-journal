<!-- pages/journal/new.vue -->
<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue';
import { useEditor } from '@tiptap/vue-3';
import StarterKit from '@tiptap/starter-kit';
import { useNuxtApp } from '#app';
import { useDebounceFn, tryOnBeforeUnmount } from '@vueuse/core';

import CancelButton from '~/components/button/CancelButton.vue';
import SaveButton from '~/components/button/SaveButton.vue';
import JournalEditor from '~/components/editor/JournalEditor.vue';

// Get required composables
const { createEntry, updateEntry } = useJournalEntry();
const authStore = useAuthStore();
const router = useRouter();
const { $routes } = useNuxtApp();

// Journal entry state
const isLoading = ref(false);
const error = ref<string | null>(null);
const title = ref('');
const content = ref<string | null>(null);
const tags = ref<string[]>([]);
const currentTag = ref('');
const sentiments = ref<Record<string, number>>({});
const draftId = ref<string | null>(null);
const isAutosaving = ref(false);
const lastAutosaveTime = ref<Date | null>(null);
const isSaving = ref(false);
const isManualSaving = ref(false);

// Sentiment sliders (custom user-defined sliders)
const sentimentOptions = ref<Array<{name: string; key: string; value: number; min: number; max: number}>>([]);
const newSentimentName = ref('');

// Form validation
const isTitleValid = computed(() => title.value.trim().length > 0);
const isContentValid = computed(() => Boolean(content.value?.length) || true); // Always valid to allow empty content
const isFormValid = computed(() => isTitleValid.value && isContentValid.value);

// Autosave status message
const autosaveStatus = computed(() => {
  if (isAutosaving.value) return 'Saving...';
  if (lastAutosaveTime.value) return `Last saved at ${lastAutosaveTime.value.toLocaleTimeString()}`;
  return '';
});

// Handle editor content updates
const handleEditorUpdate = (html: string) => {
  content.value = html;
  // Only trigger autosave if we're not in the middle of a manual save
  if (!isManualSaving.value) {
    debouncedAutosave();
  }
};

// TipTap editor configuration
const editor = useEditor({
  content: '',
  extensions: [StarterKit],
  onUpdate: ({ editor }) => {
    content.value = editor.getHTML();
    // Only trigger autosave if we're not in the middle of a manual save
    if (!isManualSaving.value) {
      debouncedAutosave();
    }
  }
});

// Check if user is authenticated
onMounted(async () => {
  if (!authStore.isLoggedIn) {
    await router.push($routes.AUTH.LOGIN);
    return;
  }
});

// Watch for changes in title and trigger autosave
watch(title, () => {
  debouncedAutosave();
});

// Watch for changes in tags and trigger autosave
watch(tags, () => {
  debouncedAutosave();
}, { deep: true });

// Watch for changes in sentiment sliders and trigger autosave
watch(sentimentOptions, () => {
  debouncedAutosave();
}, { deep: true });

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
  sentiments.value = Object.fromEntries(
    Object.entries(sentiments.value).filter(([k]) => k !== key)
  );
};

// Update sentiment values
const updateSentiment = (key: string, value: number) => {
  sentiments.value[key] = value;
};

// Save the journal entry
const saveEntry = async () => {
  if (!isFormValid.value) return;

  isManualSaving.value = true;
  isLoading.value = true;
  error.value = null;

  try {
    const updatedSentiments = sentimentOptions.value.reduce((acc, sentiment) => {
      acc[sentiment.key] = sentiment.value;
      return acc;
    }, {} as Record<string, number>);

    // This is the final entry data, always non-draft
    const entry = {
      title: title.value,
      content: content.value || '<p></p>',
      tags: tags.value,
      sentiments: updatedSentiments,
      isDraft: false // Explicitly false for manual save
    };

    let success = false;
    const currentDraftId = draftId.value; // Capture ID before async call

    if (currentDraftId) {
      // If a draft exists, update it to be the final version
      console.log(`Updating existing draft (ID: ${currentDraftId}) as final entry.`);
      success = await updateEntry(currentDraftId, entry);
    } else {
      // If no draft exists, create the final version directly
      console.log('Creating new final entry.');
      const result = await createEntry(entry);
      // --- DO NOT set draftId.value here ---
      // draftId should only be set by autosave creating a draft
      success = Boolean(result?.id);
    }

    if (success) {
      console.log('Manual save successful. Navigating...');
      await router.push($routes.JOURNAL.HOME);
      // isManualSaving flag will be reset by onBeforeUnmount after navigation
    } else {
      console.error('Failed to save entry');
      error.value = 'Failed to save entry';
      isManualSaving.value = false; // Reset flag on explicit failure
      isLoading.value = false;
    }
  } catch (err) {
    console.error('Failed to save entry:', err);
    error.value = 'Failed to save entry';
    isManualSaving.value = false; // Reset flag on error
    isLoading.value = false;
  } finally {
    // Only reset isLoading if manual save didn't succeed and start navigation
    if (!isManualSaving.value) {
         isLoading.value = false;
    }
  }
};

// Create a debounced autosave function
const debouncedAutosave = useDebounceFn(async () => {
  const currentDraftId = draftId.value; // Capture ID at the very start
  console.log(`>>> Autosave triggered. Current draftId at start: ${currentDraftId}`);

  // Check flags FIRST to prevent concurrent runs
  if (isManualSaving.value || isAutosaving.value) {
      console.log(`Autosave skipped: Flags check (isManualSaving: ${isManualSaving.value}, isAutosaving: ${isAutosaving.value})`);
      return;
  }

  if (!title.value && !content.value) {
      console.log('Autosave skipped: No title or content.');
      return;
  }

  console.log('Autosave proceeding...');
  isAutosaving.value = true; // Set flag AFTER checks
  
  try {
    // Update sentiments object from sliders
    const updatedSentiments = sentimentOptions.value.reduce((acc, sentiment) => {
      acc[sentiment.key] = sentiment.value;
      return acc;
    }, {} as Record<string, number>);

    const entry = {
      title: title.value,
      content: content.value || '<p></p>', // Use HTML content directly
      tags: tags.value || [],
      sentiments: updatedSentiments,
    };

    if (currentDraftId) {
      console.log(`Autosave: Updating existing draft ID: ${currentDraftId}`);
      await updateEntry(currentDraftId, entry);
    } else {
      console.log('Autosave: Creating new draft...');
      const result = await createEntry(entry);
      console.log('Autosave: createEntry result:', JSON.stringify(result)); // Log the raw result
      if (result?.id) {
        draftId.value = result.id;
        console.log(`Autosave: draftId ref SET to: ${draftId.value}`); // Log after setting
      } else {
        console.error('Autosave: createEntry failed or did not return an ID.');
      }
    }
    lastAutosaveTime.value = new Date();
  } catch (err) {
    console.error('Autosave failed:', err);
  } finally {
    isAutosaving.value = false;
    console.log('<<< Autosave finished.');
  }
}, 2000);

// ALSO Recommended: Add cancellation to onBeforeUnmount if you haven't already

tryOnBeforeUnmount(() => {
  console.log('New Entry Page: Running cleanup before unmount...');
  isManualSaving.value = false;
  isLoading.value = false;

  if (editor.value) {
    editor.value.destroy();
    console.log('Tiptap editor destroyed.');
  }
});

</script>

<template>
  <div class="space-y-6 sm:space-y-8 p-4 sm:p-6 bg-gray-50 dark:bg-transparent rounded-lg">

    <!-- Header section and new entry button -->
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white">New Journal Entry</h1>
      <div class="flex gap-3">
        <CancelButton 
          type="button" 
          class=""
          @click="router.push('/journal')"
        >
          Cancel
        </CancelButton>
        <SaveButton 
          class=""
          :disabled="!isFormValid || isLoading"
          @click="saveEntry"
        >
          <i v-if="isLoading" class="ri-loader-4-line animate-spin mr-2" />
          Save Entry
        </SaveButton>
      </div>
    </div>

    <!-- Error message -->
    <div v-if="error" class="mb-4 p-4 bg-red-50 border border-red-200 rounded-md dark:bg-red-900/30 dark:border-red-800">
      <div class="flex">
        <div class="flex-shrink-0">
          <i class="ri-error-warning-line text-red-400 dark:text-red-300" />
        </div>
        <div class="ml-3">
          <h3 class="text-sm font-medium text-red-800 dark:text-red-200">Error</h3>
          <div class="mt-2 text-sm text-red-700 dark:text-red-300">{{ error }}</div>
        </div>
      </div>
    </div>

    <!-- Entry form -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <!-- Title input -->
      <div class="mb-6">
        <label for="title" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Title
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
    </div>

  </div>
</template>

<style>
.ProseMirror {
  outline: none;
}

.ProseMirror p.is-editor-empty:first-child::before {
  content: attr(data-placeholder);
  float: left;
  color: #adb5bd;
  pointer-events: none;
  height: 0;
}

.dark .ProseMirror p.is-editor-empty:first-child::before {
  color: #6c757d;
}
</style> 
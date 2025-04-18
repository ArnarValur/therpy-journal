<script setup lang="ts">
import { ref, onMounted, computed, onBeforeUnmount, watch } from 'vue';
import { useEditor, EditorContent } from '@tiptap/vue-3';
import StarterKit from '@tiptap/starter-kit';
import { useNuxtApp } from '#app';
import { useDebounceFn } from '@vueuse/core';

import CancelButton from '~/components/button/CancelButton.vue';
import SaveButton from '~/components/button/SaveButton.vue';

// Get required composables
const { createEntry, updateEntry, isLoading, error } = useJournalEntry();
const authStore = useAuthStore();
const router = useRouter();
const { $routes } = useNuxtApp();

// Journal entry state
const title = ref('');
const content = ref('');
const tags = ref<string[]>([]);
const currentTag = ref('');
const sentiments = ref<Record<string, number>>({});
const draftId = ref<string | null>(null);
const isAutosaving = ref(false);
const lastAutosaveTime = ref<Date | null>(null);

// Sentiment sliders (custom user-defined sliders)
const sentimentOptions = ref<Array<{name: string; key: string; value: number; min: number; max: number}>>([]);
const newSentimentName = ref('');

// Form validation
const isTitleValid = computed(() => title.value.trim().length > 0);
const isContentValid = computed(() => content.value.trim().length > 0 || true); // Always valid to allow empty content
const isFormValid = computed(() => isTitleValid.value && isContentValid.value);

// Autosave status message
const autosaveStatus = computed(() => {
  if (isAutosaving.value) return 'Saving...';
  if (lastAutosaveTime.value) return `Last saved at ${lastAutosaveTime.value.toLocaleTimeString()}`;
  return '';
});

// Create a debounced autosave function
const debouncedAutosave = useDebounceFn(async () => {
  if (!title.value && !content.value) return; // Don't autosave if both title and content are empty
  
  isAutosaving.value = true;
  
  try {
    const entry = {
      title: title.value,
      content: content.value,
      tags: tags.value,
      sentiments: sentimentOptions.value.reduce((acc, slider) => {
        acc[slider.key] = slider.value;
        return acc;
      }, {} as Record<string, number>)
    };

    if (draftId.value) {
      // Update existing draft
      await updateEntry(draftId.value, entry);
    } else {
      // Create new draft
      const result = await createEntry({
        ...entry,
        isDraft: true // Add isDraft flag to indicate this is an autosaved draft
      });
      if (result?.id) {
        draftId.value = result.id;
      }
    }
    
    lastAutosaveTime.value = new Date();
  } catch (err) {
    console.error('Autosave failed:', err);
  } finally {
    isAutosaving.value = false;
  }
}, 2000); // Debounce for 2 seconds

// TipTap editor configuration
const editor = useEditor({
  content: '',
  extensions: [StarterKit],
  onUpdate: ({ editor }) => {
    content.value = editor.getHTML();
    debouncedAutosave();
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

  // Update sentiments object from sliders
  sentimentOptions.value.forEach(sentiment => {
    sentiments.value[sentiment.key] = sentiment.value;
  });

  const entry = {
    title: title.value,
    content: content.value,
    tags: tags.value,
    sentiments: sentiments.value,
    isDraft: false // Mark as not a draft when explicitly saving
  };

  let result;
  if (draftId.value) {
    // Update the existing draft and mark it as not a draft anymore
    result = await updateEntry(draftId.value, entry);
  } else {
    result = await createEntry(entry);
  }
  
  if (result) {
    await router.push($routes.JOURNAL.HOME);
  }
};

// Clean up the editor on component unmount
onBeforeUnmount(() => {
  if (editor.value) {
    editor.value.destroy();
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
        <div class="border rounded-md dark:border-gray-700 overflow-hidden" :class="{ 'border-red-500': !isContentValid && editor }">
          <!-- Editor toolbar -->
          <div v-if="editor" class="flex flex-wrap gap-1 p-2 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
            <button
              :class="{ 'bg-blue-100 dark:bg-blue-900': editor.isActive('bold') }"
              class="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
              title="Bold"
              type="button"
              @click="editor.chain().focus().toggleBold().run()"
            >
              <i class="ri-bold" />
            </button>
            <button
              :class="{ 'bg-blue-100 dark:bg-blue-900': editor.isActive('italic') }"
              class="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
              title="Italic"
              type="button"
              @click="editor.chain().focus().toggleItalic().run()"
            >
              <i class="ri-italic" />
            </button>
            <button
              :class="{ 'bg-blue-100 dark:bg-blue-900': editor.isActive('strike') }"
              class="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
              title="Strike"
              type="button"
              @click="editor.chain().focus().toggleStrike().run()"
            >
              <i class="ri-strikethrough" />
            </button>
            <span class="border-r dark:border-gray-700 mx-1" />
            <button
              :class="{ 'bg-blue-100 dark:bg-blue-900': editor.isActive('paragraph') }"
              class="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
              title="Paragraph"
              type="button"
              @click="editor.chain().focus().setParagraph().run()"
            >
              <i class="ri-paragraph" />
            </button>
            <button
            :class="{ 'bg-blue-100 dark:bg-blue-900': editor.isActive('heading', { level: 1 }) }"
            class="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
            title="Heading 1"
            type="button"
            @click="editor.chain().focus().toggleHeading({ level: 1 }).run()"
            >
              <i class="ri-h-1" />
            </button>
            <button
            :class="{ 'bg-blue-100 dark:bg-blue-900': editor.isActive('heading', { level: 2 }) }"
            class="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
            title="Heading 2"
            type="button"
            @click="editor.chain().focus().toggleHeading({ level: 2 }).run()"
            >
              <i class="ri-h-2" />
            </button>
            <span class="border-r dark:border-gray-700 mx-1" />
            <button
              :class="{ 'bg-blue-100 dark:bg-blue-900': editor.isActive('bulletList') }"
              class="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
              title="Bullet List"
              type="button"
              @click="editor.chain().focus().toggleBulletList().run()"
            >
              <i class="ri-list-unordered" />
            </button>
            <button
              :class="{ 'bg-blue-100 dark:bg-blue-900': editor.isActive('orderedList') }"
              class="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
              title="Ordered List"
              type="button"
              @click="editor.chain().focus().toggleOrderedList().run()"
            >
              <i class="ri-list-ordered" />
            </button>
            <button
              :class="{ 'bg-blue-100 dark:bg-blue-900': editor.isActive('blockquote') }"
              class="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
              title="Blockquote"
              type="button"
              @click="editor.chain().focus().toggleBlockquote().run()"
            >
              <i class="ri-double-quotes-l" />
            </button>
            <span class="border-r dark:border-gray-700 mx-1" />
            <button
              :disabled="!editor.can().chain().focus().undo().run()"
              class="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50"
              title="Undo"
              type="button"
              @click="editor.chain().focus().undo().run()"
            >
              <i class="ri-arrow-go-back-line" />
            </button>
            <button
              :disabled="!editor.can().chain().focus().redo().run()"
              class="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50"
              title="Redo"
              type="button"
              @click="editor.chain().focus().redo().run()"
            >
              <i class="ri-arrow-go-forward-line" />
            </button>
          </div>
          
          <!-- Editor content area -->
          <EditorContent 
            v-if="editor"
            :editor="editor" 
            class="prose dark:prose-invert max-w-none p-4 min-h-[250px]" 
          />
          <div v-else class="flex justify-center items-center min-h-[250px]">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 dark:border-indigo-400" />
          </div>
        </div>

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
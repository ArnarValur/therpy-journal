<!-- pages/journal/[id].vue -->
<script setup lang="ts">
import { onMounted, watch, onBeforeUnmount } from 'vue';
import { useEditor, EditorContent } from '@tiptap/vue-3';
import StarterKit from '@tiptap/starter-kit';
import BackButton from '~/components/button/BackButton.vue';

// Get required composables
const { loadEntry, entry, isLoading, error } = useJournalEntry();
const authStore = useAuthStore();
const router = useRouter();
const route = useRoute();

// Format date in a readable way
const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
};

// Get class for sentiment circle
const getSentimentClass = (entry: JournalEntry | null) => {
  if (!entry?.sentiments) return 'bg-gray-400 dark:bg-gray-500';
  
  // Calculate average sentiment value
  const values = Object.values(entry.sentiments) as number[];
  if (!values.length) return 'bg-gray-400 dark:bg-gray-500';
  
  const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
  
  if (avg >= 7) return 'bg-green-500';
  if (avg <= 3) return 'bg-red-500';
  return 'bg-yellow-500';
};

// Create a read-only editor for content display
const editor = useEditor({
  content: '',
  extensions: [StarterKit],
  editable: false,
});

// Update editor content when entry changes
watch(() => entry.value?.content, (newContent) => {
  if (editor.value && newContent) {
    editor.value.commands.setContent(newContent);
  }
}, { immediate: true });

// Clean up editor on unmount
onBeforeUnmount(() => {
  if (editor.value) {
    editor.value.destroy();
  }
});

// Check if user is authenticated and load entry
onMounted(async () => {
  if (!authStore.isLoggedIn) {
    router.push('/auth/login');
    return;
  }

  const id = route.params.id as string;
  await loadEntry(id);
});

// Handle edit entry
const handleEditEntry = () => {
  const { $routes } = useNuxtApp();
  router.push($routes.JOURNAL.EDIT(route.params.id as string));
};

// Handle back to list
const handleBackToList = () => {
  const { $routes } = useNuxtApp();
  router.push($routes.JOURNAL.HOME);
};
</script>

<template>
  <div class="space-y-6 sm:space-y-8 p-4 sm:p-6 bg-gray-50 dark:bg-transparent rounded-lg">

    <!-- Header section and new entry button -->
    <div class="flex items-center justify-between mb-6">
      <h1 class=""/>
      <div class="flex gap-3">
        <BackButton 
          class="bg-blue-500"
          @click="handleBackToList"
        >
          <i class="ri-arrow-left-line mr-2" />
          Back
        </BackButton>
      </div>
    </div>

    <!-- Loading state -->
    <div v-if="isLoading" class="flex justify-center py-12">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 dark:border-indigo-400" />
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

    <!-- Journal entry content -->
    <div v-if="!isLoading && entry" class="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
      <div class="p-6">
        <!-- Header -->
        <div class="flex justify-between items-start mb-6">
          <div class="flex items-start space-x-3">
            <div 
              class="w-3 h-3 rounded-full mt-2 flex-shrink-0" 
              :class="getSentimentClass(entry)"
            />
            <h1 class="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white">
              {{ entry.title }}
            </h1>
          </div>
          <div class="text-sm text-gray-500 dark:text-gray-400">
            {{ formatDate(entry.createdAt instanceof Date ? entry.createdAt : new Date()) }}
          </div>
        </div>

        <!-- Tags -->
        <div v-if="entry.tags && entry.tags.length > 0" class="flex flex-wrap gap-2 mb-6">
          <span 
            v-for="tag in entry.tags" 
            :key="tag"
            class="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full dark:bg-blue-900 dark:text-blue-200"
          >
            {{ tag }}
          </span>
        </div>

        <!-- Content -->
        <div class="prose dark:prose-invert max-w-none">
          <EditorContent :editor="editor" />
        </div>

        <!-- Sentiments if present -->
        <div v-if="entry.sentiments && Object.keys(entry.sentiments).length > 0" class="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
          <h2 class="text-lg font-semibold text-gray-800 dark:text-white mb-4">Mood Analysis</h2>

          <!-- TODO: componentize this -->
          <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            <div 
              v-for="(value, key) in entry.sentiments" 
              :key="key"
              class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4"
            >
              <div class="text-sm text-gray-600 dark:text-gray-400 capitalize mb-1">{{ key }}</div>
              <div class="text-lg font-semibold text-gray-800 dark:text-white">{{ value }}/10</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Action buttons -->
      <div class="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-4 flex justify-end">
        <button 
          type="button"
          class="px-4 py-2 text-sm text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-900/30 rounded border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors flex items-center"
          @click="handleEditEntry"
        >
          <i class="ri-edit-line mr-2" />
          Edit Entry
        </button>
      </div>
    </div>
  </div>
</template> 
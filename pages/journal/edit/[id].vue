<!-- pages/journal/edit/[id].vue -->
<script setup lang="ts">
import { ref, onMounted, computed, onBeforeUnmount } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '~/stores/auth';
import { useNuxtApp } from '#app';
import { useJournalEntry } from '~/composables/useJournalEntry';
import { useAutosave, type AutosavableData } from '~/composables/useAutosave';

import JournalEntryForm from '~/components/form/JournalEntryForm.vue';

// Get route and route params
const route = useRoute();
const router = useRouter();
const entryId = computed(() => route.params.id as string);

// Get required composables
const { getEntry, updateEntry, isLoading: apiLoading, error: apiError } = useJournalEntry();
const authStore = useAuthStore();
const { $routes } = useNuxtApp();

// Journal entry state
const loadingEntry = ref(true);
const entryIsDraft = ref(false);

// Define type for journal entry data
interface JournalEntryData extends AutosavableData {
  title: string;
  content: string | null;
  tags: string[];
  sentiments: Record<string, number>;
}

// Initial data for the form (will be populated after loading)
const initialData = ref<JournalEntryData>({
  title: '',
  content: null,
  tags: [],
  sentiments: {}
});

// Create the save function for the autosave composable
const saveJournalEntry = async (data: JournalEntryData, isDraft: boolean): Promise<boolean> => {
  if (!entryId.value) return false;
  
  const updatedEntry = {
    title: data.title || (isDraft ? 'Untitled Draft' : ''),
    content: data.content || '<p></p>',
    tags: data.tags || [],
    sentiments: data.sentiments || {},
    isDraft: isDraft // Use the isDraft parameter
  };

  return await updateEntry(entryId.value, updatedEntry);
};

// Initialize the autosave composable
const autosave = useAutosave<JournalEntryData>({
  initialData: initialData.value,
  saveFn: saveJournalEntry,
  debounceMs: 2000,
  entityId: entryId
});

// For backward compatibility
const isLoading = computed(() => apiLoading.value);
const error = computed(() => apiError.value || autosave.error.value);

// Check if user is authenticated and load journal entry
onMounted(async () => {
  if (!authStore.isLoggedIn) {
    await router.push($routes.AUTH.LOGIN);
    return;
  }
  
  await loadJournalEntry();
});

// Load the journal entry data
const loadJournalEntry = async () => {
  loadingEntry.value = true;
  
  try {
    const entry = await getEntry(entryId.value);
    
    if (!entry) {
      // Entry not found or error occurred
      await router.push($routes.JOURNAL.HOME);
      return;
    }
    
    // Populate the form data
    const loadedData: JournalEntryData = {
      title: entry.title,
      content: entry.content,
      tags: entry.tags || [],
      sentiments: entry.sentiments || {}
    };
    
    // Update initial data ref
    initialData.value = { ...loadedData };
    
    // Set original data in autosave to track changes properly
    autosave.setOriginalData(loadedData);
    
    // Keep track of whether this is a draft
    entryIsDraft.value = entry.isDraft || false;
  } catch (err) {
    console.error('Error loading journal entry:', err);
  } finally {
    loadingEntry.value = false;
  }
};

// Handle form submission
const handleSubmit = async (data: {
  title: string;
  content: string | null;
  tags: string[];
  sentiments: Record<string, number>;
  isDraft: boolean;
}) => {
  try {
    const success = await autosave.saveData(data, false);
    
    if (success) {
      await router.push($routes.JOURNAL.HOME);
    }
  } catch (err) {
    console.error('Error saving journal entry:', err);
  } finally {
    autosave.finishSaving();
  }
};

// Handle form updates for autosave
const handleFormUpdate = (data: {
  title: string;
  content: string | null;
  tags: string[];
  sentiments: Record<string, number>;
}) => {
  autosave.updateFormData(data);
};

// Handle Cancel button click - explicitly mark as draft and redirect
const handleCancel = async () => {
  // Will only save as draft if changes were made
  await autosave.saveAsDraft();
  router.push($routes.JOURNAL.HOME);
};

// Clean up before component unmount
onBeforeUnmount(async () => {
  // Will only save as draft if changes were made
  await autosave.saveAsDraft();
});
</script>

<template>
  <div class="space-y-6 sm:space-y-8 p-4 sm:p-6 bg-gray-50 dark:bg-transparent rounded-lg">

    <!-- Header section and new entry button -->
    <div class="flex items-center justify-between mb-6">
      <div class="flex items-center gap-2">
        <h1 class="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white">Edit Journal Entry</h1>
        <span 
          v-if="entryIsDraft || autosave.dataHasChanged.value"
          class="inline-flex items-center px-2.5 py-0.5 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full dark:bg-yellow-900/30 dark:text-yellow-300"
        >
          <i class="ri-draft-line mr-1" />
          Draft
        </span>
      </div>
    </div>

    <!-- Loading state -->
    <div v-if="loadingEntry" class="flex justify-center py-12">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 dark:border-indigo-400" />
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

    <!-- Journal Entry Form -->
    <JournalEntryForm
      v-if="!loadingEntry"
      :initial-data="initialData"
      :is-submitting="isLoading"
      :is-autosaving="autosave.isAutosaving.value"
      :last-autosave-time="autosave.lastAutosaveTime.value"
      @submit="handleSubmit"
      @cancel="handleCancel"
      @update="handleFormUpdate"
    />
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
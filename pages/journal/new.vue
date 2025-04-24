<!-- pages/journal/new.vue -->
<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useNuxtApp } from '#app';
import { tryOnBeforeUnmount } from '@vueuse/core';
import JournalEntryForm from '~/components/form/JournalEntryForm.vue';
import { useAutosave, type AutosavableData } from '~/composables/useAutosave';

// Get required composables
const { createEntry, updateEntry } = useJournalEntry();
const authStore = useAuthStore();
const router = useRouter();
const { $routes } = useNuxtApp();

// Define type for journal entry data
interface JournalEntryData extends AutosavableData {
  title: string;
  content: string | null;
  tags: string[];
  sentiments: Record<string, number>;
}

// Initial data for the new entry form
const initialData: JournalEntryData = {
  title: '',
  content: null,
  tags: [],
  sentiments: {}
};

// Create the save function for the autosave composable
const saveJournalEntry = async (data: JournalEntryData, isDraft: boolean): Promise<string | boolean> => {
  const entry = {
    title: data.title || (isDraft ? 'Untitled Draft' : ''),
    content: data.content || '<p></p>', // Use HTML content directly
    tags: data.tags || [],
    sentiments: data.sentiments || {},
    isDraft
  };

  // If we have an existing draft ID, update it
  if (autosave.entityId.value) {
    const success = await updateEntry(autosave.entityId.value, entry);
    return success;
  } else {
    // Create a new entry
    const result = await createEntry(entry);
    if (result?.id) {
      return result.id;
    }
    return false;
  }
};

// Initialize the autosave composable
const autosave = useAutosave<JournalEntryData>({
  initialData,
  saveFn: saveJournalEntry,
  debounceMs: 2000
});

// For backward compatibility
const isLoading = ref(false);
const error = ref<string | null>(null);

// Check if user is authenticated
onMounted(async () => {
  if (!authStore.isLoggedIn) {
    await router.push($routes.AUTH.LOGIN);
    return;
  }
  
  // Set the original data for proper change tracking
  autosave.setOriginalData(initialData);
});

// Handle form submission
const handleSubmit = async (data: {
  title: string;
  content: string | null;
  tags: string[];
  sentiments: Record<string, number>;
  isDraft: boolean;
}) => {
  isLoading.value = true;
  error.value = null;

  try {
    const success = await autosave.saveData(data, false);
    
    if (success) {
      await router.push($routes.JOURNAL.HOME);
    } else {
      error.value = autosave.error.value || 'Failed to save entry';
    }
  } catch (err) {
    console.error('Failed to save entry:', err);
    error.value = 'Failed to save entry';
  } finally {
    isLoading.value = false;
    autosave.finishSaving();
  }
};

// Handle form update for autosave
const handleFormUpdate = (data: {
  title: string;
  content: string | null;
  tags: string[];
  sentiments: Record<string, number>;
}) => {
  autosave.updateFormData(data);
};

// Handle Cancel button click
const handleCancel = async () => {
  // Will only save as draft if changes were made
  await autosave.saveAsDraft();
  router.push($routes.JOURNAL.HOME);
};

// Add cleanup to ensure drafts are saved when navigating away
tryOnBeforeUnmount(async () => {
  // Will only save as draft if changes were made
  await autosave.saveAsDraft();
});
</script>

<template>
  <div class="space-y-6 sm:space-y-8 p-4 sm:p-6 bg-gray-50 dark:bg-transparent rounded-lg">

    <!-- Header section and new entry button -->
    <div class="flex items-center justify-between mb-6">
      <div class="flex items-center gap-2">
        <h1 class="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white">New Journal Entry</h1>
        <span 
          v-if="autosave.dataHasChanged.value"
          class="inline-flex items-center px-2.5 py-0.5 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full dark:bg-yellow-900/30 dark:text-yellow-300"
        >
          <i class="ri-draft-line mr-1" />
          Draft
        </span>
      </div>
      <div class="flex gap-3">
        <p>Date: {{ new Date().toLocaleDateString() }}</p>
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

    <!-- Journal Entry form -->
    <JournalEntryForm
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
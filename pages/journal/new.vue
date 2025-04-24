<!-- pages/journal/new.vue -->
<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useNuxtApp } from '#app';
import { tryOnBeforeUnmount } from '@vueuse/core';
import JournalEntryForm from '~/components/form/JournalEntryForm.vue';

// Get required composables
const { createEntry, updateEntry } = useJournalEntry();
const authStore = useAuthStore();
const router = useRouter();
const { $routes } = useNuxtApp();

// Journal entry state
const isLoading = ref(false);
const error = ref<string | null>(null);
const draftId = ref<string | null>(null);
const isAutosaving = ref(false);
const lastAutosaveTime = ref<Date | null>(null);
const isSaving = ref(false);
const isManualSaving = ref(false);

// Form data
const formData = ref<{
  title: string;
  content: string | null;
  tags: string[];
  sentiments: Record<string, number>;
}>({
  title: '',
  content: null,
  tags: [],
  sentiments: {}
});

// Check if user is authenticated
onMounted(async () => {
  if (!authStore.isLoggedIn) {
    await router.push($routes.AUTH.LOGIN);
    return;
  }
});

// Handle form submission
const handleSubmit = async (data: {
  title: string;
  content: string | null;
  tags: string[];
  sentiments: Record<string, number>;
  isDraft: boolean;
}) => {
  isManualSaving.value = true;
  isLoading.value = true;
  error.value = null;

  try {
    const entry = {
      title: data.title,
      content: data.content || '<p></p>', // Use HTML content directly
      tags: data.tags,
      sentiments: data.sentiments,
      isDraft: false // Explicitly mark as not a draft
    };

    let success = false;
    // Get current draft ID
    const currentDraftId = draftId.value;

    if (currentDraftId) {
      // Update the existing entry and mark it as not a draft
      success = await updateEntry(currentDraftId, entry);
    } else {
      // Create new entry
      const result = await createEntry(entry);
      if (result?.id) {
        draftId.value = result.id;
        success = true;
      } else {
        console.error('Failed to create new entry');
        error.value = 'Failed to save entry';
        success = false;
      }
    }

    if (success) {
      await router.push($routes.JOURNAL.HOME);
    } else {
      isManualSaving.value = false;
      isLoading.value = false;
      console.error('Failed to save entry');
      error.value = 'Failed to save entry';
    }
  } catch (err) {
    isManualSaving.value = false;
    isLoading.value = false;
    console.error('Failed to save entry:', err);
    error.value = 'Failed to save entry';
  } finally {
    if (!isManualSaving.value) {
      isLoading.value = false;
    }
  }
};

// Handle form update for autosave
const handleFormUpdate = async (data: {
  title: string;
  content: string | null;
  tags: string[];
  sentiments: Record<string, number>;
}) => {
  // Don't autosave if we're in the middle of a manual save
  if (isSaving.value || isManualSaving.value) return;

  // Store current form data for later use
  formData.value = data;

  const currentEntryId = draftId.value;

  if (!data.title && !data.content) return;
  
  isAutosaving.value = true;
  
  try {
    const entry = {
      title: data.title,
      content: data.content || '<p></p>', // Use HTML content directly
      tags: data.tags || [],
      sentiments: data.sentiments,
      isDraft: true // Always mark as draft when autosaving
    };

    if (currentEntryId) {
      // Update existing draft
      await updateEntry(currentEntryId, entry);
    } else {
      // Create new draft
      const result = await createEntry(entry);
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
};

// Function to ensure entry is saved as draft when navigating away
const saveAsDraft = async () => {
  // Skip if we never started writing anything
  if ((!formData.value.title && !formData.value.content) || isManualSaving.value) return;  
  try {
    const entry = {
      title: formData.value.title || 'Untitled Draft',
      content: formData.value.content || '<p></p>',
      tags: formData.value.tags || [],
      sentiments: formData.value.sentiments,
      isDraft: true // Explicitly mark as draft
    };

    // If we already have a draft ID, update it
    if (draftId.value) {
      await updateEntry(draftId.value, entry);
    } else {
      // Otherwise create a new draft entry
      const result = await createEntry(entry);
      if (result?.id) {
        draftId.value = result.id;
      }
    }
  } catch (err) {
    console.error('Failed to save as draft:', err);
  }
};

// Handle Cancel button click - explicitly mark as draft
const handleCancel = async () => {
  await saveAsDraft();
  router.push($routes.JOURNAL.HOME);
};

// Add cleanup to ensure drafts are saved when navigating away
tryOnBeforeUnmount(async () => {
  // Save as draft if needed
  await saveAsDraft();
});
</script>

<template>
  <div class="space-y-6 sm:space-y-8 p-4 sm:p-6 bg-gray-50 dark:bg-transparent rounded-lg">

    <!-- Header section and new entry button -->
    <div class="flex items-center justify-between mb-6">
      <div class="flex items-center gap-2">
        <h1 class="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white">New Journal Entry</h1>
        <span 
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
      :is-autosaving="isAutosaving"
      :last-autosave-time="lastAutosaveTime"
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
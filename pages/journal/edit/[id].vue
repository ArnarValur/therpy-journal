<!-- pages/journal/edit/[id].vue -->
<script setup lang="ts">
import { ref, onMounted, computed, onBeforeUnmount } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '~/stores/auth';
import { useNuxtApp } from '#app';
import { useJournalEntry } from '~/composables/useJournalEntry';
import { useDebounceFn } from '@vueuse/core';

import JournalEntryForm from '~/components/form/JournalEntryForm.vue';

// Get route and route params
const route = useRoute();
const router = useRouter();
const entryId = computed(() => route.params.id as string);

// Get required composables
const { getEntry, updateEntry, isLoading, error } = useJournalEntry();
const authStore = useAuthStore();
const { $routes } = useNuxtApp();

// Journal entry state
const loadingEntry = ref(true);
const entryIsDraft = ref(false);
const isAutosaving = ref(false);
const lastAutosaveTime = ref<Date | null>(null);

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
    formData.value = {
      title: entry.title,
      content: entry.content,
      tags: entry.tags || [],
      sentiments: entry.sentiments || {}
    };
    
    // Keep track of whether this is a draft
    entryIsDraft.value = entry.isDraft || false;
  } catch (err) {
    console.error('Error loading journal entry:', err);
  } finally {
    loadingEntry.value = false;
  }
};

// Create a debounced autosave function
const debouncedAutosave = useDebounceFn(async (data: {
  title: string;
  content: string | null;
  tags: string[];
  sentiments: Record<string, number>;
}) => {
  const currentEntryId = entryId.value;
  
  // Check if the entry ID is valid
  if (!currentEntryId) {
    isAutosaving.value = false;
    return;
  }

  // Check auth state directly
  if (!authStore.isLoggedIn || !authStore.user?.id) {
    isAutosaving.value = false;
    return;
  }
  
  if (!data.title && !data.content) {
    isAutosaving.value = false;
    return;
  }
  
  isAutosaving.value = true;
  
  try {
    const updatedEntry = {
      title: data.title,
      content: data.content || '<p></p>',
      tags: data.tags || [],
      sentiments: data.sentiments || {},
      isDraft: true // Mark as draft when autosaving
    };

    await updateEntry(currentEntryId, updatedEntry);
    lastAutosaveTime.value = new Date();
  } catch (err) {
    console.error('Autosave failed:', err);
  } finally {
    isAutosaving.value = false;
  }
}, 2000);

// Handle form submission
const handleSubmit = async (data: {
  title: string;
  content: string | null;
  tags: string[];
  sentiments: Record<string, number>;
  isDraft: boolean;
}) => {
  const updatedEntry = {
    title: data.title,
    content: data.content || '<p></p>',
    tags: data.tags,
    sentiments: data.sentiments,
    isDraft: false // Mark as not a draft when explicitly saving
  };

  const success = await updateEntry(entryId.value, updatedEntry);
  
  if (success) {
    await router.push($routes.JOURNAL.HOME);
  }
};

// Handle form updates for autosave
const handleFormUpdate = (data: {
  title: string;
  content: string | null;
  tags: string[];
  sentiments: Record<string, number>;
}) => {
  // Update local form data
  formData.value = data;
  
  // Trigger autosave
  debouncedAutosave(data);
};

// Function to ensure entry is saved as draft when navigating away
const saveAsDraft = async () => {
  // Skip if we haven't changed anything
  if (!formData.value.title && !formData.value.content) return;
  
  try {
    const entry = {
      title: formData.value.title || 'Untitled Draft',
      content: formData.value.content || '<p></p>',
      tags: formData.value.tags || [],
      sentiments: formData.value.sentiments || {},
      isDraft: true // Explicitly mark as draft
    };

    await updateEntry(entryId.value, entry);
  } catch (err) {
    console.error('Failed to save as draft:', err);
  }
};

// Handle Cancel button click - explicitly mark as draft and redirect
const handleCancel = async () => {
  await saveAsDraft();
  router.push($routes.JOURNAL.HOME);
};

// Clean up before component unmount
onBeforeUnmount(async () => {
  // Save as draft if needed before unmounting
  await saveAsDraft();
});
</script>

<template>
  <div class="space-y-6 sm:space-y-8 p-4 sm:p-6 bg-gray-50 dark:bg-transparent rounded-lg">

    <!-- Header section and new entry button -->
    <div class="flex items-center justify-between mb-6">
      <div class="flex items-center gap-2">
        <h1 class="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white">Edit Journal Entry</h1>
        <span 
          v-if="entryIsDraft"
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
      :initial-data="formData"
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
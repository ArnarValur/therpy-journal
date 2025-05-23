// composables/useAutosave.ts
import { ref, computed } from 'vue';
import type { Ref } from 'vue';
import { useDebounceFn } from '@vueuse/core';

// Define a common interface for autosavable data
export interface AutosavableData {
  title?: string;
  content?: string | null;
  [key: string]: unknown;
}

export type AutosaveOptions<T extends AutosavableData> = {
  /**
   * Initial data for the form
   */
  initialData?: T;
  
  /**
   * Function to save the data
   * @param data Current form data
   * @param isDraft Whether to save as draft
   * @returns Promise resolving to a success indicator (true/id or false/null)
   */
  saveFn: (data: T, isDraft: boolean) => Promise<boolean | string | null>;
  
  /**
   * Debounce time in milliseconds
   * @default 2000
   */
  debounceMs?: number;
  
  /**
   * Optional function to check if data is empty (to skip autosave)
   * @param data Current form data
   * @returns Boolean indicating if the data is considered empty
   */
  isEmptyFn?: (data: T) => boolean;
  
  /**
   * Optional function to compare data and check if it has changed
   * @param originalData Original data
   * @param currentData Current form data
   * @returns Boolean indicating if the data has changed
   */
  hasChangedFn?: (originalData: T, currentData: T) => boolean;
  
  /**
   * Optional ID for existing entity
   */
  entityId?: Ref<string | null> | string | null;
};

/**
 * Composable for handling autosave functionality
 */
export function useAutosave<T extends AutosavableData>(options: AutosaveOptions<T>) {
  const {
    initialData = {} as T,
    saveFn,
    debounceMs = 2000,
    isEmptyFn,
    hasChangedFn,
    entityId = null,
  } = options;
  
  // State
  const originalData = ref<T>({ ...initialData } as T);
  const formData = ref<T>({ ...initialData } as T);
  const isAutosaving = ref(false);
  const isSaving = ref(false);
  const isManualSaving = ref(false);
  const lastAutosaveTime = ref<Date | null>(null);
  const error = ref<string | null>(null);
  const savedEntityId = ref<string | null>(typeof entityId === 'string' ? entityId : entityId?.value || null);
  
  // Check if data is empty (to skip autosave)
  const isEmpty = (data: T): boolean => {
    if (isEmptyFn) {
      return isEmptyFn(data);
    }
    
    // Default implementation: check for empty title and content
    return !data.title && !data.content;
  };
  
  // Compare data to see if it has changed
  const hasChanged = (currentData: T): boolean => {
    if (hasChangedFn) {
      return hasChangedFn(originalData.value, currentData);
    }
    
    // Default implementation: stringify and compare
    try {
      const original = JSON.stringify(originalData.value);
      const current = JSON.stringify(currentData);
      return original !== current;
    } catch (e) {
      console.error('Error comparing data:', e);
      return false;
    }
  };
  
  // Computed property to track if data has changed
  const dataHasChanged = computed(() => hasChanged(formData.value));
  
  // Create a debounced autosave function
  const debouncedAutosave = useDebounceFn(async (data: T) => {
    // Don't autosave if manual save in progress
    if (isSaving.value || isManualSaving.value) {
      isAutosaving.value = false;
      return;
    }

    // Don't autosave if data is empty
    if (isEmpty(data)) {
      isAutosaving.value = false;
      return;
    }
    
    // Don't autosave if data hasn't changed
    if (!hasChanged(data)) {
      isAutosaving.value = false;
      return;
    }
    
    isAutosaving.value = true;
    
    try {
      const result = await saveFn(data, true); // Always save as draft when autosaving
      
      if (result && typeof result === 'string' && !savedEntityId.value) {
        savedEntityId.value = result; // Store the ID if it's a new entity
      }
      
      lastAutosaveTime.value = new Date();
    } catch (err) {
      console.error('Autosave failed:', err);
    } finally {
      isAutosaving.value = false;
    }
  }, debounceMs);
  
  // Handle form updates
  const updateFormData = (data: T) => {
    // Update local form data
    formData.value = { ...data };
    
    // Trigger autosave
    isAutosaving.value = true;
    debouncedAutosave(formData.value);
  };
  
  // Save data manually
  const saveData = async (data: T, isDraft: boolean = false): Promise<boolean> => {
    if (isManualSaving.value) return false;
    
    isManualSaving.value = true;
    isSaving.value = true;
    error.value = null;
    
    try {
      const result = await saveFn(data, isDraft);
      
      if (result) {
        if (typeof result === 'string' && !savedEntityId.value) {
          savedEntityId.value = result; // Store the ID if it's a new entity
        }
        
        // Update original data after successful save
        originalData.value = { ...data };
        
        return true;
      } else {
        error.value = 'Failed to save data';
        return false;
      }
    } catch (err) {
      console.error('Failed to save data:', err);
      error.value = 'Failed to save data';
      return false;
    } finally {
      if (!isManualSaving.value) {
        isSaving.value = false;
      }
    }
  };
  
  // Save as draft (for navigation away/cleanup)
  const saveAsDraft = async (): Promise<boolean> => {
    // Skip if data is empty or if manual save is in progress
    if (isEmpty(formData.value) || isManualSaving.value) return false;
    
    // Don't save as draft if no changes were made
    if (!hasChanged(formData.value)) return false;
    
    try {
      return await saveData(formData.value, true);
    } catch (err) {
      console.error('Failed to save as draft:', err);
      return false;
    }
  };
  
  // Reset state when done with manual saving
  const finishSaving = () => {
    isManualSaving.value = false;
    isSaving.value = false;
  };
  
  // Function to reset original data (used when loading an entry)
  const setOriginalData = (data: T) => {
    originalData.value = { ...data };
    formData.value = { ...data };
  };
  
  return {
    // State
    formData,
    originalData,
    isAutosaving,
    isSaving,
    isManualSaving,
    lastAutosaveTime,
    error,
    entityId: savedEntityId,
    dataHasChanged,
    
    // Methods
    updateFormData,
    saveData,
    saveAsDraft,
    finishSaving,
    setOriginalData
  };
} 
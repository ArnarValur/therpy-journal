// stores/featureFlags.ts
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { useFirestore, useDocument } from 'vuefire';
import { doc, setDoc, updateDoc, getDoc } from 'firebase/firestore';

export const useFeatureFlagsStore = defineStore('featureFlags', () => {
  const isLoading = ref(false);
  const error = ref<string | null>(null);
  
  // Get Firestore instance
  const db = useFirestore();
  
  // Use VueFire's useDocument for reactive data
  const { data: flags, pending, error: firebaseError } = useDocument(doc(db, 'settings', 'featureFlags'));
  
  // Set default values if document doesn't exist
  const defaultFlags = {
    showTherapistLink: true
  };
  
  // Create the document if it doesn't exist
  if (!pending.value && !flags.value) {
    setDoc(doc(db, 'settings', 'featureFlags'), defaultFlags);
  }

  // Computed property for easy access to the therapist link flag
  const showTherapistLink = computed(() => {
    if (pending.value) return defaultFlags.showTherapistLink;
    return flags.value?.showTherapistLink ?? defaultFlags.showTherapistLink;
  });

  /**
   * Load feature flags from Firestore
   */
  const loadFeatureFlags = async () => {
    isLoading.value = true;
    error.value = null;

    try {
      const flagsDoc = await getDoc(doc(db, 'settings', 'featureFlags'));
      if (!flagsDoc.exists()) {
        await setDoc(doc(db, 'settings', 'featureFlags'), defaultFlags);
      }
    } catch (err) {
      console.error('Error loading feature flags:', err);
      error.value = 'Failed to load feature flags';
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * Update a feature flag
   */
  const updateFeatureFlag = async (flagName: string, value: boolean) => {
    isLoading.value = true;
    error.value = null;

    try {
      await updateDoc(doc(db, 'settings', 'featureFlags'), {
        [flagName]: value
      });
    } catch (err) {
      console.error('Error updating feature flag:', err);
      error.value = 'Failed to update feature flag';
    } finally {
      isLoading.value = false;
    }
  };

  return {
    flags,
    isLoading,
    error: computed(() => error.value || firebaseError.value?.message),
    showTherapistLink,
    updateFeatureFlag,
    loadFeatureFlags
  };
}); 
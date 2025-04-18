// stores/featureFlags.ts
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export const useFeatureFlagsStore = defineStore('featureFlags', () => {
  const isLoading = ref(false);
  const error = ref<string | null>(null);
  const flags = ref<Record<string, boolean>>({
    showTherapistLink: true, // Default value
  });

  // Computed property for easy access to the therapist link flag
  const showTherapistLink = computed(() => flags.value.showTherapistLink);

  /**
   * Load feature flags from Firestore
   */
  const loadFeatureFlags = async () => {
    isLoading.value = true;
    error.value = null;

    try {
      const { $firebaseDb } = useNuxtApp();
      const flagsDoc = await getDoc(doc($firebaseDb, 'settings', 'featureFlags'));

      if (flagsDoc.exists()) {
        flags.value = { ...flags.value, ...flagsDoc.data() };
      } else {
        // Initialize document with default values if it doesn't exist
        await setDoc(doc($firebaseDb, 'settings', 'featureFlags'), flags.value);
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
      const { $firebaseDb } = useNuxtApp();
      await setDoc(doc($firebaseDb, 'settings', 'featureFlags'), {
        ...flags.value,
        [flagName]: value
      });
      flags.value[flagName] = value;
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
    error,
    showTherapistLink,
    loadFeatureFlags,
    updateFeatureFlag
  };
}); 
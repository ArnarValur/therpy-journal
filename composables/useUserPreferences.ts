// composables/useUserPreferences.ts
import { onMounted, watch, ref } from 'vue';
import { useAuthStore } from '~/stores/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { useFirestore, useDocument } from 'vuefire';
/**
 * User preferences composable
 * Manages and persists user interface preferences like sidebar state, theme, etc.
 */
export function useUserPreferences() {
  const authStore = useAuthStore();
  const db = useFirestore();
  const colorMode = useColorMode();
  
  // Track loading state
  const isLoading = ref(false);
  
  // Initialize sidebar state - with a default that will be immediately replaced on client
  const sidebarOpen = useState<boolean>('sidebar-open', () => false);
  
  // Flag to track if we've already loaded preferences for this session
  const prefsLoaded = ref(false);
  
  // Define type for user preferences
  interface UserPreferences {
    sidebarOpen: boolean;
    theme?: string;
    createdAt?: Date;
    [key: string]: unknown;
  }
  
  // Load preferences from Firestore
  const loadPreferencesFromFirestore = async (userId: string): Promise<UserPreferences | null> => {
    try {
      const userRef = doc(db, 'users', userId);
      const userDoc = await useDocument(userRef);
      
      if (userDoc.value) {
        return {
          sidebarOpen: userDoc.value.preferences?.sidebarOpen ?? true,
          theme: userDoc.value.preferences?.theme ?? 'system'
        };
      }
      return null;
    } catch (err) {
      console.error('Error loading preferences from Firestore:', err);
      return null;
    }
  };
  
  // Save preferences to Firestore
  const savePreferencesToFirestore = async (userId: string, prefs: UserPreferences) => {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        'preferences.sidebarOpen': prefs.sidebarOpen,
        'preferences.theme': prefs.theme || colorMode.preference,
        updatedAt: new Date()
      });
    } catch (err) {
      console.error('Error saving preferences to Firestore:', err);
    }
  };
  
  // Initialize preferences from localStorage first, then update from Firestore
  const initPreferences = async () => {
    // Skip on server side
    if (import.meta.server) return;
    
    // Skip if already loaded
    if (prefsLoaded.value) return;
    
    isLoading.value = true;
    
    try {
      // First try to load from localStorage for instant state
      if (import.meta.client) {
        try {
          if (authStore.user) {
            // Check for user-specific preferences first
            const savedPrefs = localStorage.getItem(`user-prefs-${authStore.user.id}`);
            if (savedPrefs) {
              const prefs = JSON.parse(savedPrefs);
              if (prefs.sidebarOpen !== undefined) {
                sidebarOpen.value = prefs.sidebarOpen;
              }
              if (prefs.theme) {
                colorMode.preference = prefs.theme;
              }
            } else {
              // If no user-specific prefs, check general preference as fallback
              const storedState = localStorage.getItem('sidebar-state');
              if (storedState !== null) {
                sidebarOpen.value = JSON.parse(storedState) === true;
              }
            }
            
            // Then check Firestore asynchronously (may update the UI later)
            const firestorePrefs = await loadPreferencesFromFirestore(authStore.user.id);
            if (firestorePrefs) {
              if (firestorePrefs.sidebarOpen !== undefined) {
                sidebarOpen.value = firestorePrefs.sidebarOpen;
              }
              if (firestorePrefs.theme) {
                colorMode.preference = firestorePrefs.theme;
              }
              
              // Update localStorage to match Firestore
              localStorage.setItem(`user-prefs-${authStore.user.id}`, JSON.stringify({
                sidebarOpen: sidebarOpen.value,
                theme: colorMode.preference
              }));
            } else if (savedPrefs) {
              // If we have localStorage but no Firestore, save to Firestore
              await savePreferencesToFirestore(authStore.user.id, { 
                sidebarOpen: sidebarOpen.value,
                theme: colorMode.preference
              });
            }
          } else {
            // For anonymous users, just use the general preference
            const storedState = localStorage.getItem('sidebar-state');
            if (storedState !== null) {
              sidebarOpen.value = JSON.parse(storedState) === true;
            }
          }
        } catch (e) {
          console.error('Error reading preferences', e);
        }
      }
    } finally {
      prefsLoaded.value = true;
      isLoading.value = false;
    }
  };
  
  // Save current preferences
  const savePreferences = () => {
    if (import.meta.server) return;
    
    if (authStore.user) {
      // For logged-in users, save user-specific preferences
      const prefs = { 
        sidebarOpen: sidebarOpen.value,
        theme: colorMode.preference
      };
      
      // Save to user-specific localStorage
      localStorage.setItem(`user-prefs-${authStore.user.id}`, JSON.stringify(prefs));
      
      // Save to Firestore in the background
      savePreferencesToFirestore(authStore.user.id, prefs).catch(err => {
        console.error('Failed to save preferences to Firestore:', err);
      });
    } else {
      // For anonymous users, save to general preferences only
      localStorage.setItem('sidebar-state', JSON.stringify(sidebarOpen.value));
    }
  };
  
  // Toggle sidebar state
  const toggleSidebar = () => {
    sidebarOpen.value = !sidebarOpen.value;
    savePreferences();
  };
  
  // Watch for theme changes
  watch(() => colorMode.preference, () => {
    if (authStore.user) {
      savePreferences();
    }
  });
  
  // Watch for auth state changes on client-side only
  if (import.meta.client) {
    watch(() => authStore.user, (newUser) => {
      if (newUser) {
        initPreferences();
      }
    });
  }
  
  // Initialize on component mount
  onMounted(() => {
    if (import.meta.client) {
      // Check appropriate localStorage based on auth state
      try {
        if (authStore.user) {
          const savedPrefs = localStorage.getItem(`user-prefs-${authStore.user.id}`);
          if (savedPrefs) {
            const prefs = JSON.parse(savedPrefs);
            if (prefs.sidebarOpen !== undefined) {
              sidebarOpen.value = prefs.sidebarOpen;
            }
            if (prefs.theme) {
              colorMode.preference = prefs.theme;
            }
          }
        } else {
          const storedState = localStorage.getItem('sidebar-state');
          if (storedState !== null) {
            sidebarOpen.value = JSON.parse(storedState) === true;
          }
        }
      } catch (e) {
        console.error('Error reading preferences', e);
      }
      
      // Then do full initialization asynchronously
      initPreferences();
    }
  });
  
  return {
    isLoading,
    sidebarOpen,
    toggleSidebar,
    initPreferences,
    savePreferences
  };
} 
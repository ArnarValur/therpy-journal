// composables/useUserPreferences.ts
import { onMounted, watch, ref } from 'vue';
import { useAuthStore } from '~/stores/auth';
import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';

/**
 * User preferences composable
 * Manages and persists user interface preferences like sidebar state, theme, etc.
 */
export function useUserPreferences() {
  const authStore = useAuthStore();
  const { $firebaseDb } = useNuxtApp();
  
  // Track loading state
  const isLoading = ref(false);
  
  // Initialize sidebar state - with a default that will be immediately replaced on client
  const sidebarOpen = useState<boolean>('sidebar-open', () => false);
  
  // Flag to track if we've already loaded preferences for this session
  const prefsLoaded = ref(false);
  
  // Define type for user preferences
  interface UserPreferences {
    sidebarOpen: boolean;
    createdAt?: Date;
    [key: string]: unknown;
  }
  
  // Load preferences from Firestore
  const loadPreferencesFromFirestore = async (userId: string) => {
    if (import.meta.server) return null;
    
    try {
      if (!$firebaseDb) return null;
      
      const userDoc = await getDoc(doc($firebaseDb, 'users', userId));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        return userData.preferences as Partial<UserPreferences>;
      }
      return null;
    } catch (err) {
      console.error('Error loading preferences from Firestore:', err);
      return null;
    }
  };
  
  // Save preferences to Firestore
  const savePreferencesToFirestore = async (userId: string, prefs: Partial<UserPreferences>) => {
    if (import.meta.server) return;
    
    try {
      if (!$firebaseDb) return;
      
      const userRef = doc($firebaseDb, 'users', userId);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        // Update only the preferences field
        await updateDoc(userRef, {
          preferences: {
            ...userDoc.data()?.preferences,
            ...prefs,
            updatedAt: new Date()
          }
        });
      } else {
        // Create new user document with preferences
        await setDoc(userRef, {
          preferences: {
            ...prefs,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        });
      }
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
            } else {
              // If no user-specific prefs, check general preference as fallback
              const storedState = localStorage.getItem('sidebar-state');
              if (storedState !== null) {
                sidebarOpen.value = JSON.parse(storedState) === true;
              }
            }
            
            // Then check Firestore asynchronously (may update the UI later)
            const firestorePrefs = await loadPreferencesFromFirestore(authStore.user.id);
            if (firestorePrefs && firestorePrefs.sidebarOpen !== undefined) {
              sidebarOpen.value = firestorePrefs.sidebarOpen;
              
              // Update localStorage to match Firestore
              localStorage.setItem(`user-prefs-${authStore.user.id}`, JSON.stringify({
                sidebarOpen: sidebarOpen.value
              }));
            } else if (savedPrefs) {
              // If we have localStorage but no Firestore, save to Firestore
              await savePreferencesToFirestore(authStore.user.id, { 
                sidebarOpen: sidebarOpen.value 
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
          console.error('Error reading sidebar state', e);
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
      const prefs = { sidebarOpen: sidebarOpen.value };
      
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
          }
        } else {
          const storedState = localStorage.getItem('sidebar-state');
          if (storedState !== null) {
            sidebarOpen.value = JSON.parse(storedState) === true;
          }
        }
      } catch (e) {
        console.error('Error reading sidebar state', e);
      }
      
      // Then do full initialization asynchronously
      initPreferences();
    }
  });
  
  return {
    isLoading,
    sidebarOpen,
    toggleSidebar,
    initPreferences
  };
} 
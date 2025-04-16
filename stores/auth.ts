import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { 
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithPopup,
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  updateProfile,
  type AuthError,
  signOut,
  onAuthStateChanged,
  type User as FirebaseUser
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export type User = {
  id: string;
  name: string;
  email: string;
  photoURL?: string;
};

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  const isLoggedIn = computed(() => !!user.value);

  /**
   * Load user data from Firestore
   * @param userId Firebase user ID
   */
  const loadUserFromFirestore = async (userId: string): Promise<Partial<User> | null> => {
    try {
      const { $firebaseDb } = useNuxtApp();
      const userDoc = await getDoc(doc($firebaseDb, 'users', userId));
      
      if (userDoc.exists()) {
        return userDoc.data() as Partial<User>;
      }
      
      return null;
    } catch (err) {
      console.error('Error loading user from Firestore:', err);
      return null;
    }
  };

  /**
   * Save user data to Firestore
   * @param userData User data to save
   */
  const saveUserToFirestore = async (userData: User): Promise<void> => {
    try {
      const { $firebaseDb } = useNuxtApp();
      const userRef = doc($firebaseDb, 'users', userData.id);
      
      // Check if user document already exists
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) {
        // Create new user document
        await setDoc(userRef, {
          ...userData,
          createdAt: new Date()
        });
      }
    } catch (err) {
      console.error('Error saving user to Firestore:', err);
    }
  };

  /**
   * Set user object with merged data from Firebase Auth and Firestore
   */
  const setUserWithMergedData = async (firebaseUser: FirebaseUser) => {
    // Create base user object from Firebase Auth data
    const baseUser: User = {
      id: firebaseUser.uid,
      name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
      email: firebaseUser.email || '',
      photoURL: firebaseUser.photoURL || undefined
    };
    
    // Try to get user data from Firestore
    const firestoreData = await loadUserFromFirestore(firebaseUser.uid);
    
    if (firestoreData) {
      // Merge data, prioritizing Firestore data over Firebase Auth data
      user.value = {
        ...baseUser,
        ...firestoreData,
        // Always keep id and email from Auth for security
        id: baseUser.id,
        email: baseUser.email
      };
    } else {
      // Use only Firebase Auth data and save it to Firestore
      user.value = baseUser;
      await saveUserToFirestore(baseUser);
    }
  };

  /**
   * Login with email and password
   * @param email 
   * @param password 
   */
  const login = async (email: string, password: string) => {
    isLoading.value = true;
    error.value = null;
    
    try {
      const { $firebaseAuth } = useNuxtApp();
      
      const userCredential = await signInWithEmailAndPassword(
        $firebaseAuth,
        email,
        password
      );
      
      const firebaseUser = userCredential.user;
      
      // Set user with merged data from Firebase Auth and Firestore
      await setUserWithMergedData(firebaseUser);
      
    } catch (err) {
      console.error('Login error:', err);
      
      // Handle different Firebase auth errors with user-friendly messages
      const firebaseError = err as AuthError;
      if (firebaseError.code === 'auth/user-not-found' || firebaseError.code === 'auth/wrong-password') {
        error.value = 'Invalid email or password';
      } else if (firebaseError.code === 'auth/invalid-email') {
        error.value = 'Invalid email format';
      } else if (firebaseError.code === 'auth/user-disabled') {
        error.value = 'This account has been disabled';
      } else if (firebaseError.code === 'auth/too-many-requests') {
        error.value = 'Too many failed login attempts. Please try again later.';
      } else {
        error.value = 'Failed to login. Please try again.';
      }
      
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * Login with Google
   */
  const loginWithGoogle = async () => {
    isLoading.value = true;
    error.value = null;
    
    try {
      const { $firebaseAuth } = useNuxtApp();
      const googleProvider = new GoogleAuthProvider();
      
      // Add scopes if needed
      googleProvider.addScope('email');
      googleProvider.addScope('profile');
      
      const result = await signInWithPopup($firebaseAuth, googleProvider);
      const firebaseUser = result.user;
      
      // Set user with merged data from Firebase Auth and Firestore
      await setUserWithMergedData(firebaseUser);
      
    } catch (err) {
      console.error('Google login error:', err);
      
      const firebaseError = err as AuthError;
      if (firebaseError.code === 'auth/popup-closed-by-user') {
        error.value = 'Sign in was cancelled';
      } else if (firebaseError.code === 'auth/popup-blocked') {
        error.value = 'Sign in popup was blocked by your browser';
      } else if (firebaseError.code === 'auth/cancelled-popup-request') {
        // This is normal when a user closes the popup, don't show an error
        return;
      } else if (firebaseError.code === 'auth/account-exists-with-different-credential') {
        error.value = 'An account already exists with the same email address but different sign-in credentials';
      } else {
        error.value = 'Failed to sign in with Google. Please try again.';
      }
      
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * Register a new user
   * @param name 
   * @param email 
   * @param password 
   */
  const register = async (name: string, email: string, password: string) => {
    isLoading.value = true;
    error.value = null;
    
    try {
      const { $firebaseAuth } = useNuxtApp();
      
      // Create the user with email and password
      const userCredential = await createUserWithEmailAndPassword(
        $firebaseAuth,
        email,
        password
      );
      
      const firebaseUser = userCredential.user;
      
      // Update the user profile with the name
      await updateProfile(firebaseUser, {
        displayName: name
      });
      
      // Create user object
      const newUser: User = {
        id: firebaseUser.uid,
        name: name,
        email: firebaseUser.email || email,
        photoURL: firebaseUser.photoURL || undefined
      };
      
      // Set user in store
      user.value = newUser;
      
      // Save to Firestore
      await saveUserToFirestore(newUser);
      
    } catch (err) {
      console.error('Registration error:', err);
      
      const firebaseError = err as AuthError;
      if (firebaseError.code === 'auth/email-already-in-use') {
        error.value = 'This email is already in use';
      } else if (firebaseError.code === 'auth/invalid-email') {
        error.value = 'Invalid email format';
      } else if (firebaseError.code === 'auth/weak-password') {
        error.value = 'Password is too weak';
      } else {
        error.value = 'Registration failed. Please try again.';
      }
      
      throw err;
    } finally {
      isLoading.value = false;
    }
  };
 
  /**
   * Logout the user
   */
  const logout = async () => {
    isLoading.value = true;
    error.value = null;

    try {
      const { $firebaseAuth } = useNuxtApp();
      
      // Call Firebase signOut method
      await signOut($firebaseAuth);
      
      // Clear user data from store
      user.value = null;
      
      // Clear any sensitive data from local storage if needed
      localStorage.removeItem('user-session-data');
      
      // Clear any other auth-related state if needed
      
      // Return success for UI handling
      return { success: true };
    } catch (err) {
      console.error('Logout error:', err);
      
      // Set appropriate error message
      const firebaseError = err as AuthError;
      if (firebaseError.code?.includes('network')) {
        error.value = 'Network error during logout. You may still be logged in on the server.';
      } else {
        error.value = 'Failed to logout. Please try again.';
      }
      
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * Check if the user is authenticated
   */
  const checkAuth = async () => {
    isLoading.value = true;
    
    const isServer = import.meta.server;
    const context = isServer ? '[SERVER]' : '[CLIENT]';
    
    try {
      // Skip auth check on server side - we'll handle auth on client only
      if (isServer) {
        console.log(`${context} Auth check skipped on server`);
        isLoading.value = false;
        return { user: null, unsubscribe: () => {} };
      }
      
      const nuxtApp = useNuxtApp();
      
      // Check if Firebase Auth is available
      if (!nuxtApp.$firebaseAuth) {
        console.warn(`${context} Firebase Auth not yet initialized in checkAuth`);
        isLoading.value = false;
        return { user: null, unsubscribe: () => {} };
      }
      
      const { $firebaseAuth } = nuxtApp;
      
      console.log(`${context} Setting up auth state listener`);
      
      return new Promise((resolve) => {
        // Set up persistent auth state listener
        const unsubscribe = onAuthStateChanged($firebaseAuth, async (firebaseUser) => {
          if (firebaseUser) {
            // User is signed in - load merged data
            await setUserWithMergedData(firebaseUser);
            console.log(`${context} Auth state changed: User signed in`, user.value?.name);
          } else {
            // User is signed out
            console.log(`${context} Auth state changed: User signed out`);
            user.value = null;
          }
          
          isLoading.value = false;
          resolve({ user: user.value, unsubscribe });
        });
      });
    } catch (err) {
      console.error(`${context} Auth check error:`, err);
      isLoading.value = false;
      return { user: null, unsubscribe: () => {} };
    }
  };

  /**
   * Initialize the auth state on app boot
   */
  const initialize = async () => {
    // Set loading to true only if we're not already logged in
    if (!user.value) {
      isLoading.value = true;
    }
    
    const isServer = import.meta.server;
    const context = isServer ? '[SERVER]' : '[CLIENT]';
    
    try {
      // Only run full initialization on client-side
      if (isServer) {
        console.log(`${context} Auth initialization skipped on server`);
        isLoading.value = false;
        return null;
      }
      
      const nuxtApp = useNuxtApp();
      
      // Check if Firebase Auth is available
      if (!nuxtApp.$firebaseAuth) {
        console.warn(`${context} Firebase Auth not yet initialized`);
        isLoading.value = false;
        return null;
      }
      
      const { $firebaseAuth } = nuxtApp;
      
      // Check if user is already logged in (e.g., from a previous session)
      const currentUser = $firebaseAuth.currentUser;
      
      if (currentUser) {
        // User is already signed in - load merged data
        await setUserWithMergedData(currentUser);
        console.log(`${context} User already signed in:`, user.value?.name);
      } else {
        console.log(`${context} No user currently signed in`);
      }
      
      isLoading.value = false;
      return user.value;
    } catch (err) {
      console.error(`${context} Auth initialization error:`, err);
      isLoading.value = false;
      return null;
    }
  };

  /**
   * Reset the user's password
   * @param email 
   */
  const resetPassword = async (email: string) => {
    isLoading.value = true;
    error.value = null;
    
    try {
      const { $firebaseAuth } = useNuxtApp();
      await sendPasswordResetEmail($firebaseAuth, email);
      return true;
    } catch (err) {
      console.error('Password reset error:', err);
      
      const firebaseError = err as AuthError;
      if (firebaseError.code === 'auth/user-not-found') {
        // Don't reveal user existence for security reasons
        return true; // Still return success for security
      } else if (firebaseError.code === 'auth/invalid-email') {
        error.value = 'Invalid email format';
      } else {
        error.value = 'Failed to send password reset email. Please try again.';
      }
      throw err;
    } finally {
      isLoading.value = false;
    }
  };
  
  /**
   * Return the store state
   */
  return {
    user,
    isLoading,
    error,
    isLoggedIn,
    login,
    loginWithGoogle,
    register,
    logout,
    checkAuth,
    resetPassword,
    initialize,
    loadUserFromFirestore,
    saveUserToFirestore
  };
}); 
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { 
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithPopup,
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  updateProfile,
  sendEmailVerification,
  type AuthError,
  signOut,
  onAuthStateChanged,
  type User as FirebaseUser
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { useFirestore, useDocument, useCurrentUser } from 'vuefire';
import { useEncryption } from '~/composables/useEncryption';

export type User = {
  id: string;
  name: string;
  email: string;
  photoURL?: string | null;
  emailVerified?: boolean;
};

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null);
  const isLoading = ref(false);
  const error = ref<string | null>(null);
  const { encrypt } = useEncryption();
  
  // Get Firestore instance using VueFire
  const db = useFirestore();
  
  // Get current Firebase user using VueFire
  const currentUser = useCurrentUser();

  const isLoggedIn = computed(() => !!user.value);

  /**
   * Load user data from Firestore using VueFire
   * @param userId Firebase user ID
   */
  const loadUserFromFirestore = async (userId: string): Promise<Partial<User> | null> => {
    try {
      const { data: userData } = useDocument(doc(db, 'users', userId));
      
      if (userData.value) {
        return userData.value as Partial<User>;
      }
      
      return null;
    } catch (err) {
      console.error('Error loading user from Firestore:', err);
      return null;
    }
  };

  /**
   * Create welcome message for new user
   * @param userId User ID to create welcome message for
   */
  const createWelcomeMessage = async (userId: string) => {
    try {
      const welcomeTitle = 'Welcome to TherapyJournal';
      const welcomeContent = 'Welcome to your new journal! This is a safe space for you to write your thoughts and feelings.';
      const welcomeTag = 'welcome';

      const journalRef = doc(db, 'users', userId, 'journalEntries', 'welcome');
      await setDoc(journalRef, {
        title: encrypt(welcomeTitle),
        content: encrypt(welcomeContent),
        createdAt: new Date(),
        updatedAt: new Date(),
        userId: userId,
        tags: [encrypt(welcomeTag)],
        isDraft: false
      });

      console.log('Welcome message created successfully');
    } catch (err) {
      console.error('Failed to create welcome message:', err);
      // Don't throw - welcome message is optional
    }
  };

  /**
   * Save user data to Firestore and initialize their collections using VueFire
   * @param userData User data to save
   */
  const saveUserToFirestore = async (userData: User): Promise<void> => {
    try {
      const userRef = doc(db, 'users', userData.id);
      
      // Create base user document with required fields
      const userDoc = {
        id: userData.id,
        name: userData.name,
        email: userData.email,
        photoURL: userData.photoURL,
        createdAt: new Date(),
        updatedAt: new Date(),
        preferences: {
          theme: 'system',
          emailNotifications: true,
          sidebarOpen: true
        }
      };

      // Create new user document with initial data
      await setDoc(userRef, userDoc);

      // Set the initial sidebar state in localStorage
      if (import.meta.client) {
        localStorage.setItem(`user-prefs-${userData.id}`, JSON.stringify({
          sidebarOpen: true
        }));
      }

    } catch (err) {
      console.error('Error saving user to Firestore:', err);
      throw new Error('Failed to initialize user data');
    }
  };

  /**
   * Set user object with merged data from Firebase Auth and Firestore
   */
  const setUserWithMergedData = async (firebaseUser: FirebaseUser) => {
    // Create base user object from Firebase Auth data
    const baseUser: User = {
      id: firebaseUser.uid,
      name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || '',
      email: firebaseUser.email || '',
      photoURL: firebaseUser.photoURL || null,
      emailVerified: firebaseUser.emailVerified // Always use the current verification status from Firebase
    };
    
    try {
      // Try to get user data from Firestore
      const firestoreData = await loadUserFromFirestore(firebaseUser.uid);
      
      if (firestoreData) {
        // Merge data, prioritizing Firestore data over Firebase Auth data
        user.value = {
          ...baseUser,
          ...firestoreData,
          // Always keep critical auth data from Firebase Auth for security
          id: baseUser.id,
          email: baseUser.email,
          emailVerified: baseUser.emailVerified // Ensure verification status is from Firebase
        };
      } else {
        // Use only Firebase Auth data and save it to Firestore
        user.value = baseUser;
        await saveUserToFirestore(baseUser);
      }
      
      // Only store authenticated AND verified user data in localStorage
      if (import.meta.client && user.value && user.value.emailVerified) {
        localStorage.setItem('nuxt-auth-user', JSON.stringify(user.value));
      } else if (import.meta.client) {
        // Remove any cached data for unverified users
        localStorage.removeItem('nuxt-auth-user');
      }
    } catch (err) {
      // Clear user value if initialization fails
      user.value = null;
      if (import.meta.client) {
        localStorage.removeItem('nuxt-auth-user');
      }
      throw err; // Re-throw to be handled by the caller
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
      
      // Reload the user to get the latest verification status
      await firebaseUser.reload();
      
      // Check if email is verified before proceeding
      if (!firebaseUser.emailVerified) {
        // Clear any existing user state
        user.value = null;
        if (import.meta.client) {
          localStorage.removeItem('nuxt-auth-user');
        }
        console.log('[AUTH] Login blocked - email not verified');
        error.value = 'Please verify your email before logging in';
        throw {
          code: 'auth/email-not-verified',
          message: 'Email not verified'
        };
      }
      
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
      } else if (error.value !== 'Please verify your email before logging in') {
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
      
      // Reload the user to get the latest verification status
      await firebaseUser.reload();
      
      // Check if email is verified before proceeding
      if (!firebaseUser.emailVerified) {
        // Clear any existing user state
        user.value = null;
        if (import.meta.client) {
          localStorage.removeItem('nuxt-auth-user');
        }
        console.log('[AUTH] Google login blocked - email not verified');
        error.value = 'Please verify your email before logging in';
        throw new Error('Email not verified');
      }
      
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
      } else if (error.value !== 'Please verify your email before logging in') {
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
      
      // Send email verification
      await sendEmailVerification(firebaseUser);
      
      // Create user object
      const newUser: User = {
        id: firebaseUser.uid,
        name: name,
        email: firebaseUser.email || email,
        photoURL: null,
        emailVerified: firebaseUser.emailVerified
      };
      
      // Save to Firestore first before setting in store
      await saveUserToFirestore(newUser);
      
      // Only set user in store if Firestore save was successful
      user.value = newUser;
      
      // Store in localStorage for faster loading on refresh
      if (import.meta.client) {
        localStorage.setItem('nuxt-auth-user', JSON.stringify(newUser));
      }

      // Wait a bit to ensure auth state is fully propagated
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Create welcome message after user is fully authenticated
      if (currentUser.value) {
        await createWelcomeMessage(newUser.id);
      }
      
      return { 
        user: newUser, 
        verificationEmailSent: true 
      };
      
    } catch (err) {
      // If there's an error, we need to clean up
      console.error('Registration error:', err);
      
      // Clear any partial user state
      user.value = null;
      if (import.meta.client) {
        localStorage.removeItem('nuxt-auth-user');
      }
      
      // Try to sign out the user if they were partially created
      try {
        const { $firebaseAuth } = useNuxtApp();
        if ($firebaseAuth.currentUser) {
          await signOut($firebaseAuth);
        }
      } catch (signOutErr) {
        console.error('Error cleaning up failed registration:', signOutErr);
      }
      
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
      await signOut($firebaseAuth);
      
      // Clear user data
      user.value = null;
      
      // Clear cached user data from localStorage
      if (import.meta.client) {
        localStorage.removeItem('nuxt-auth-user');
      }
      
      return true;
    } catch (err) {
      console.error('Logout error:', err);
      error.value = 'Failed to logout. Please try again.';
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
      
      const { $firebaseAuth } = useNuxtApp();
      
      // Use VueFire's useCurrentUser instead of direct Firebase Auth
      if (!currentUser.value) {
        console.log(`${context} No user currently signed in`);
        isLoading.value = false;
        return { user: null, unsubscribe: () => {} };
      }
      
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
      });
      
      return { user: user.value, unsubscribe };
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

      // Check for cached user data in localStorage for immediate display
      if (import.meta.client) {
        try {
          const cachedUser = localStorage.getItem('nuxt-auth-user');
          if (cachedUser) {
            const parsedUser = JSON.parse(cachedUser) as User;
            // Only use cached data if the user was verified
            if (parsedUser.emailVerified) {
              user.value = parsedUser;
              console.log('[CLIENT] Using cached user data:', user.value.name);
            } else {
              // Remove invalid cached data
              localStorage.removeItem('nuxt-auth-user');
            }
          }
        } catch (err) {
          console.error('[CLIENT] Error reading cached user data:', err);
          // Continue with normal initialization if localStorage fails
          localStorage.removeItem('nuxt-auth-user');
        }
      }
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
      
      // Use VueFire's useCurrentUser instead of direct Firebase Auth
      if (!currentUser.value) {
        // If we loaded a cached user but Firebase says we're not logged in,
        // clear the cached user to prevent stale data
        if (user.value && import.meta.client) {
          console.log(`${context} Cached user found but Firebase says not logged in, clearing cache`);
          user.value = null;
          localStorage.removeItem('nuxt-auth-user');
        }
        console.log(`${context} No user currently signed in`);
        isLoading.value = false;
        return null;
      }
      
      // Reload the current user to get fresh data
      await currentUser.value.reload();
      
      // Only proceed with initialization if email is verified
      if (!currentUser.value.emailVerified) {
        console.log(`${context} User email not verified, clearing user state`);
        user.value = null;
        if (import.meta.client) {
          localStorage.removeItem('nuxt-auth-user');
        }
        isLoading.value = false;
        return null;
      }
      
      // User is already signed in - load merged data
      await setUserWithMergedData(currentUser.value);
      console.log(`${context} User already signed in:`, user.value?.name);
      console.log(`${context} Email verification status:`, user.value?.emailVerified);
      
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
   * Send verification email to current user
   */
  const sendVerificationEmail = async () => {
    isLoading.value = true;
    error.value = null;
    
    try {
      const { $firebaseAuth } = useNuxtApp();
      const currentUser = $firebaseAuth.currentUser;
      
      if (!currentUser) {
        throw new Error('No authenticated user found');
      }
      
      await sendEmailVerification(currentUser);
      return true;
    } catch (err) {
      console.error('Failed to send verification email:', err);
      const firebaseError = err as AuthError;
      
      if (firebaseError.code === 'auth/too-many-requests') {
        error.value = 'Too many verification emails sent. Please try again later.';
      } else {
        error.value = 'Failed to send verification email. Please try again.';
      }
      
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * Reload the current user to check for email verification status
   */
  const checkEmailVerification = async () => {
    try {
      const { $firebaseAuth } = useNuxtApp();
      const currentUser = $firebaseAuth.currentUser;
      
      if (!currentUser) return false;
      
      // Reload user to get current email verification status
      await currentUser.reload();
      
      // Update the store with new verification status
      if (user.value) {
        user.value.emailVerified = currentUser.emailVerified;
        
        // Update localStorage
        if (import.meta.client) {
          localStorage.setItem('nuxt-auth-user', JSON.stringify(user.value));
        }
      }
      
      return currentUser.emailVerified;
    } catch (error) {
      console.error('Failed to check email verification:', error);
      return false;
    }
  };

  // Add email verification status computed property
  const isEmailVerified = computed(() => {
    return user.value?.emailVerified ?? false;
  });

  /**
   * Return the store state
   */
  return {
    user,
    isLoading,
    error,
    isLoggedIn,
    isEmailVerified,
    login,
    loginWithGoogle,
    register,
    logout,
    checkAuth,
    resetPassword,
    initialize,
    loadUserFromFirestore,
    saveUserToFirestore,
    sendVerificationEmail,
    checkEmailVerification
  };
}); 
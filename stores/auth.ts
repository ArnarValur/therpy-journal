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
  onAuthStateChanged
} from 'firebase/auth';

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
      
      user.value = {
        id: firebaseUser.uid,
        name: firebaseUser.displayName || email.split('@')[0],
        email: firebaseUser.email || email,
        photoURL: firebaseUser.photoURL || undefined
      };
      
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
      
      user.value = {
        id: firebaseUser.uid,
        name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
        email: firebaseUser.email || '',
        photoURL: firebaseUser.photoURL || undefined
      };
      
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
      
      // Set the user in our store
      user.value = {
        id: firebaseUser.uid,
        name: name,
        email: firebaseUser.email || email,
        photoURL: firebaseUser.photoURL || undefined
      };
      
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

  const logout = async () => {
    try {
      const { $firebaseAuth } = useNuxtApp();
      await signOut($firebaseAuth);
      user.value = null;
    } catch (err) {
      console.error('Logout error:', err);
      error.value = 'Failed to logout. Please try again.';
      throw err;
    }
  };

  const checkAuth = async () => {
    isLoading.value = true;
    
    try {
      const { $firebaseAuth } = useNuxtApp();
      
      return new Promise((resolve) => {
        const unsubscribe = onAuthStateChanged($firebaseAuth, (firebaseUser) => {
          if (firebaseUser) {
            // User is signed in
            user.value = {
              id: firebaseUser.uid,
              name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
              email: firebaseUser.email || '',
              photoURL: firebaseUser.photoURL || undefined
            };
          } else {
            // User is signed out
            user.value = null;
          }
          
          isLoading.value = false;
          resolve(user.value);
          unsubscribe(); // Unsubscribe after initial check
        });
      });
    } catch (err) {
      console.error('Auth check error:', err);
      isLoading.value = false;
      throw err;
    }
  };

  // Add password reset functionality
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
  };
}); 
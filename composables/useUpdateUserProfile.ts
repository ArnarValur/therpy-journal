// composables/useUpdateUserProfile.ts
import { ref } from 'vue';
import { 
  updateProfile,
  updateEmail,
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
  GoogleAuthProvider,
  reauthenticateWithPopup,
  type AuthError,
  type User
} from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { useAuthStore } from '~/stores/auth';

/**
 * Composable for updating user profile information
 */
export default function useUpdateUserProfile() {
  const { $firebaseAuth, $firebaseDb } = useNuxtApp();
  const authStore = useAuthStore();
  const isLoading = ref(false);
  const error = ref<string | null>(null);
  const success = ref<string | null>(null);
  
  /**
   * Sync user data with Firestore
   */
  const syncUserWithFirestore = async (userId: string, data: Record<string, string | null | undefined>) => {
    try {
      // If Firestore is available, update the user document
      if ($firebaseDb) {
        const userRef = doc($firebaseDb, 'users', userId);
        await updateDoc(userRef, data);
      }
    } catch (err) {
      console.error('Error syncing user data with Firestore:', err);
    }
  };
  
  /**
   * Update user display name
   */
  const updateDisplayName = async (name: string) => {
    isLoading.value = true;
    error.value = null;
    success.value = null;
    
    try {
      const currentUser = $firebaseAuth.currentUser;
      if (!currentUser) {
        throw new Error('No authenticated user found');
      }
      
      // Update Firebase profile
      await updateProfile(currentUser, {
        displayName: name
      });
      
      // Update store
      if (authStore.user) {
        authStore.user.name = name;
      }
      
      // Persist to Firestore
      await syncUserWithFirestore(currentUser.uid, { name });
      
      success.value = 'Name updated successfully';
      return true;
    } catch (err) {
      console.error('Update display name error:', err);
      error.value = 'Failed to update name. Please try again.';
      throw err;
    } finally {
      isLoading.value = false;
    }
  };
  
  /**
   * Check if the user signed in with Google
   */
  const isGoogleUser = (currentUser: User) => {
    return currentUser.providerData.some(
      provider => provider.providerId === 'google.com'
    );
  };

  /**
   * Re-authenticate user based on their sign-in method
   */
  const reauthenticateUser = async (currentUser: User, password = '') => {
    if (isGoogleUser(currentUser)) {
      // For Google users, use popup re-authentication
      const googleProvider = new GoogleAuthProvider();
      await reauthenticateWithPopup(currentUser, googleProvider);
    } else if (currentUser.email && password) {
      // For email/password users, use credential re-authentication
      const credential = EmailAuthProvider.credential(
        currentUser.email,
        password
      );
      await reauthenticateWithCredential(currentUser, credential);
    } else {
      throw new Error('Cannot re-authenticate: missing credentials');
    }
  };
  
  /**
   * Update user email
   * Requires recent authentication
   */
  const updateUserEmail = async (newEmail: string, password = '') => {
    isLoading.value = true;
    error.value = null;
    success.value = null;
    
    try {
      const currentUser = $firebaseAuth.currentUser;
      if (!currentUser) {
        throw new Error('No authenticated user found');
      }
      
      // Re-authenticate user before email change
      await reauthenticateUser(currentUser, password);
      
      // Update email
      await updateEmail(currentUser, newEmail);
      
      // Update store
      if (authStore.user) {
        authStore.user.email = newEmail;
      }
      
      // Persist to Firestore
      await syncUserWithFirestore(currentUser.uid, { email: newEmail });
      
      success.value = 'Email updated successfully';
      return true;
    } catch (err) {
      console.error('Update email error:', err);
      
      const firebaseError = err as AuthError;
      if (firebaseError.code === 'auth/requires-recent-login') {
        error.value = 'Please sign in again before changing your email';
      } else if (firebaseError.code === 'auth/invalid-email') {
        error.value = 'Invalid email format';
      } else if (firebaseError.code === 'auth/email-already-in-use') {
        error.value = 'This email is already in use';
      } else if (firebaseError.code === 'auth/wrong-password') {
        error.value = 'Incorrect password';
      } else if (firebaseError.code === 'auth/popup-closed-by-user') {
        error.value = 'Authentication cancelled. Please try again.';
      } else {
        error.value = 'Failed to update email. Please try again.';
      }
      
      throw err;
    } finally {
      isLoading.value = false;
    }
  };
  
  /**
   * Update user password
   * Requires recent authentication
   */
  const updateUserPassword = async (currentPassword: string, newPassword: string) => {
    isLoading.value = true;
    error.value = null;
    success.value = null;
    
    try {
      const currentUser = $firebaseAuth.currentUser;
      if (!currentUser) {
        throw new Error('No authenticated user found');
      }
      
      // Check if password update is applicable
      if (isGoogleUser(currentUser) && !currentUser.email) {
        throw new Error('Google users without an email cannot update their password');
      }
      
      // Re-authenticate user before password change
      await reauthenticateUser(currentUser, currentPassword);
      
      // Update password
      await updatePassword(currentUser, newPassword);
      
      success.value = 'Password updated successfully';
      return true;
    } catch (err) {
      console.error('Update password error:', err);
      
      const firebaseError = err as AuthError;
      if (firebaseError.code === 'auth/requires-recent-login') {
        error.value = 'Please sign in again before changing your password';
      } else if (firebaseError.code === 'auth/weak-password') {
        error.value = 'Password is too weak';
      } else if (firebaseError.code === 'auth/wrong-password') {
        error.value = 'Incorrect current password';
      } else if (firebaseError.code === 'auth/popup-closed-by-user') {
        error.value = 'Authentication cancelled. Please try again.';
      } else {
        error.value = 'Failed to update password. Please try again.';
      }
      
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * Update user photo URL
   */
  const updatePhotoURL = async (photoURL: string) => {
    isLoading.value = true;
    error.value = null;
    success.value = null;
    
    try {
      const currentUser = $firebaseAuth.currentUser;
      if (!currentUser) {
        throw new Error('No authenticated user found');
      }
      
      // Update Firebase profile
      await updateProfile(currentUser, {
        photoURL
      });
      
      // Update store
      if (authStore.user) {
        authStore.user.photoURL = photoURL;
      }
      
      // Persist to Firestore
      await syncUserWithFirestore(currentUser.uid, { photoURL });
      
      success.value = 'Profile picture updated successfully';
      return true;
    } catch (err) {
      console.error('Update photo URL error:', err);
      error.value = 'Failed to update profile picture. Please try again.';
      throw err;
    } finally {
      isLoading.value = false;
    }
  };
  
  /**
   * Remove user photo URL
   */
  const removePhotoURL = async () => {
    isLoading.value = true;
    error.value = null;
    success.value = null;
    
    try {
      const currentUser = $firebaseAuth.currentUser;
      if (!currentUser) {
        throw new Error('No authenticated user found');
      }
      
      // Update Firebase profile with null photoURL
      await updateProfile(currentUser, {
        photoURL: null
      });
      
      // Update store
      if (authStore.user) {
        authStore.user.photoURL = undefined;
      }
      
      // Persist to Firestore - explicitly set to null 
      await syncUserWithFirestore(currentUser.uid, { photoURL: null });
      
      success.value = 'Profile picture removed successfully';
      return true;
    } catch (err) {
      console.error('Remove photo URL error:', err);
      error.value = 'Failed to remove profile picture. Please try again.';
      throw err;
    } finally {
      isLoading.value = false;
    }
  };
  
  return {
    isLoading,
    error,
    success,
    updateDisplayName,
    updateUserEmail,
    updateUserPassword,
    updatePhotoURL,
    removePhotoURL
  };
} 
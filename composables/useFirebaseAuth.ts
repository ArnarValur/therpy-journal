import { onAuthStateChanged } from 'firebase/auth';
import { useAuthStore } from '~/stores/auth';

export function useFirebaseAuth() {
  const { $firebaseAuth } = useNuxtApp();
  const authStore = useAuthStore();
  
  onMounted(() => {
    const unsubscribe = onAuthStateChanged($firebaseAuth, (firebaseUser) => {
      if (firebaseUser) {
        // User is logged in, update store
        authStore.user = {
          id: firebaseUser.uid,
          name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
          email: firebaseUser.email || '',
          photoURL: firebaseUser.photoURL || undefined
        };
      } else {
        // User is not logged in
        authStore.user = null;
      }
    });
    
    // Clean up subscription on component unmount
    onUnmounted(() => unsubscribe());
  });
  
  return {
    auth: $firebaseAuth
  };
} 
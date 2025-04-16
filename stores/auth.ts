import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

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
      // This will be implemented with Firebase authentication
      console.log('Login with email and password', email, password);
      
      // Mock user data - will be replaced with Firebase Auth
      user.value = {
        id: '1',
        name: 'Test User',
        email: email,
      };
      
    } catch (err) {
      console.error('Login error:', err);
      error.value = 'Invalid email or password';
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const loginWithGoogle = async () => {
    isLoading.value = true;
    error.value = null;
    
    try {
      // This will be implemented with Firebase Google Auth
      console.log('Login with Google');
      
      // Mock user data - will be replaced with Firebase Auth
      user.value = {
        id: '1',
        name: 'Google User',
        email: 'google@example.com',
        photoURL: 'https://via.placeholder.com/150',
      };
      
    } catch (err) {
      console.error('Google login error:', err);
      error.value = 'Failed to login with Google';
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const register = async (name: string, email: string, password: string) => {
    isLoading.value = true;
    error.value = null;
    
    try {
      // This will be implemented with Firebase authentication
      console.log('Register with', name, email, password);
      
      // Mock user data - will be replaced with Firebase Auth
      user.value = {
        id: '1',
        name: name,
        email: email,
      };
      
    } catch (err) {
      console.error('Registration error:', err);
      error.value = 'Registration failed';
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const logout = async () => {
    try {
      // This will be implemented with Firebase Auth
      console.log('Logout');
      user.value = null;
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const checkAuth = async () => {
    isLoading.value = true;
    
    try {
      // This will be implemented with Firebase Auth
      console.log('Checking auth state');
      
      // For now, simulate no user
      user.value = null;
      
    } catch (err) {
      console.error('Auth check error:', err);
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
  };
}); 
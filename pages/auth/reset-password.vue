<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { confirmPasswordReset, verifyPasswordResetCode } from 'firebase/auth';

// Define page metadata with auth layout
definePageMeta({
  layout: 'auth',
});

const route = useRoute();
const router = useRouter();
const { $firebaseAuth } = useNuxtApp();

const newPassword = ref('');
const confirmPassword = ref('');
const showPassword = ref(false);
const isLoading = ref(false);
const isVerifying = ref(true);
const errorMessage = ref('');
const successMessage = ref('');
const oobCode = ref('');
const email = ref('');

onMounted(async () => {
  // Get the action code from the URL
  oobCode.value = route.query.oobCode as string;
  
  if (!oobCode.value) {
    errorMessage.value = 'Invalid password reset link. Please request a new one.';
    isVerifying.value = false;
    return;
  }
  
  try {
    // Verify the password reset code
    email.value = await verifyPasswordResetCode($firebaseAuth, oobCode.value);
    isVerifying.value = false;
  } catch (error) {
    console.error('Error verifying reset code:', error);
    errorMessage.value = 'This password reset link has expired or is invalid. Please request a new one.';
    isVerifying.value = false;
  }
});

const onSubmit = async () => {
  if (!newPassword.value || !confirmPassword.value) {
    errorMessage.value = 'Please enter and confirm your new password';
    return;
  }
  
  if (newPassword.value !== confirmPassword.value) {
    errorMessage.value = 'Passwords do not match';
    return;
  }
  
  if (newPassword.value.length < 6) {
    errorMessage.value = 'Password must be at least 6 characters';
    return;
  }
  
  errorMessage.value = '';
  isLoading.value = true;
  
  try {
    // Confirm the password reset
    await confirmPasswordReset($firebaseAuth, oobCode.value, newPassword.value);
    successMessage.value = 'Your password has been successfully updated.';
    
    // Redirect to login page after 3 seconds
    setTimeout(() => {
      router.push('/auth/login');
    }, 3000);
  } catch (error) {
    console.error('Error resetting password:', error);
    errorMessage.value = 'Failed to reset password. Please try again or request a new reset link.';
  } finally {
    isLoading.value = false;
  }
};
</script>

<template>
  <div class="space-y-6">
    <div class="text-center">
      <h2 class="text-2xl font-semibold mb-2">Reset Your Password</h2>
      <p class="text-gray-600">Create a new secure password</p>
    </div>
    
    <div v-if="isVerifying" class="flex justify-center p-4">
      <i class="ri-loader-4-line text-blue-500 text-2xl animate-spin" />
      <span class="ml-2">Verifying your link...</span>
    </div>
    
    <div v-else-if="successMessage" class="bg-green-50 text-green-600 p-4 rounded text-center">
      <p>{{ successMessage }}</p>
      <p class="mt-2 text-sm">You will be redirected to the login page shortly.</p>
    </div>
    
    <template v-else>
      <div v-if="errorMessage" class="bg-red-50 text-red-600 p-3 rounded text-sm">
        {{ errorMessage }}
      </div>
      
      <div v-if="email" class="bg-blue-50 text-blue-600 p-3 rounded">
        <p class="text-sm">
          Setting a new password for <strong>{{ email }}</strong>
        </p>
      </div>
      
      <form v-if="!errorMessage || (errorMessage && oobCode)" class="space-y-6" @submit.prevent="onSubmit">
        <div class="space-y-4">
          <div>
            <label for="new-password" class="block text-sm font-medium text-gray-700 mb-1">New Password</label>
            <div class="relative">
              <input 
                id="new-password" 
                v-model="newPassword"
                :type="showPassword ? 'text' : 'password'" 
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-10"
                placeholder="Enter new password"
                required>
              <button 
                type="button"
                class="absolute inset-y-0 right-0 pr-3 flex items-center"
                @click="showPassword = !showPassword"
              >
                <i :class="showPassword ? 'ri-eye-off-line' : 'ri-eye-line'" class="text-gray-500" />
              </button>
            </div>
          </div>
          
          <div>
            <label for="confirm-password" class="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
            <input 
              id="confirm-password" 
              v-model="confirmPassword"
              :type="showPassword ? 'text' : 'password'" 
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Confirm new password"
              required>
          </div>
        </div>
        
        <button
          type="submit"
          class="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-md transition duration-150 ease-in-out flex justify-center items-center"
          :disabled="isLoading"
        >
          <span v-if="isLoading" class="mr-2">
            <i class="ri-loader-4-line animate-spin" />
          </span>
          Reset Password
        </button>
      </form>
      
      <div v-if="errorMessage && !oobCode" class="text-center mt-4">
        <NuxtLink to="/auth/forgot-password" class="text-blue-500 hover:underline">
          Request a new password reset link
        </NuxtLink>
      </div>
      
      <div class="text-center text-sm pt-4">
        <NuxtLink to="/auth/login" class="text-blue-500 hover:underline">
          Back to login
        </NuxtLink>
      </div>
    </template>
  </div>
</template> 
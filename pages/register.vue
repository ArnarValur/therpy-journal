<script setup lang="ts">
import { ref } from 'vue';
import { useAuthStore } from '~/stores/auth';

// Define page metadata with auth layout
definePageMeta({
  layout: 'auth',
  middleware: ['auth']
});

const router = useRouter();
const authStore = useAuthStore();

const name = ref('');
const email = ref('');
const password = ref('');
const confirmPassword = ref('');
const showPassword = ref(false);
const errorMessage = ref('');

const onRegister = async () => {
  // Basic validation
  if (!name.value || !email.value || !password.value) {
    errorMessage.value = 'Please fill in all fields';
    return;
  }
  
  if (password.value !== confirmPassword.value) {
    errorMessage.value = 'Passwords do not match';
    return;
  }
  
  if (password.value.length < 6) {
    errorMessage.value = 'Password must be at least 6 characters';
    return;
  }

  try {
    await authStore.register(name.value, email.value, password.value);
    await router.push('/');
  } catch (error) {
    errorMessage.value = authStore.error || 'Registration failed';
  }
};

const onGoogleRegister = async () => {
  try {
    await authStore.loginWithGoogle();
    await router.push('/');
  } catch (error) {
    errorMessage.value = authStore.error || 'Google registration failed';
  }
};
</script>

<template>
  <div class="space-y-6">
    <div class="text-center">
      <h2 class="text-2xl font-semibold mb-2">Create Account</h2>
      <p class="text-gray-600">Start your therapeutic journey</p>
    </div>

    <div v-if="errorMessage" class="bg-red-50 text-red-600 p-3 rounded text-sm">
      {{ errorMessage }}
    </div>

    <form @submit.prevent="onRegister" class="space-y-4">
      <div>
        <RInput
          v-model="name"
          id="name"
          type="text"
          label="Name"
          placeholder="Your name"
          required
        />
      </div>
      
      <div>
        <RInput
          v-model="email"
          id="email"
          type="email"
          label="Email"
          placeholder="your@email.com"
          required
        />
      </div>
      
      <div>
        <RInput
          v-model="password"
          id="password"
          :type="showPassword ? 'text' : 'password'"
          label="Password"
          placeholder="Your password"
          required
        >
          <template #append>
            <RButton
              variant="ghost"
              size="sm"
              @click="showPassword = !showPassword"
              :aria-label="showPassword ? 'Hide password' : 'Show password'"
            >
              <i :class="showPassword ? 'ri-eye-off-line' : 'ri-eye-line'"></i>
            </RButton>
          </template>
        </RInput>
      </div>
      
      <div>
        <RInput
          v-model="confirmPassword"
          id="confirmPassword"
          :type="showPassword ? 'text' : 'password'"
          label="Confirm Password"
          placeholder="Confirm your password"
          required
        />
      </div>
      
      <RButton
        type="submit"
        variant="primary"
        class="w-full"
        :loading="authStore.isLoading"
      >
        Create Account
      </RButton>
    </form>
    
    <div class="relative">
      <div class="absolute inset-0 flex items-center">
        <div class="w-full border-t border-gray-300"></div>
      </div>
      <div class="relative flex justify-center text-sm">
        <span class="px-2 bg-white text-gray-500">Or continue with</span>
      </div>
    </div>
    
    <RButton
      variant="outline"
      class="w-full"
      @click="onGoogleRegister"
      :loading="authStore.isLoading"
    >
      <i class="ri-google-fill mr-2"></i>
      Google
    </RButton>
    
    <div class="text-center text-sm">
      Already have an account?
      <NuxtLink to="/login" class="text-blue-500 hover:underline">
        Login
      </NuxtLink>
    </div>
  </div>
</template> 
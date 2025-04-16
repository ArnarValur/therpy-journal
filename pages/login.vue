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

const email = ref('');
const password = ref('');
const showPassword = ref(false);
const errorMessage = ref('');

const onEmailLogin = async () => {
  if (!email.value || !password.value) {
    errorMessage.value = 'Please enter both email and password';
    return;
  }

  try {
    await authStore.login(email.value, password.value);
    await router.push('/');
  } catch (error) {
    errorMessage.value = authStore.error || 'Invalid email or password';
  }
};

const onGoogleLogin = async () => {
  try {
    await authStore.loginWithGoogle();
    await router.push('/');
  } catch (error) {
    errorMessage.value = authStore.error || 'Google login failed';
  }
};
</script>

<template>
  <div class="space-y-6">
    <div class="text-center">
      <h2 class="text-2xl font-semibold mb-2">Login</h2>
      <p class="text-gray-600">Welcome back to your journal</p>
    </div>

    <div v-if="errorMessage" class="bg-red-50 text-red-600 p-3 rounded text-sm">
      {{ errorMessage }}
    </div>

    <form @submit.prevent="onEmailLogin" class="space-y-4">
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
      
      <div class="flex justify-end">
        <NuxtLink to="/forgot-password" class="text-sm text-blue-500 hover:underline">
          Forgot password?
        </NuxtLink>
      </div>
      
      <RButton
        type="submit"
        variant="primary"
        class="w-full"
        :loading="authStore.isLoading"
      >
        Login
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
      @click="onGoogleLogin"
      :loading="authStore.isLoading"
    >
      <i class="ri-google-fill mr-2"></i>
      Google
    </RButton>
    
    <div class="text-center text-sm">
      Don't have an account?
      <NuxtLink to="/register" class="text-blue-500 hover:underline">
        Register
      </NuxtLink>
    </div>
  </div>
</template> 
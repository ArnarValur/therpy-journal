<!-- components/SettingsModal.vue -->
<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useAuthStore } from '~/stores/auth';
import useUpdateUserProfile from '~/composables/useUpdateUserProfile';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';

// Props and emits
const props = defineProps({
  isOpen: {
    type: Boolean,
    required: true
  }
});

const emit = defineEmits(['close']);

// Stores and composables
const authStore = useAuthStore();
const user = computed(() => authStore.user);
const { 
  isLoading, 
  error: updateError, 
  success: updateSuccess, 
  updateDisplayName,
  updateUserEmail,
  updateUserPassword,
  updatePhotoURL,
  removePhotoURL
} = useUpdateUserProfile();

// State for active tab
const activeTab = ref('profile');

// Form states
const displayName = ref('');
const newEmail = ref('');
const currentPasswordForEmail = ref('');
const currentPassword = ref('');
const newPassword = ref('');
const confirmNewPassword = ref('');
const photoURL = ref('');
const showCurrentPassword = ref(false);
const showNewPassword = ref(false);
const showEmailPassword = ref(false);
const errorMessage = ref('');
const successMessage = ref('');

// Confirmation dialog state
const showConfirmRemovePhoto = ref(false);

// File upload state
const fileInput = ref<HTMLInputElement | null>(null);
const isUploading = ref(false);
const uploadProgress = ref(0);

// Update the isGoogleUser computed property to check provider data directly
const isGoogleUser = computed(() => {
  if (!user.value) return false;
  
  // Check if the current Firebase user is authenticated with Google
  const { $firebaseAuth } = useNuxtApp();
  const currentUser = $firebaseAuth?.currentUser;
  
  return currentUser?.providerData.some(
    provider => provider.providerId === 'google.com'
  ) || false;
});

// Set initial values when modal opens
const initializeForm = () => {
  if (user.value) {
    displayName.value = user.value.name || '';
    newEmail.value = user.value.email || '';
    photoURL.value = user.value.photoURL || '';
  }
  
  // Reset password fields
  currentPasswordForEmail.value = '';
  currentPassword.value = '';
  newPassword.value = '';
  confirmNewPassword.value = '';
  
  // Reset error/success messages
  errorMessage.value = '';
  successMessage.value = '';
  
  // Set initial tab
  activeTab.value = 'profile';
};

// Watch for update errors/success
watch(() => updateError.value, (newError) => {
  if (newError) {
    errorMessage.value = newError;
    successMessage.value = '';
  }
});

watch(() => updateSuccess.value, (newSuccess) => {
  if (newSuccess) {
    successMessage.value = newSuccess;
    errorMessage.value = '';
  }
});

// Handle name update
const updateName = async () => {
  if (!displayName.value.trim()) {
    errorMessage.value = 'Name cannot be empty';
    return;
  }
  
  try {
    await updateDisplayName(displayName.value.trim());
  } catch (err) {
    console.error('Name update error:', err);
  }
};

// Handle email update
const updateEmail = async () => {
  if (!newEmail.value.trim()) {
    errorMessage.value = 'Email cannot be empty';
    return;
  }
  
  // Password only required for email/password users
  if (!isGoogleUser.value && !currentPasswordForEmail.value) {
    errorMessage.value = 'Please enter your current password';
    return;
  }
  
  try {
    await updateUserEmail(newEmail.value.trim(), currentPasswordForEmail.value);
    currentPasswordForEmail.value = '';
  } catch (err) {
    console.error('Email update error:', err);
  }
};

// Handle password update
const updatePassword = async () => {
  if (isGoogleUser.value) {
    errorMessage.value = 'Password change is not available for Google sign-in users';
    return;
  }
  
  if (!currentPassword.value) {
    errorMessage.value = 'Please enter your current password';
    return;
  }
  
  if (!newPassword.value) {
    errorMessage.value = 'New password cannot be empty';
    return;
  }
  
  if (newPassword.value.length < 6) {
    errorMessage.value = 'New password must be at least 6 characters';
    return;
  }
  
  if (newPassword.value !== confirmNewPassword.value) {
    errorMessage.value = 'Passwords do not match';
    return;
  }
  
  try {
    await updateUserPassword(currentPassword.value, newPassword.value);
    currentPassword.value = '';
    newPassword.value = '';
    confirmNewPassword.value = '';
  } catch (err) {
    console.error('Password update error:', err);
  }
};

// Handle photo URL update
const updateProfilePicture = async () => {
  if (!photoURL.value.trim()) {
    errorMessage.value = 'Please enter a valid URL';
    return;
  }
  
  try {
    await updatePhotoURL(photoURL.value.trim());
  } catch (err) {
    console.error('Photo URL update error:', err);
  }
};

// Open confirmation dialog for photo removal
const confirmRemovePhoto = () => {
  showConfirmRemovePhoto.value = true;
};

// Cancel photo removal
const cancelRemovePhoto = () => {
  showConfirmRemovePhoto.value = false;
};

// Handle photo URL removal after confirmation
const handleRemovePhoto = async () => {
  try {
    await removePhotoURL();
    photoURL.value = '';
    showConfirmRemovePhoto.value = false;
  } catch (err) {
    console.error('Photo URL removal error:', err);
  }
};

// Trigger file input click
const triggerFileUpload = () => {
  if (fileInput.value) {
    fileInput.value.click();
  }
};

// Handle file selection
const handleFileSelected = async (event: Event) => {
  const target = event.target as HTMLInputElement;
  const files = target.files;
  
  if (!files || files.length === 0) {
    return;
  }
  
  const file = files[0];
  
  // Validate file type
  if (!file.type.startsWith('image/')) {
    errorMessage.value = 'Please select an image file';
    return;
  }
  
  // Validate file size (max 5MB)
  if (file.size > 5 * 1024 * 1024) {
    errorMessage.value = 'Image size should not exceed 5MB';
    return;
  }
  
  await uploadProfileImage(file);
  
  // Reset file input
  target.value = '';
};

// Upload profile image to Firebase Storage
const uploadProfileImage = async (file: File) => {
  isUploading.value = true;
  uploadProgress.value = 0;
  errorMessage.value = '';
  
  try {
    const { $firebaseAuth } = useNuxtApp();
    const userId = $firebaseAuth.currentUser?.uid;
    
    if (!userId) {
      throw new Error('User not authenticated');
    }
    
    // Get storage reference
    const storage = getStorage();
    const fileExtension = file.name.split('.').pop();
    const fileName = `profile_${userId}_${Date.now()}.${fileExtension}`;
    const profileImageRef = storageRef(storage, `profile_images/${fileName}`);
    
    // Upload file
    const snapshot = await uploadBytes(profileImageRef, file);
    uploadProgress.value = 100;
    
    // Get download URL
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    // Update profile with URL
    await updatePhotoURL(downloadURL);
    photoURL.value = downloadURL;
    
  } catch (err) {
    console.error('Image upload error:', err);
    errorMessage.value = 'Failed to upload image. Please try again.';
  } finally {
    isUploading.value = false;
  }
};

// Close the modal
const closeModal = () => {
  emit('close');
  // Reset state when closing
  successMessage.value = '';
  errorMessage.value = '';
  showConfirmRemovePhoto.value = false;
};

// Click outside to close
const modalContent = ref<HTMLElement | null>(null);
const handleClickOutside = (event: MouseEvent) => {
  if (modalContent.value && !modalContent.value.contains(event.target as Node)) {
    closeModal();
  }
};

// Initialize form when modal opens
watch(() => props.isOpen, (isOpen) => {
  if (isOpen) {
    initializeForm();
  }
});
</script>

<template>
  <Teleport to="body">
    <div
      v-if="isOpen"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-1 sm:p-4"
      @click="handleClickOutside"
    >
      <div
        ref="modalContent"
        class="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-[95%] sm:w-full max-w-md max-h-[95vh] overflow-auto"
      >
        <div class="p-2 sm:p-4 border-b dark:border-gray-700 flex justify-between items-center sticky top-0 bg-white dark:bg-gray-800 z-10">
          <h3 class="text-base sm:text-lg font-medium text-gray-900 dark:text-white">Account Settings</h3>
          <button
            class="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
            aria-label="Close settings"
            @click="closeModal"
          >
            <i class="ri-close-line text-lg" />
          </button>
        </div>

        <div class="p-3 sm:p-6 space-y-3 sm:space-y-6">
          <!-- Success message -->
          <div v-if="successMessage" class="bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-200 p-3 rounded-md text-sm">
            {{ successMessage }}
          </div>

          <!-- Error message -->
          <div v-if="errorMessage" class="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-200 p-3 rounded-md text-sm">
            {{ errorMessage }}
          </div>

          <!-- Profile picture -->
          <div class="flex flex-col items-center justify-center py-2 sm:py-4">
            <div class="w-20 h-20 sm:w-24 sm:h-24 bg-gray-200 dark:bg-gray-700 rounded-full mb-2 sm:mb-3 flex items-center justify-center overflow-hidden">
              <img
                v-if="user?.photoURL"
                :src="user.photoURL"
                alt="Profile picture"
                class="w-full h-full object-cover"
              >
              <i v-else class="ri-user-line text-3xl text-gray-400 dark:text-gray-500" />
            </div>
            <p class="text-sm text-gray-500 dark:text-gray-300">
              {{ user?.name || '' }}
            </p>
            <p class="text-xs text-gray-400 dark:text-gray-500">
              {{ user?.email || '' }}
            </p>
          </div>

          <!-- Settings tabs - scrollable on mobile, now with Account instead of Email and Password -->
          <div class="border-b dark:border-gray-700 overflow-x-auto pb-1 flex whitespace-nowrap -mx-3 px-3 sm:mx-0 sm:px-0 sm:flex sm:justify-between sm:whitespace-normal">
            <button
              class="py-2 px-3 sm:px-4 text-sm font-medium flex-1"
              :class="activeTab === 'profile' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-500 dark:text-gray-400'"
              @click="activeTab = 'profile'"
            >
              Profile
            </button>
            <button
              class="py-2 px-3 sm:px-4 text-sm font-medium flex-1"
              :class="activeTab === 'account' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-500 dark:text-gray-400'"
              @click="activeTab = 'account'"
            >
              Account
            </button>
            <button
              class="py-2 px-3 sm:px-4 text-sm font-medium flex-1"
              :class="activeTab === 'photo' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-500 dark:text-gray-400'"
              @click="activeTab = 'photo'"
            >
              Photo
            </button>
            <button
              class="py-2 px-3 sm:px-4 text-sm font-medium flex-1"
              :class="activeTab === 'theme' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-500 dark:text-gray-400'"
              @click="activeTab = 'theme'"
            >
              Theme
            </button>
          </div>

          <!-- Profile tab -->
          <div v-if="activeTab === 'profile'" class="space-y-4">
            <div>
              <label for="display-name" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Display Name
              </label>
              <input
                id="display-name"
                v-model="displayName"
                type="text"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="Your name"
              >
            </div>
            <div class="flex justify-end">
              <button
                type="button"
                class="inline-flex items-center px-3 py-2 border border-transparent shadow-sm text-sm leading-4 font-medium rounded-md text-white bg-blue-500 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                :disabled="isLoading"
                @click="updateName"
              >
                <span v-if="isLoading" class="mr-2">
                  <i class="ri-loader-4-line animate-spin" />
                </span>
                Update Name
              </button>
            </div>
          </div>

          <!-- Account tab (combining Email and Password) -->
          <div v-if="activeTab === 'account'" class="space-y-6">
            <!-- Email section -->
            <div class="space-y-4">
              <h3 class="text-base font-medium border-b pb-2 dark:border-gray-700 text-gray-800 dark:text-gray-200">Email Address</h3>
              <div>
                <input
                  id="new-email"
                  v-model="newEmail"
                  type="email"
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="your.email@example.com"
                >
              </div>
              
              <!-- Show this for Google sign-in users -->
              <div v-if="isGoogleUser" class="text-sm bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-200 p-3 rounded">
                You're signed in with Google. You will be prompted to re-authenticate with Google when changing your email.
              </div>
              
              <!-- Only show password field for non-Google users -->
              <div v-else class="relative">
                <label for="current-password-email" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Current Password
                </label>
                <div class="relative">
                  <input
                    id="current-password-email"
                    v-model="currentPasswordForEmail"
                    :type="showEmailPassword ? 'text' : 'password'"
                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 pr-10 dark:bg-gray-700 dark:text-white"
                    placeholder="Enter your current password"
                  >
                  <button
                    type="button"
                    class="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    @click="showEmailPassword = !showEmailPassword"
                  >
                    <i :class="showEmailPassword ? 'ri-eye-off-line' : 'ri-eye-line'" />
                  </button>
                </div>
              </div>
              <div class="flex justify-end">
                <button
                  type="button"
                  class="inline-flex items-center px-3 py-2 border border-transparent shadow-sm text-sm leading-4 font-medium rounded-md text-white bg-blue-500 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  :disabled="isLoading"
                  @click="updateEmail"
                >
                  <span v-if="isLoading" class="mr-2">
                    <i class="ri-loader-4-line animate-spin" />
                  </span>
                  Update Email
                </button>
              </div>
            </div>
            
            <!-- Divider -->

            <!-- Password section -->
            <div class="space-y-4">
              <h3 class="text-base font-medium border-b pb-2 dark:border-gray-700 text-gray-800 dark:text-gray-200">Password</h3>
              
              <!-- Show message for Google sign-in users -->
              <div v-if="isGoogleUser" class="text-sm bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-200 p-3 rounded">
                Password change is not available for Google sign-in users. 
                If you need to change your Google account password, please visit 
                <a 
                  href="https://myaccount.google.com/signinoptions/password" 
                  target="_blank" 
                  class="underline font-medium hover:text-blue-800 dark:hover:text-blue-300"
                >
                  Google Account Settings
                </a>.
              </div>
              
              <!-- Only show password fields for non-Google users -->
              <template v-else>
                <div class="relative">
                  <label for="current-password" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Current Password
                  </label>
                  <div class="relative">
                    <input
                      id="current-password"
                      v-model="currentPassword"
                      :type="showCurrentPassword ? 'text' : 'password'"
                      class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 pr-10 dark:bg-gray-700 dark:text-white"
                      placeholder="Enter your current password"
                    >
                    <button
                      type="button"
                      class="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      @click="showCurrentPassword = !showCurrentPassword"
                    >
                      <i :class="showCurrentPassword ? 'ri-eye-off-line' : 'ri-eye-line'" />
                    </button>
                  </div>
                </div>
                <div class="relative">
                  <label for="new-password" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    New Password
                  </label>
                  <div class="relative">
                    <input
                      id="new-password"
                      v-model="newPassword"
                      :type="showNewPassword ? 'text' : 'password'"
                      class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 pr-10 dark:bg-gray-700 dark:text-white"
                      placeholder="Enter new password"
                    >
                    <button
                      type="button"
                      class="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      @click="showNewPassword = !showNewPassword"
                    >
                      <i :class="showNewPassword ? 'ri-eye-off-line' : 'ri-eye-line'" />
                    </button>
                  </div>
                </div>
                <div>
                  <label for="confirm-password" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Confirm New Password
                  </label>
                  <input
                    id="confirm-password"
                    v-model="confirmNewPassword"
                    :type="showNewPassword ? 'text' : 'password'"
                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Confirm new password"
                  >
                </div>
                <div class="flex justify-end">
                  <button
                    type="button"
                    class="inline-flex items-center px-3 py-2 border border-transparent shadow-sm text-sm leading-4 font-medium rounded-md text-white bg-blue-500 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    :disabled="isLoading"
                    @click="updatePassword"
                  >
                    <span v-if="isLoading" class="mr-2">
                      <i class="ri-loader-4-line animate-spin" />
                    </span>
                    Update Password
                  </button>
                </div>
              </template>
            </div>
          </div>

          <!-- Photo tab -->
          <div v-if="activeTab === 'photo'" class="space-y-4">
            <!-- URL input -->
            <div>
              <label for="photo-url" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Profile Picture URL
              </label>
              <input
                id="photo-url"
                v-model="photoURL"
                type="text"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="https://example.com/your-photo.jpg"
                >
            </div>
            
            <!-- URL buttons -->
            <div class="flex justify-between">
              <button
                type="button"
                class="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                :disabled="isLoading || !user?.photoURL"
                @click="confirmRemovePhoto"
              >
                Remove Photo
              </button>
              <button
                type="button"
                class="inline-flex items-center px-3 py-2 border border-transparent shadow-sm text-sm leading-4 font-medium rounded-md text-white bg-blue-500 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                :disabled="isLoading"
                @click="updateProfilePicture"
              >
                <span v-if="isLoading" class="mr-2">
                  <i class="ri-loader-4-line animate-spin" />
                </span>
                Update URL
              </button>
            </div>
            
            <!-- Divider -->
            <div class="flex items-center my-6">
              <div class="flex-grow h-px bg-gray-200 dark:bg-gray-700" />
              <span class="mx-4 text-sm text-gray-500 dark:text-gray-400">or</span>
              <div class="flex-grow h-px bg-gray-200 dark:bg-gray-700" />
            </div>
            
            <!-- File upload -->
            <div>
              <p class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Upload from your device</p>
              
              <!-- Hidden file input -->
              <input
                ref="fileInput"
                type="file"
                accept="image/*"
                class="hidden"
                @change="handleFileSelected"
              >
              
              <!-- Upload button -->
              <div class="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-md hover:border-blue-500 transition-colors cursor-pointer" @click="triggerFileUpload">
                <i class="ri-upload-cloud-line text-3xl text-gray-400 dark:text-gray-500 mb-2" />
                <p class="text-sm text-gray-500 dark:text-gray-400">Click to select an image</p>
                <p class="text-xs text-gray-400 dark:text-gray-500 mt-1">PNG, JPG, GIF up to 5MB</p>
              </div>
              
              <!-- Upload progress -->
              <div v-if="isUploading" class="mt-2">
                <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                  <div
                    class="bg-blue-500 h-2.5 rounded-full transition-all duration-300"
                    :style="{ width: `${uploadProgress}%` }"
                  />
                </div>
                <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">Uploading... {{ uploadProgress }}%</p>
              </div>
            </div>
          </div>

          <!-- Theme tab -->
          <div v-if="activeTab === 'theme'" class="space-y-4">
            <ThemeSelector />
          </div>
        </div>

        <div class="px-3 sm:px-6 py-3 sm:py-4 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-800 rounded-b-lg">
          <button
            type="button"
            class="w-full inline-flex justify-center items-center px-3 py-2 sm:py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            @click="closeModal"
          >
            Close
          </button>
        </div>
      </div>
    </div>
    
    <!-- Confirmation dialog for removing photo -->
    <div
      v-if="showConfirmRemovePhoto"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]"
      @click.self="cancelRemovePhoto"
    >
      <div class="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow-lg w-[95%] sm:w-full max-w-sm mx-1 sm:mx-4">
        <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-3">Remove Profile Picture?</h3>
        <p class="mb-5 text-gray-600 dark:text-gray-300">Are you sure you want to remove your profile picture? This action cannot be undone.</p>
        <div class="flex justify-end space-x-3">
          <button
            type="button"
            class="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            @click="cancelRemovePhoto"
          >
            Cancel
          </button>
          <button
            type="button"
            class="inline-flex items-center px-3 py-2 border border-transparent shadow-sm text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            :disabled="isLoading"
            @click="handleRemovePhoto"
          >
            <span v-if="isLoading" class="mr-2">
              <i class="ri-loader-4-line animate-spin" />
            </span>
            Remove
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template> 
<!-- layouts/default.vue -->
<script setup lang="ts">
import { ref } from 'vue';
import { useLogout } from '~/composables/useLogout';
import { useUserPreferences } from '~/composables/useUserPreferences';
import { useFeatureFlagsStore } from '~/stores/featureFlags';

// Get sidebar state from the user preferences composable
const { sidebarOpen, toggleSidebar } = useUserPreferences();
const isMobileMenuOpen = ref(false);
const { logout, isLoggingOut } = useLogout();
const showLogoutConfirm = ref(false);
const showSettingsModal = ref(false);
const authStore = useAuthStore();
const featureFlagsStore = useFeatureFlagsStore();

const toggleMobileMenu = () => {
  isMobileMenuOpen.value = !isMobileMenuOpen.value;
};

const confirmLogout = () => {
  showLogoutConfirm.value = true;
};

const cancelLogout = () => {
  showLogoutConfirm.value = false;
};

const onLogout = async () => {
  if (isLoggingOut.value) return;
  
  showLogoutConfirm.value = false;
  // Close mobile menu if it's open
  if (isMobileMenuOpen.value) {
    isMobileMenuOpen.value = false;
  }
  await logout();
};

const openSettingsModal = () => {
  showSettingsModal.value = true;
  if (isMobileMenuOpen.value) {
    isMobileMenuOpen.value = false;
  }
};

const closeSettingsModal = () => {
  showSettingsModal.value = false;
};

const handleNavigation = () => {
  if (isMobileMenuOpen.value) {
    isMobileMenuOpen.value = false;
  }
};
</script>

<template>
  <div class="min-h-screen app-bg flex flex-col md:flex-row">
    <!-- Mobile header - only visible on small screens -->
    <header class="md:hidden flex items-center justify-between p-4 bg-white dark:bg-gray-800 sticky top-0 z-30 shadow-md">
      <h1 class="font-bold primary-text">TherapyJournal</h1>
      <button
        class="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        aria-label="Toggle mobile menu"
        @click="toggleMobileMenu"
      >
        <i :class="['text-icon text-xl', isMobileMenuOpen ? 'ri-close-line' : 'ri-menu-line']" />
      </button>
    </header>

    <!-- Mobile sidebar overlay - only visible when menu is open -->
    <div 
      v-if="isMobileMenuOpen" 
      class="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
      @click="toggleMobileMenu"
    />

    <!-- Client-only sidebar to prevent SSR hydration issues -->
    <ClientOnly>
      <aside
        :class="[
          'sidebar transition-all duration-300 z-50 h-screen flex flex-col',
          'fixed left-0 top-0 md:sticky md:top-0',
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
          sidebarOpen ? 'md:w-64' : 'md:w-16',
          'w-64 md:block'
        ]"
      >
        <!-- Sidebar header - hidden on mobile -->
        <div class="hidden md:flex items-center justify-between p-4 sidebar-header">
          <div class="header-container">
            <h1 
              :class="[
                'font-bold primary-text transition-opacity duration-300',
                sidebarOpen ? 'opacity-100' : 'opacity-0 hidden'
              ]"
            >
              TherapyJournal
            </h1>
            <p
              :class="[
                'dark:text-gray-300 text-sm sm:text-base transition-opacity duration-300',
                sidebarOpen ? 'opacity-100' : 'opacity-0 hidden'
              ]"
            >
              {{ authStore.user?.name }}
            </p>
          </div>
          <button
            variant="ghost"
            size="sm"
            :class="{ 'w-full flex justify-center': !sidebarOpen }"
            :aria-label="sidebarOpen ? 'Close sidebar' : 'Open sidebar'"
            @click="toggleSidebar"
          >
            <i :class="['text-icon', sidebarOpen ? 'ri-menu-fold-line' : 'ri-menu-unfold-line']" />
          </button>
        </div>

        <!-- Mobile sidebar header - only visible on mobile -->
        <div class="flex md:hidden items-center justify-between p-4 sidebar-header">
          <h1 class="font-bold primary-text">TherapyJournal</h1>
          <button
            class="p-2 rounded-md"
            aria-label="Close mobile menu"
            @click="toggleMobileMenu"
          >
            <i class="ri-close-line text-icon text-xl" />
          </button>
        </div>

        <!-- Main navigation -->
        <div class="flex flex-col h-[calc(100vh-8rem)]">
          <nav class="flex-1 py-4 overflow-y-auto">
            <ul class="space-y-2">
              <!-- Dashboard -->
              <li>
                <NuxtLink 
                  to="/" 
                  class="nav-link flex items-center px-4 py-2"
                  :class="{ 'md:justify-center': !sidebarOpen }"
                  active-class="nav-link-active"
                  @click="handleNavigation"
                >
                  <i class="ri-dashboard-line text-lg" :class="['md:mr-0', (sidebarOpen || isMobileMenuOpen) ? 'mr-3' : '']" />
                  <span :class="{ 'md:hidden': !sidebarOpen }">Dashboard</span>
                </NuxtLink>
              </li>
              <!-- Journal -->
              <li>
                <NuxtLink 
                  to="/journal" 
                  class="nav-link flex items-center px-4 py-2"
                  :class="{ 'md:justify-center': !sidebarOpen }"
                  active-class="nav-link-active"
                  @click="handleNavigation"
                >
                  <i class="ri-book-2-line text-lg" :class="['md:mr-0', (sidebarOpen || isMobileMenuOpen) ? 'mr-3' : '']" />
                  <span :class="{ 'md:hidden': !sidebarOpen }">Journal</span>
                </NuxtLink>
              </li>
              <!-- Therapist -->
              <li v-if="featureFlagsStore.showTherapistLink">
                <NuxtLink 
                  to="/therapist" 
                  class="nav-link flex items-center px-4 py-2"
                  :class="{ 'md:justify-center': !sidebarOpen }"
                  active-class="nav-link-active"
                  @click="handleNavigation"
                >
                  <i class="ri-user-heart-line text-lg" :class="['md:mr-0', (sidebarOpen || isMobileMenuOpen) ? 'mr-3' : '']" />
                  <span :class="{ 'md:hidden': !sidebarOpen }">Therapist</span>
                </NuxtLink>
              </li>
              <!-- Settings -->
              
            </ul>
          </nav>

          <!-- Footer section on sidebar -->
          <div class="border-t pt-4">
            <ul class="space-y-2">
              <li>
                <button 
                  class="w-full nav-link flex items-center px-4 py-2"
                  :class="{ 'md:justify-center': !sidebarOpen }"
                  @click="openSettingsModal"
                >
                  <i class="ri-settings-3-line text-lg" :class="['md:mr-0', (sidebarOpen || isMobileMenuOpen) ? 'mr-3' : '']" />
                  <span :class="{ 'md:hidden': !sidebarOpen }">Settings</span>
                </button>
              </li>
              <li>
                <button 
                  class="w-full flex items-center px-4 py-2 logout-btn transition-colors"
                  :class="{ 'md:justify-center': !sidebarOpen }"
                  :disabled="isLoggingOut"
                  @click="confirmLogout"
                >
                <i class="ri-logout-box-line" :class="['md:mr-0', (sidebarOpen || isMobileMenuOpen) ? 'mr-3' : '']" />
                <span :class="{ 'md:hidden': !sidebarOpen }">
                  <template v-if="isLoggingOut">Logging out...</template>
                  <template v-else>Logout</template>
                </span>
                </button>
              </li>
            </ul>
            <!-- Theme toggle in sidebar - works for both expanded and collapsed states -->
            <div :class="['mx-auto mt-4', 'flex justify-center']">
              <ThemeToggle />
            </div>
          </div>
        </div>
      </aside>
    </ClientOnly>

    <!-- Main content - adjusted for mobile header -->
    <main class="flex-1 p-4 md:p-6 main-content mt-0 md:mt-0">
      <slot />
    </main>

    <!-- Logout confirmation dialog - overlays the entire screen -->
    <Teleport to="body">
      <div v-if="showLogoutConfirm" class="fixed inset-0 modal-backdrop flex items-center justify-center z-50">
        <div class="modal-card p-6 rounded-lg shadow-lg w-full max-w-md mx-4">
          <h3 class="text-lg font-medium mb-4">Confirm Logout</h3>
          <p class="mb-6 text-secondary">Are you sure you want to log out of your account?</p>
          <div class="flex justify-end space-x-3">
            <button variant="outline" @click="cancelLogout">Cancel</button>
            <button variant="danger" :loading="isLoggingOut" @click="onLogout">
              Logout
            </button>
          </div>
        </div>
      </div>
    </Teleport>
    
    <!-- Settings Modal -->
    <SettingsModal 
      :is-open="showSettingsModal" 
      @close="closeSettingsModal" 
    />
  </div>
</template>

<style scoped>
.app-bg {
  background-color: var(--color-background-secondary);
}

.sidebar {
  background-color: var(--color-background-primary);
  box-shadow: var(--shadow-md);
}

.sidebar-header {
  border-bottom: 1px solid var(--color-border);
}

.sidebar-footer {
  border-top: 1px solid var(--color-border);
}

.primary-text {
  color: var(--color-primary);
}

.text-icon {
  color: var(--color-text-secondary);
}

.text-secondary {
  color: var(--color-text-secondary);
}

.nav-link {
  color: var(--color-text-primary);
}

.nav-link:hover {
  background-color: var(--color-background-tertiary);
  color: var(--color-primary);
}

.nav-link-active {
  background-color: var(--color-background-tertiary);
  color: var(--color-primary);
}

.logout-btn {
  color: var(--color-text-primary);
}

.logout-btn:hover {
  background-color: var(--color-background-tertiary);
}

.modal-backdrop {
  background-color: rgba(0, 0, 0, 0.5);
}

.modal-card {
  background-color: var(--color-background-primary);
  color: var(--color-text-primary);
}

.main-content {
  color: var(--color-text-primary);
}

.header-container {
  display: block;
}
</style> 
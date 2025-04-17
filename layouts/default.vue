<script setup lang="ts">
import { ref } from 'vue';
import { useLogout } from '~/composables/useLogout';

const isSidebarOpen = ref(true);
const { logout, isLoggingOut } = useLogout();
const showLogoutConfirm = ref(false);
const showSettingsModal = ref(false);

const toggleSidebar = () => {
  isSidebarOpen.value = !isSidebarOpen.value;
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
  await logout();
};

const openSettingsModal = () => {
  showSettingsModal.value = true;
};

const closeSettingsModal = () => {
  showSettingsModal.value = false;
};
</script>

<template>
  <div class="min-h-screen app-bg flex">
    <!-- Sidebar -->
    <aside
      :class="[
        'sidebar transition-all duration-300 z-20 h-screen sticky top-0 flex flex-col',
        isSidebarOpen ? 'w-64' : 'w-16'
      ]"
    >
      <div class="flex items-center justify-between p-4 sidebar-header">
        <h1 
          :class="[
            'font-bold primary-text transition-opacity duration-300',
            isSidebarOpen ? 'opacity-100' : 'opacity-0 hidden'
          ]"
        >
          TherapyJournal
        </h1>
        <button
          variant="ghost"
          size="sm"
          :class="{ 'w-full flex justify-center': !isSidebarOpen }"
          :aria-label="isSidebarOpen ? 'Close sidebar' : 'Open sidebar'"
          @click="toggleSidebar"
        >
          <i :class="['text-icon', isSidebarOpen ? 'ri-menu-fold-line' : 'ri-menu-unfold-line']" />
        </button>
      </div>
      <nav class="py-4 flex-grow">
        <ul class="space-y-2">
          <li>
            <NuxtLink 
              to="/" 
              class="nav-link flex items-center px-4 py-2"
              :class="{ 'justify-center': !isSidebarOpen }"
              active-class="nav-link-active"
            >
              <i class="ri-dashboard-line text-lg" :class="isSidebarOpen ? 'mr-3' : ''" />
              <span :class="{ 'hidden': !isSidebarOpen }">Dashboard</span>
            </NuxtLink>
          </li>
          <li>
            <NuxtLink 
              to="/journal" 
              class="nav-link flex items-center px-4 py-2"
              :class="{ 'justify-center': !isSidebarOpen }"
              active-class="nav-link-active"
            >
              <i class="ri-book-2-line text-lg" :class="isSidebarOpen ? 'mr-3' : ''" />
              <span :class="{ 'hidden': !isSidebarOpen }">Journal</span>
            </NuxtLink>
          </li>
          <li>
            <NuxtLink 
              to="/therapist" 
              class="nav-link flex items-center px-4 py-2"
              :class="{ 'justify-center': !isSidebarOpen }"
              active-class="nav-link-active"
            >
              <i class="ri-user-heart-line text-lg" :class="isSidebarOpen ? 'mr-3' : ''" />
              <span :class="{ 'hidden': !isSidebarOpen }">Therapist</span>
            </NuxtLink>
          </li>
          <li>
            <button 
              class="w-full nav-link flex items-center px-4 py-2"
              :class="{ 'justify-center': !isSidebarOpen }"
              @click="openSettingsModal"
            >
              <i class="ri-settings-3-line text-lg" :class="isSidebarOpen ? 'mr-3' : ''" />
              <span :class="{ 'hidden': !isSidebarOpen }">Settings</span>
            </button>
          </li>
        </ul>
      </nav>
      <div class="sidebar-footer border-t pt-4 pb-4">
        <button 
          class="w-full flex items-center px-4 py-2 logout-btn rounded-md transition-colors"
          :class="{ 'justify-center': !isSidebarOpen }"
          :disabled="isLoggingOut"
          @click="confirmLogout"
        >
          <i class="ri-logout-box-line" :class="isSidebarOpen ? 'mr-3' : ''" />
          <span :class="{ 'hidden': !isSidebarOpen }">
            <template v-if="isLoggingOut">Logging out...</template>
            <template v-else>Logout</template>
          </span>
        </button>
      </div>
      
      <!-- Theme toggle in sidebar - works for both expanded and collapsed states -->
      <div :class="['mx-auto mb-4', isSidebarOpen ? 'ml-4 mr-auto' : '']">
        <ThemeToggle />
      </div>
    </aside>

    <!-- Main content -->
    <main class="flex-1 p-6 main-content">
      <slot />
    </main>

    <!-- Logout confirmation dialog - overlays the entire screen -->
    <Teleport to="body">
      <div v-if="showLogoutConfirm" class="fixed inset-0 modal-backdrop flex items-center justify-center z-50">
        <div class="modal-card p-6 rounded-lg shadow-lg w-full max-w-md">
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
</style> 
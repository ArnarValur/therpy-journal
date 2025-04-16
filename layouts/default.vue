<script setup lang="ts">
import { ref } from 'vue';
import { useLogout } from '~/composables/useLogout';

const isSidebarOpen = ref(true);
const { logout, isLoggingOut } = useLogout();
const showLogoutConfirm = ref(false);

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
</script>

<template>
  <div class="min-h-screen bg-gray-50 flex">
    <!-- Sidebar -->
    <aside
      :class="[
        'bg-white shadow-md transition-all duration-300 z-20 h-screen sticky top-0 flex flex-col',
        isSidebarOpen ? 'w-64' : 'w-16'
      ]"
    >
      <div class="flex items-center justify-between p-4 border-b">
        <h1 
          :class="[
            'font-bold text-[#42A5F5] transition-opacity duration-300',
            isSidebarOpen ? 'opacity-100' : 'opacity-0 hidden'
          ]"
        >
          TherapyJournal
        </h1>
        <RButton
          variant="ghost"
          size="sm"
          :aria-label="isSidebarOpen ? 'Close sidebar' : 'Open sidebar'"
          @click="toggleSidebar"
        >
          <i :class="['ri-menu-fold-line', isSidebarOpen ? 'ri-menu-fold-line' : 'ri-menu-unfold-line']" />
        </RButton>
      </div>
      <nav class="py-4 flex-grow">
        <ul class="space-y-2">
          <li>
            <NuxtLink 
              to="/" 
              class="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100 hover:text-[#42A5F5]"
              active-class="bg-gray-100 text-[#42A5F5]"
            >
              <i class="ri-dashboard-line mr-3 text-lg" />
              <span :class="{ 'hidden': !isSidebarOpen }">Dashboard</span>
            </NuxtLink>
          </li>
          <li>
            <NuxtLink 
              to="/journal" 
              class="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100 hover:text-[#42A5F5]"
              active-class="bg-gray-100 text-[#42A5F5]"
            >
              <i class="ri-book-2-line mr-3 text-lg" />
              <span :class="{ 'hidden': !isSidebarOpen }">Journal</span>
            </NuxtLink>
          </li>
          <li>
            <NuxtLink 
              to="/therapist" 
              class="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100 hover:text-[#42A5F5]"
              active-class="bg-gray-100 text-[#42A5F5]"
            >
              <i class="ri-user-heart-line mr-3 text-lg" />
              <span :class="{ 'hidden': !isSidebarOpen }">Therapist</span>
            </NuxtLink>
          </li>
          <li>
            <NuxtLink 
              to="/settings" 
              class="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100 hover:text-[#42A5F5]"
              active-class="bg-gray-100 text-[#42A5F5]"
            >
              <i class="ri-settings-3-line mr-3 text-lg" />
              <span :class="{ 'hidden': !isSidebarOpen }">Settings</span>
            </NuxtLink>
          </li>
        </ul>
      </nav>
      <div class="border-t pt-4 pb-4">
        <button 
          class="w-full flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
          :disabled="isLoggingOut"
          @click="confirmLogout"
        >
          <i class="ri-logout-box-line mr-3 text-gray-500" />
          <span :class="{ 'hidden': !isSidebarOpen }">
            <template v-if="isLoggingOut">Logging out...</template>
            <template v-else>Logout</template>
          </span>
        </button>
      </div>
    </aside>

    <!-- Main content -->
    <main class="flex-1 p-6">
      <slot />
    </main>

    <!-- Logout confirmation dialog - overlays the entire screen -->
    <Teleport to="body">
      <div v-if="showLogoutConfirm" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div class="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
          <h3 class="text-lg font-medium text-gray-900 mb-4">Confirm Logout</h3>
          <p class="mb-6 text-gray-600">Are you sure you want to log out of your account?</p>
          <div class="flex justify-end space-x-3">
            <button variant="outline" @click="cancelLogout">Cancel</button>
            <button color="rose" :loading="isLoggingOut" @click="onLogout">
              Logout
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template> 
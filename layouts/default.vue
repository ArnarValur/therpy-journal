<script setup lang="ts">
import { ref } from 'vue';
import { useAuthStore } from '~/stores/auth';

const isSidebarOpen = ref(true);
const authStore = useAuthStore();
const router = useRouter();

const toggleSidebar = () => {
  isSidebarOpen.value = !isSidebarOpen.value;
};

const onLogout = async () => {
  try {
    await authStore.logout();
    await router.push('/login');
  } catch (error) {
    console.error('Logout failed:', error);
  }
};
</script>

<template>
  <div class="min-h-screen bg-gray-50 flex">
    <!-- Sidebar -->
    <aside
      :class="[
        'bg-white shadow-md transition-all duration-300 z-20 h-screen sticky top-0',
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
      <nav class="py-4">
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
      <div class="mt-auto border-t pt-4">
        <button 
          class="w-full flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
          @click="onLogout"
        >
          <i class="ri-logout-box-line mr-3 text-gray-500" />
          <span>Logout</span>
        </button>
      </div>
    </aside>

    <!-- Main content -->
    <main class="flex-1 p-6">
      <slot />
    </main>
  </div>
</template> 
<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useFeedback, type Feedback } from '~/composables/useFeedback';

definePageMeta({
  layout: 'default',
  middleware: ['admin'] // You need to implement this middleware to protect admin routes
});

const { getAllFeedback, markAsRead, isAdmin, isLoading, error } = useFeedback();
const feedbackList = ref<Feedback[]>([]);
const router = useRouter();
const unreadCount = ref(0);

// Pagination
const itemsPerPage = 10;
const currentPage = ref(1);
const totalPages = computed(() => Math.ceil(feedbackList.value.length / itemsPerPage));
const paginatedFeedback = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  return feedbackList.value.slice(start, end);
});

// Handle page change
const changePage = (page: number) => {
  currentPage.value = page;
  // Scroll to top of the list
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

// Load feedback on page mount
onMounted(async () => {
  if (!isAdmin.value) {
    router.push('/'); // Redirect if not admin
    return;
  }
  
  const feedback = await getAllFeedback();
  feedbackList.value = feedback;
  unreadCount.value = feedback.filter(f => !f.isRead).length;
});

// Mark feedback as read
const handleMarkAsRead = async (id: string) => {
  const success = await markAsRead(id);
  if (success) {
    // Update local state
    const index = feedbackList.value.findIndex(f => f.id === id);
    if (index !== -1) {
      feedbackList.value[index].isRead = true;
      unreadCount.value--;
    }
  }
};
</script>

<template>
  <div class="p-4 md:p-6">
    <div class="flex justify-between items-center mb-6">
      <div class="flex items-center">
        <h1 class="text-2xl font-bold">User Feedback</h1>
        <span class="ml-3 text-sm text-gray-500 dark:text-gray-400">({{ feedbackList.length }} total)</span>
      </div>
      
      <div v-if="unreadCount > 0" class="bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100 text-xs font-medium px-2.5 py-0.5 rounded-full">
        {{ unreadCount }} unread
      </div>
    </div>
    
    <div v-if="error" class="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6">
      {{ error }}
    </div>
    
    <div v-if="isLoading" class="flex justify-center p-8">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500" />
    </div>
    
    <div v-else-if="feedbackList.length === 0" class="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg text-center">
      <p class="text-gray-600 dark:text-gray-300">No feedback has been submitted yet.</p>
    </div>
    
    <div v-else>
      <!-- Feedback List -->
      <div class="space-y-4">
        <div 
          v-for="item in paginatedFeedback" 
          :key="item.id" 
          class="bg-white dark:bg-gray-800 rounded-lg shadow p-4 md:p-6"
          :class="{'border-l-4 border-blue-500': !item.isRead}"
        >
          <div class="flex justify-between items-center mb-2">
            <h3 class="text-lg font-semibold">{{ item.title }}</h3>
            <span 
              v-if="!item.isRead" 
              class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100"
            >
              Unread
            </span>
          </div>
          
          <p class="text-gray-700 dark:text-gray-300 whitespace-pre-wrap mb-4">{{ item.feedback }}</p>
          
          <div class="flex justify-between items-center text-sm text-gray-500 dark:text-gray-400">
            <span>{{ new Date(item.createdAt).toLocaleString() }}</span>
            
            <button 
              v-if="!item.isRead"
              class="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
              @click="handleMarkAsRead(item.id!)"
            >
              Mark as read
            </button>
          </div>
        </div>
      </div>
      
      <!-- Pagination -->
      <div v-if="totalPages > 1" class="flex justify-center mt-8">
        <div class="flex space-x-1">
          <button 
            :disabled="currentPage === 1"
            class="px-3 py-1 rounded border border-gray-300 dark:border-gray-600"
            :class="currentPage === 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100 dark:hover:bg-gray-700'"
            @click="changePage(currentPage - 1)" 
          >
            <i class="ri-arrow-left-s-line" />
          </button>
          
          <button 
            v-for="page in totalPages" 
            :key="page"
            class="px-3 py-1 rounded border border-gray-300 dark:border-gray-600"
            :class="currentPage === page ? 'bg-primary-500 text-white border-primary-500' : 'hover:bg-gray-100 dark:hover:bg-gray-700'"
            @click="changePage(page)"
          >
            {{ page }}
          </button>
          
          <button 
            :disabled="currentPage === totalPages"
            class="px-3 py-1 rounded border border-gray-300 dark:border-gray-600"
            :class="currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100 dark:hover:bg-gray-700'"
            @click="changePage(currentPage + 1)" 
          >
            <i class="ri-arrow-right-s-line" />
          </button>
        </div>
      </div>
      
      <!-- Back to Admin Dashboard -->
      <div class="mt-8 flex justify-end">
        <NuxtLink 
          to="/admin"
          class="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
        >
          ← Back to Admin Dashboard
        </NuxtLink>
      </div>
    </div>
  </div>
</template> 
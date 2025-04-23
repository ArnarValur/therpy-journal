<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useFeedback, type Feedback } from '~/composables/useFeedback';

const { getAllFeedback, markAsRead, deleteFeedback, isLoading, error } = useFeedback();
const feedbackList = ref<Feedback[]>([]);
const unreadCount = ref(0);

// Only display 5 most recent feedbacks in the dashboard widget
const displayFeedbacks = computed(() => {
  // Sort by read status (unread first) and then by date
  return [...feedbackList.value]
    .sort((a, b) => {
      // Sort by read status first (unread first)
      if (a.isRead !== b.isRead) {
        return a.isRead ? 1 : -1;
      }
      // Then sort by date (newest first)
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    })
    .slice(0, 5); // Limit to 5 items
});

// Total count of all feedbacks
const totalCount = computed(() => feedbackList.value.length);

// Load feedback on component mount
onMounted(async () => {
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

// Delete feedback
const handleDeleteFeedback = async (id: string) => {
  const success = await deleteFeedback(id);
  if (success) {
    feedbackList.value = feedbackList.value.filter(f => f.id !== id);
    // Update unread count if the deleted feedback was unread
    unreadCount.value = feedbackList.value.filter(f => !f.isRead).length;
  }
};
</script>

<template>
  <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mt-6">
    <div class="flex justify-between items-center mb-4">
      <div class="flex items-center">
        <h2 class="text-lg font-medium dark:text-white">User Feedback</h2>
        <span class="ml-2 text-xs text-gray-500 dark:text-gray-400">({{ totalCount }} total)</span>
      </div>
      
      <div v-if="unreadCount > 0" class="bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100 text-xs font-medium px-2.5 py-0.5 rounded-full">
        {{ unreadCount }} unread
      </div>
    </div>

    <div v-if="isLoading" class="flex items-center justify-center py-4">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" />
    </div>

    <div v-else-if="error" class="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-200 p-3 rounded text-sm mb-4">
      {{ error }}
    </div>
    
    <div v-else-if="feedbackList.length === 0" class="bg-gray-50 dark:bg-gray-700 p-4 rounded-md text-center">
      <p class="text-gray-600 dark:text-gray-300">No feedback has been submitted yet.</p>
    </div>

    <div v-else class="space-y-4 max-h-[500px] overflow-y-auto pr-1">
      <div 
        v-for="item in displayFeedbacks" 
        :key="item.id" 
        class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4"
        :class="{'border-l-4 border-blue-500': !item.isRead}"
      >
        <div class="flex justify-between items-start mb-2">
          <h3 class="text-base font-semibold dark:text-white">{{ item.title }}</h3>
          <span 
            v-if="!item.isRead" 
            class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100"
          >
            New
          </span>
        </div>
        
        <p class="text-gray-700 dark:text-gray-300 whitespace-pre-wrap text-sm mb-3">{{ item.feedback }}</p>
        
        <div class="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400">
          <span>{{ new Date(item.createdAt).toLocaleString() }}</span>
          
          <button 
            v-if="!item.isRead"
            class="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors text-xs"
            @click="handleMarkAsRead(item.id!)"
          >
            Mark as read
          </button>
          <button 
            class="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 transition-colors text-xs"
            @click="handleDeleteFeedback(item.id!)"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
    
    <div v-if="feedbackList.length > 5" class="mt-4 flex justify-end">
      <NuxtLink 
        to="/admin/feedback"
        class="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
      >
        View all {{ totalCount }} feedback items →
      </NuxtLink>
    </div>
  </div>
</template> 
<!-- components/buttons/FeedbackButton.vue -->
<script setup lang="ts">
import { ref } from 'vue';
import FeedbackModal from '~/components/modals/FeedbackModal.vue';

const showFeedbackModal = ref(false);

const openFeedbackModal = () => {
  showFeedbackModal.value = true;
};

const closeFeedbackModal = () => {
  showFeedbackModal.value = false;
};
</script>

<template>
  <div>
    <button
      type="button"
      class="nav-link flex items-center"
      @click="openFeedbackModal"
    >
      <i class="ri-feedback-line" />
      <span class="ml-3">Feedback</span>
    </button>
    
    <FeedbackModal 
      :is-open="showFeedbackModal" 
      @close="closeFeedbackModal" 
    />
  </div>
</template> 
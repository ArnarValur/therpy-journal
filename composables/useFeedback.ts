import { ref, computed } from 'vue';
import { 
  collection, 
  query, 
  orderBy, 
  addDoc, 
  getDocs, 
  updateDoc, 
  doc, 
  where, 
  Timestamp,
  deleteDoc
} from 'firebase/firestore';
import { useFirestore } from 'vuefire';
import { useAuthStore } from '~/stores/auth';
import { useEncryption } from '~/composables/useEncryption';

export interface Feedback {
  id?: string;
  title: string;
  feedback: string;
  userId: string;
  userName: string;
  createdAt: Date;
  isRead: boolean;
}

export function useFeedback() {
  const db = useFirestore();
  const authStore = useAuthStore();
  const { encrypt } = useEncryption();
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  // Check if user is admin (specific email)
  const isAdmin = computed(() => {
    if (!authStore.user) return false;
    return authStore.user.email === 'arnarvalurjonsson@gmail.com';
  });

  /**
   * Get all feedback for admin view
   */
  const getAllFeedback = async () => {
    if (!isAdmin.value) {
      error.value = 'Unauthorized: Admin access required';
      return [];
    }

    isLoading.value = true;
    error.value = null;

    try {
      const q = query(
        collection(db, 'feedbacks'),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      
      const feedbacks = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          title: data.title,
          feedback: data.feedback,
          userId: '', // Don't decrypt user ID for admin view
          userName: '', // Don't decrypt user name for admin view
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : data.createdAt,
          isRead: data.isRead || false
        };
      });
      
      // Sort by read status (unread first) and then by date (newest first)
      return feedbacks.sort((a, b) => {
        // Sort by read status first
        if (a.isRead !== b.isRead) {
          return a.isRead ? 1 : -1;
        }
        // Then by date
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
    } catch (err) {
      console.error('Error fetching feedback:', err);
      error.value = 'Failed to load feedback';
      return [];
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * Create new feedback
   */
  const submitFeedback = async (title: string, feedbackText: string) => {
    if (!authStore.user) {
      error.value = 'You must be logged in to submit feedback';
      return false;
    }

    isLoading.value = true;
    error.value = null;

    try {
      await addDoc(collection(db, 'feedbacks'), {
        title: title.trim(),
        feedback: feedbackText.trim(),
        userName: encrypt(authStore.user.name),
        userId: encrypt(authStore.user.id),
        createdAt: new Date(),
        isRead: false
      });
      
      return true;
    } catch (err) {
      console.error('Error submitting feedback:', err);
      error.value = 'Failed to submit feedback';
      return false;
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * Mark feedback as read
   */
  const markAsRead = async (feedbackId: string) => {
    if (!isAdmin.value) {
      error.value = 'Unauthorized: Admin access required';
      return false;
    }

    isLoading.value = true;
    error.value = null;

    try {
      const feedbackRef = doc(db, 'feedbacks', feedbackId);
      await updateDoc(feedbackRef, {
        isRead: true
      });
      
      return true;
    } catch (err) {
      console.error('Error marking feedback as read:', err);
      error.value = 'Failed to update feedback status';
      return false;
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * Get unread feedback count for badge display
   */
  const getUnreadCount = async () => {
    if (!isAdmin.value) {
      return 0;
    }

    try {
      const q = query(
        collection(db, 'feedbacks'),
        where('isRead', '==', false)
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.size;
    } catch (err) {
      console.error('Error counting unread feedback:', err);
      return 0;
    }
  };

  /**
   * Delete feedback 
   */
  const deleteFeedback = async (feedbackId: string) => {
    if (!isAdmin.value) {
      error.value = 'Unauthorized: Admin access required';
      return false;
    }

    isLoading.value = true;
    error.value = null;

    try {
      const feedbackRef = doc(db, 'feedbacks', feedbackId);
      await deleteDoc(feedbackRef);
      
      return true;
    } catch (err) {
      console.error('Error deleting feedback:', err);
      error.value = 'Failed to delete feedback';
      return false;
    } finally {
      isLoading.value = false;
    }
  };

  return {
    isLoading,
    error,
    isAdmin,
    getAllFeedback,
    submitFeedback,
    markAsRead,
    getUnreadCount,
    deleteFeedback
  };
} 
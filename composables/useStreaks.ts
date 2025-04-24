// composables/useStreaks.ts
import { ref, computed, watch } from 'vue';
import { useJournalEntry } from './useJournalEntry';

export const useStreaks = () => {
  const { entries } = useJournalEntry();
  const currentStreak = ref(0);
  const longestStreak = ref(0);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  // Calculate current streak based on consecutive days with entries
  const calculateStreaks = () => {
    isLoading.value = true;
    error.value = null;

    try {
      // Safety check for entries
      if (!entries.value || !Array.isArray(entries.value) || entries.value.length === 0) {
        currentStreak.value = 0;
        longestStreak.value = 0;
        return;
      }

      // Filter out drafts and invalid entries, sort by date (newest first)
      const publishedEntries = entries.value
        .filter(entry => entry && !entry.isDraft && entry.createdAt)
        .sort((a, b) => {
          const dateA = a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt);
          const dateB = b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt);
          return dateB.getTime() - dateA.getTime();
        });

      if (!publishedEntries.length) {
        currentStreak.value = 0;
        longestStreak.value = 0;
        return;
      }

      // Group entries by day
      const entriesByDay = new Map<string, boolean>();
      
      publishedEntries.forEach(entry => {
        if (!entry || !entry.createdAt) return;
        
        const date = entry.createdAt instanceof Date ? entry.createdAt : new Date(entry.createdAt);
        // Skip invalid dates
        if (isNaN(date.getTime())) return;
        
        const dateString = new Date(date.getFullYear(), date.getMonth(), date.getDate()).toISOString().split('T')[0];
        entriesByDay.set(dateString, true);
      });

      // If no valid entries by day, return zero
      if (entriesByDay.size === 0) {
        currentStreak.value = 0;
        longestStreak.value = 0;
        return;
      }

      // Calculate current streak
      const today = new Date();
      const todayString = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString().split('T')[0];
      
      let streak = 0;
      let tempLongestStreak = 0;
      /* 
       * Using let for currentDate because we modify it: 
       * 1. Potentially on line 70 below when no entry for today
       * 2. In the while loop on line 86
       */
      const currentDate = new Date(today);
      const hasEntryToday = entriesByDay.has(todayString);
      
      // If no entry today, check yesterday to see if streak is still active
      if (!hasEntryToday) {
        currentDate.setDate(currentDate.getDate() - 1);
      }

      // Check consecutive days
      while (true) {
        const dateString = new Date(
          currentDate.getFullYear(),
          currentDate.getMonth(), 
          currentDate.getDate()
        ).toISOString().split('T')[0];
        
        if (entriesByDay.has(dateString)) {
          streak++;
          tempLongestStreak = Math.max(tempLongestStreak, streak);
          currentDate.setDate(currentDate.getDate() - 1);
        } else {
          break;
        }
      }

      currentStreak.value = streak;
      longestStreak.value = tempLongestStreak;
    } catch (err) {
      error.value = 'Failed to calculate streaks';
      console.error('Error calculating streaks:', err);
      currentStreak.value = 0;
      longestStreak.value = 0;
    } finally {
      isLoading.value = false;
    }
  };

  // Recalculate streaks whenever entries change
  watch(() => entries.value, calculateStreaks, { immediate: true });

  return {
    currentStreak: computed(() => currentStreak.value),
    longestStreak: computed(() => longestStreak.value),
    isLoading: computed(() => isLoading.value),
    error: computed(() => error.value),
    calculateStreaks
  };
}; 
// composables/useJournalEntry.ts
import { collection, query, addDoc, updateDoc, doc, orderBy, Timestamp, deleteDoc } from 'firebase/firestore';
import type { Firestore, DocumentData } from 'firebase/firestore';
import { ref, computed } from 'vue';
import { useFirestore, useCollection, useDocument } from 'vuefire';
import { useAuthStore } from '~/stores/auth';
import { useEncryption } from '~/composables/useEncryption';
import { until } from '@vueuse/core';

export interface JournalEntry {
  id?: string;
  title: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  tags?: string[];
  sentiments?: Record<string, number>;
  isDraft?: boolean;
}

// Type for Firebase update data
type FirebaseDocData = {
  [field: string]: string | number | boolean | Date | string[] | Record<string, number> | null | {
    data: string; // Add this to allow encrypted sentiment data
  };
};

export const useJournalEntry = () => {
  const firestore = useFirestore();
  const auth = useAuthStore();
  const { encrypt, decrypt } = useEncryption();
  const userId = computed(() => auth.user?.id);
  const error = ref<Error | null>(null);
  const isLoading = ref(false);
  //const entries = ref<JournalEntry[]>([]);
  const entry = ref<JournalEntry | null>(null);
  const currentEntry = ref<JournalEntry | null>(null);
  
  // Use VueFire's useCollection for reactive data
  const { data: journalEntriesCollection, pending: entriesPending } = useCollection(
    computed(() => {
      if (!userId.value) return null;
      return query(
        collection(firestore as Firestore, 'users', userId.value, 'journalEntries'),
        orderBy('createdAt', 'desc')
      );
    })
  );
  
  const entries = computed<JournalEntry[]>(() => {
    if (!journalEntriesCollection.value) {
      // Handle loading, error, or no-data case
      return [];
    }
    // Map and decrypt directly from VueFire's reactive data
    return journalEntriesCollection.value.map(entryDoc => {
       // Ensure decrypt handles potential errors or empty strings gracefully
       const decryptedTags = entryDoc.tags ? entryDoc.tags.map((tag: string) => decrypt(tag)) : [];
       let decryptedSentiments: Record<string, number> | undefined;
       try {
          decryptedSentiments = entryDoc.sentiments?.data ? JSON.parse(decrypt(entryDoc.sentiments.data)) : undefined;
       } catch(e) {
           console.error(`Failed to parse sentiments for entry ${entryDoc.id}:`, e);
           decryptedSentiments = undefined;
       }

       return {
        // Spread potentially non-existent fields carefully if needed based on Firestore structure
        // Assuming all fields exist but might be encrypted/need type conversion
        id: entryDoc.id, // VueFire adds the ID
        title: decrypt(entryDoc.title),
        content: decrypt(entryDoc.content),
        tags: decryptedTags,
        sentiments: decryptedSentiments,
        createdAt: entryDoc.createdAt instanceof Timestamp ? entryDoc.createdAt.toDate() : entryDoc.createdAt,
        updatedAt: entryDoc.updatedAt instanceof Timestamp ? entryDoc.updatedAt.toDate() : entryDoc.updatedAt,
        userId: userId.value || '', // Use the reactive userId
        isDraft: entryDoc.isDraft || false,
       } as JournalEntry; // Assert type if confident in mapping
    });
  });

  // Watch for changes in the collection data
  /*watch(journalEntries, (newEntries) => {
    if (newEntries) {
      entries.value = newEntries.map(entry => ({
        ...entry,
        id: entry.id,
        title: decrypt(entry.title),
        content: decrypt(entry.content),
        tags: entry.tags ? entry.tags.map((tag: string) => decrypt(tag)) : [],
        sentiments: entry.sentiments ? JSON.parse(decrypt(entry.sentiments.data)) : undefined,
        createdAt: entry.createdAt instanceof Timestamp ? entry.createdAt.toDate() : entry.createdAt,
        updatedAt: entry.updatedAt instanceof Timestamp ? entry.updatedAt.toDate() : entry.updatedAt,
        userId: userId.value || ''
      }));
    } else {
      entries.value = [];
    }
  });*/
  
  /**
   * Create a new journal entry
   * @param entry The journal entry to create
   */
  const createEntry = async (entry: Omit<JournalEntry, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    if (!userId.value) {
      error.value = new Error('You must be authenticated to create a journal entry');
      return null;
    }
    
    isLoading.value = true;
    error.value = null;
    
    try {
      const now = new Date();
      const entryData: FirebaseDocData = {
        content: encrypt(entry.content),
        title: encrypt(entry.title),
        createdAt: now,
        updatedAt: now,
        userId: userId.value,
        isDraft: entry.isDraft || false
      };
      
      if (entry.tags) {
        entryData.tags = entry.tags.map(tag => encrypt(tag));
      }
      
      if (entry.sentiments) {
        entryData.sentiments = {
          data: encrypt(JSON.stringify(entry.sentiments))
        };
      }
      
      const docRef = await addDoc(collection(firestore as Firestore, 'users', userId.value, 'journalEntries'), entryData);
      return { id: docRef.id };
    } catch (err) {
      console.error('Error creating journal entry:', err);
      error.value = new Error('Failed to create journal entry');
      return null;
    } finally {
      isLoading.value = false;
    }
  };
  
  /**
   * Get a journal entry by ID
   * @param id The ID of the entry to retrieve
   */
  const getEntry = async (id: string) => {
    if (!userId.value) {
      error.value = new Error('You must be authenticated to retrieve a journal entry');
      return null;
    }
    
    isLoading.value = true;
    error.value = null;
    
    try {
      const docRef = doc(firestore as Firestore, 'users', userId.value, 'journalEntries', id);
      const { data: entryData, pending } = useDocument<DocumentData>(docRef);
      
      // Wait for the document to be loaded
      await until(pending).toBe(false);
      
      if (!entryData.value) {
        error.value = new Error('Journal entry not found');
        return null;
      }
      
      // Create base entry with non-encrypted fields
      const decryptedData: JournalEntry = {
        id,
        title: decrypt(entryData.value.title),
        content: decrypt(entryData.value.content),
        createdAt: entryData.value.createdAt instanceof Timestamp ? entryData.value.createdAt.toDate() : entryData.value.createdAt,
        updatedAt: entryData.value.updatedAt instanceof Timestamp ? entryData.value.updatedAt.toDate() : entryData.value.updatedAt,
        userId: userId.value,
        isDraft: entryData.value.isDraft || false
      };
      
      // Add decrypted tags if they exist
      if (entryData.value.tags) {
        decryptedData.tags = entryData.value.tags.map((tag: string) => decrypt(tag));
      }
      
      // Add decrypted sentiments if they exist
      if (entryData.value.sentiments?.data) {
        decryptedData.sentiments = JSON.parse(decrypt(entryData.value.sentiments.data));
      }
      
      entry.value = decryptedData;
      return decryptedData;
    } catch (err) {
      console.error('Error getting journal entry:', err);
      error.value = new Error('Failed to get journal entry');
      return null;
    } finally {
      isLoading.value = false;
    }
  };
  
  /**
   * Update a journal entry
   * @param id The ID of the entry to update
   * @param updates The updates to apply
   */
  const updateEntry = async (id: string, updates: Partial<JournalEntry>) => {
    if (!userId.value) {
      error.value = new Error('You must be authenticated to update a journal entry');
      return false;
    }

    const currentUserId = auth.user?.id;

    if (!currentUserId) {
      console.log('No user ID found');
      error.value = new Error('You must be authenticated to update a journal entry');
      return false;
    }
    if (!id) {
      console.log('No ID found');
      error.value = new Error('You must be authenticated to update a journal entry');
      return false;
    }
    
    isLoading.value = true;
    error.value = null;
    
    console.log(`updateEntry called for User ID: ${currentUserId}, Entry ID: ${id}`);
    console.log('updateEntry updates:', JSON.stringify(updates));
    
    try {
      console.log('updateEntry called with updates:', JSON.stringify(updates));
      const docRef = doc(firestore as Firestore, 'users', currentUserId, 'journalEntries', id);
      const updateData: FirebaseDocData = {
        updatedAt: new Date()
      };
      
      if (updates.title !== undefined) {
        updateData.title = encrypt(updates.title);
      }
      
      if (updates.content !== undefined) {
        updateData.content = encrypt(updates.content);
      }
      
      if (updates.tags !== undefined) {
        updateData.tags = updates.tags.map(tag => encrypt(tag));
      }
      
      if (updates.sentiments !== undefined) {
        updateData.sentiments = {
          data: encrypt(JSON.stringify(updates.sentiments))
        };
      }
      
      // Explicitly handle isDraft field
      if (updates.isDraft !== undefined) {
        updateData.isDraft = updates.isDraft;
        console.log('Setting isDraft to:', updates.isDraft);
      }
      
      await updateDoc(docRef, updateData);
      return true;
    } catch (err) {
      console.error('Error updating journal entry:', err);
      error.value = new Error('Failed to update journal entry');
      
      return false;
    } finally {
      isLoading.value = false;
    }
  };
  
  /**
   * Delete a journal entry
   * @param id The ID of the entry to delete
   */
  const deleteEntry = async (id: string) => {
    if (!userId.value) {
      error.value = new Error('You must be authenticated to delete a journal entry');
      return false;
    }
    
    isLoading.value = true;
    error.value = null;
    
    try {
      const docRef = doc(firestore as Firestore, 'users', userId.value, 'journalEntries', id);
      await deleteDoc(docRef);
      return true;
    } catch (err) {
      console.error('Error deleting journal entry:', err);
      error.value = new Error('Failed to delete journal entry');
      return false;
    } finally {
      isLoading.value = false;
    }
  };
  
  /**
   * Set the current entry being edited
   * @param entry The entry to set as current
   */
  const setCurrentEntry = (entry: JournalEntry | null) => {
    currentEntry.value = entry;
  };
  
  /**
   * Load all journal entries
   * This is now handled automatically by VueFire's useCollection,
   * but we'll keep this method for backwards compatibility
   */
  const loadEntries = async () => {
    if (!userId.value) {
      error.value = new Error('You must be authenticated to load journal entries');
      return [];
    }
    
    isLoading.value = true;
    error.value = null;
    
    try {
      // The entries are already loaded reactively by useCollection
      // Just return the current entries
      return entries.value;
    } catch (err) {
      console.error('Error loading journal entries:', err);
      error.value = new Error('Failed to load journal entries');
      return [];
    } finally {
      isLoading.value = false;
    }
  };
  
  /**
   * Load a single journal entry by ID
   * @param id The ID of the entry to load
   */
  const loadEntry = async (id: string) => {
    entry.value = null;
    const result = await getEntry(id);
    if (result) {
      entry.value = result;
    }
    return result;
  };
  
  const _filterByTag = (_tag: string) => {
    // ... existing code ...
  }
  
  return {
    entries,
    entry,
    currentEntry,
    error,
    isLoading,
    pending: entriesPending,
    createEntry,
    getEntry,
    updateEntry,
    deleteEntry,
    setCurrentEntry,
    loadEntries,
    loadEntry
  };
}; 
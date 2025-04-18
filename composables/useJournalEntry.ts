import { collection, query, getDocs, addDoc, updateDoc, doc, getDoc, orderBy, Timestamp, deleteDoc } from 'firebase/firestore';
import { ref, computed } from 'vue';

export interface JournalEntry {
  id?: string;
  title: string;
  content: string;
  createdAt: Date | Timestamp;
  updatedAt: Date | Timestamp;
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

// Type for the encrypted sentiments structure
type EncryptedSentiments = {
  data: string;
};

export function useJournalEntry() {
  const { $firebaseDb } = useNuxtApp();
  const { encrypt, decrypt } = useEncryption();
  const authStore = useAuthStore();
  
  const isLoading = ref(false);
  const error = ref<string | null>(null);
  const entries = ref<JournalEntry[]>([]);
  const entry = ref<JournalEntry | null>(null);
  
  const currentEntry = ref<JournalEntry | null>(null);
  
  // Get the authenticated user ID
  const userId = computed(() => authStore.user?.id);
  
  /**
   * Create a new journal entry
   * @param entry The journal entry to create
   */
  const createEntry = async (entry: Omit<JournalEntry, 'userId' | 'createdAt' | 'updatedAt'>) => {
    if (!userId.value) {
      error.value = 'You must be authenticated to create a journal entry';
      return null;
    }
    
    isLoading.value = true;
    error.value = null;
    
    try {
      // Encrypt the content before storing
      const encryptedContent = encrypt(entry.content);
      const encryptedTitle = encrypt(entry.title);
      
      // Encrypt sentiments if they exist
      let encryptedSentiments: { data: string } | Record<string, number> = {};
      if (entry.sentiments && Object.keys(entry.sentiments).length > 0) {
        // Convert sentiments to JSON string and encrypt
        encryptedSentiments = {
          data: encrypt(JSON.stringify(entry.sentiments))
        } as EncryptedSentiments;
      }
      
      // Encrypt tags if they exist
      let encryptedTags: string[] = [];
      if (entry.tags && entry.tags.length > 0) {
        // Encrypt each tag individually
        encryptedTags = entry.tags.map(tag => encrypt(tag));
      }
      
      const now = new Date();
      const newEntry = {
        title: encryptedTitle,
        content: encryptedContent,
        createdAt: now,
        updatedAt: now,
        userId: userId.value,
        tags: encryptedTags,
        sentiments: encryptedSentiments
      };
      
      const docRef = await addDoc(collection($firebaseDb, 'users', userId.value, 'journalEntries'), newEntry);
      
      // Return the created entry with ID
      return {
        id: docRef.id,
        ...entry,
        userId: userId.value,
        createdAt: now,
        updatedAt: now
      };
    } catch (err) {
      console.error('Error creating journal entry:', err);
      error.value = 'Failed to create journal entry';
      return null;
    } finally {
      isLoading.value = false;
    }
  };
  
  /**
   * Update an existing journal entry
   * @param id The ID of the entry to update
   * @param updates The updates to apply
   */
  const updateEntry = async (id: string, updates: Partial<Omit<JournalEntry, 'userId' | 'createdAt' | 'updatedAt'>>) => {
    if (!userId.value) {
      error.value = 'You must be authenticated to update a journal entry';
      return false;
    }
    
    isLoading.value = true;
    error.value = null;
    
    try {
      const entryRef = doc($firebaseDb, 'users', userId.value, 'journalEntries', id);
      
      // Create update object with encrypted data
      const updateData: FirebaseDocData = {
        updatedAt: new Date()
      };
      
      if (updates.content !== undefined) {
        updateData.content = encrypt(updates.content);
      }
      
      if (updates.title !== undefined) {
        updateData.title = encrypt(updates.title);
      }
      
      if (updates.tags !== undefined) {
        // Encrypt each tag individually
        updateData.tags = updates.tags.map(tag => encrypt(tag));
      }
      
      if (updates.sentiments !== undefined) {
        // Encrypt sentiments
        updateData.sentiments = {
          data: encrypt(JSON.stringify(updates.sentiments))
        } as EncryptedSentiments;
      }
      
      await updateDoc(entryRef, updateData);
      return true;
    } catch (err) {
      console.error('Error updating journal entry:', err);
      error.value = 'Failed to update journal entry';
      return false;
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
      error.value = 'You must be authenticated to retrieve a journal entry';
      return null;
    }
    
    isLoading.value = true;
    error.value = null;
    
    try {
      const entryRef = doc($firebaseDb, 'users', userId.value, 'journalEntries', id);
      const entrySnap = await getDoc(entryRef);
      
      if (!entrySnap.exists()) {
        error.value = 'Journal entry not found';
        return null;
      }
      
      const data = entrySnap.data() as JournalEntry;
      
      // Decrypt the content and title
      const decryptedData: JournalEntry = {
        id: entrySnap.id,
        ...data,
        content: data.content ? decrypt(data.content) : '',
        title: data.title ? decrypt(data.title) : '',
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : data.createdAt,
        updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : data.updatedAt,
        tags: []  // Initialize with empty array, will be populated below
      };
      
      // Decrypt tags if they exist
      if (data.tags && Array.isArray(data.tags) && data.tags.length > 0) {
        try {
          decryptedData.tags = data.tags.map(tag => decrypt(tag));
        } catch (e) {
          console.error('Error decrypting tags:', e);
          decryptedData.tags = [];
        }
      }
      
      // Decrypt sentiments if they exist in the new encrypted format
      if (data.sentiments && typeof data.sentiments === 'object' && 'data' in data.sentiments) {
        try {
          // Cast sentiments to the right type to access data property
          const encryptedSentiments = data.sentiments as unknown as EncryptedSentiments;
          const decryptedSentiments = decrypt(encryptedSentiments.data);
          decryptedData.sentiments = JSON.parse(decryptedSentiments);
        } catch (e) {
          console.error('Error decrypting sentiments:', e);
          decryptedData.sentiments = {};
        }
      } else {
        // Handle older format or empty sentiments
        decryptedData.sentiments = data.sentiments || {};
      }
      
      return decryptedData;
    } catch (err) {
      console.error('Error retrieving journal entry:', err);
      error.value = 'Failed to retrieve journal entry';
      return null;
    } finally {
      isLoading.value = false;
    }
  };
  
  /**
   * Load all journal entries for the current user
   */
  const loadEntries = async () => {
    if (!userId.value) {
      error.value = 'You must be authenticated to load journal entries';
      return [];
    }
    
    isLoading.value = true;
    error.value = null;
    entries.value = [];
    
    try {
      const entriesRef = collection($firebaseDb, 'users', userId.value, 'journalEntries');
      const entriesQuery = query(entriesRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(entriesQuery);
      
      // Process each entry, decrypting content
      const loadedEntries: JournalEntry[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data() as JournalEntry;
        
        const decryptedEntry: JournalEntry = {
          id: doc.id,
          ...data,
          content: data.content ? decrypt(data.content) : '',
          title: data.title ? decrypt(data.title) : '',
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : data.createdAt,
          updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : data.updatedAt,
          tags: []  // Initialize with empty array, will be populated below
        };
        
        // Decrypt tags if they exist
        if (data.tags && Array.isArray(data.tags) && data.tags.length > 0) {
          try {
            decryptedEntry.tags = data.tags.map(tag => decrypt(tag));
          } catch (e) {
            console.error('Error decrypting tags:', e);
            decryptedEntry.tags = [];
          }
        }
        
        // Decrypt sentiments if they exist in the new encrypted format
        if (data.sentiments && typeof data.sentiments === 'object' && 'data' in data.sentiments) {
          try {
            // Cast sentiments to the right type to access data property
            const encryptedSentiments = data.sentiments as unknown as EncryptedSentiments;
            const decryptedSentiments = decrypt(encryptedSentiments.data);
            decryptedEntry.sentiments = JSON.parse(decryptedSentiments);
          } catch (e) {
            console.error('Error decrypting sentiments:', e);
            decryptedEntry.sentiments = {};
          }
        } else {
          // Handle older format or empty sentiments
          decryptedEntry.sentiments = data.sentiments || {};
        }
        
        loadedEntries.push(decryptedEntry);
      });
      
      entries.value = loadedEntries;
      return loadedEntries;
    } catch (err) {
      console.error('Error loading journal entries:', err);
      error.value = 'Failed to load journal entries';
      return [];
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
      error.value = 'You must be authenticated to delete a journal entry';
      return false;
    }
    
    isLoading.value = true;
    error.value = null;
    
    try {
      const entryRef = doc($firebaseDb, 'users', userId.value, 'journalEntries', id);
      await deleteDoc(entryRef);
      
      // Update local entries list
      entries.value = entries.value.filter(entry => entry.id !== id);
      return true;
    } catch (err) {
      console.error('Error deleting journal entry:', err);
      error.value = 'Failed to delete journal entry';
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
  
  return {
    entries,
    entry,
    currentEntry,
    isLoading,
    error,
    createEntry,
    updateEntry,
    getEntry,
    loadEntry,
    loadEntries,
    deleteEntry,
    setCurrentEntry
  };
} 
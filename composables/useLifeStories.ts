import { collection, query, addDoc, updateDoc, doc, orderBy, Timestamp, deleteDoc } from 'firebase/firestore';
import type { Firestore } from 'firebase/firestore';
import { ref, computed } from 'vue';
import { useFirestore, useCollection } from 'vuefire';
import { useAuthStore } from '~/stores/auth';
import { useEncryption } from '~/composables/useEncryption';
import type { 
  LifeStoryEntry, 
  FirestoreLifeStoryDoc, 
  LifeStoryLocation, 
  CustomField, 
  LifeStoryCustomFields 
} from '~/types/lifeStory';

export const useLifeStories = () => {
  const firestore = useFirestore();
  const auth = useAuthStore();
  const { encrypt, decrypt } = useEncryption();
  const userId = computed(() => auth.user?.id);
  const error = ref<Error | null>(null);
  const isLoading = ref(false);

  // Use VueFire's useCollection for reactive data
  const { data: lifeStoriesCollection, pending } = useCollection(
    computed(() => {
      if (!userId.value) return null;
      return query(
        collection(firestore as Firestore, 'users', userId.value, 'life_stories'),
        orderBy('eventTimestamp', 'desc')
      );
    })
  );

  // Computed property that maps and decrypts the raw Firestore data
  const lifeStories = computed<LifeStoryEntry[]>(() => {
    if (!lifeStoriesCollection.value) {
      return [];
    }

    // Map and decrypt the data from VueFire
    return lifeStoriesCollection.value.map(storyDoc => {
      // Decrypt location details if they exist
      let decryptedLocation: LifeStoryLocation | null = null;
      if (storyDoc.location) {
        decryptedLocation = {
          country: storyDoc.location.country,
          city: storyDoc.location.city,
          encryptedDetails: storyDoc.location.encryptedDetails ? decrypt(storyDoc.location.encryptedDetails) : null
        };
      }

      // Decrypt custom fields if they exist
      let decryptedCustomFields: LifeStoryCustomFields | null = null;
      if (storyDoc.customFields) {
        decryptedCustomFields = storyDoc.customFields.map((field: CustomField) => ({
          fieldName: field.fieldName,
          encryptedValue: decrypt(field.encryptedValue)
        }));
      }

      // Return the decrypted life story entry
      return {
        id: storyDoc.id, // VueFire adds the ID
        userId: storyDoc.userId,
        createdAt: storyDoc.createdAt,
        updatedAt: storyDoc.updatedAt,
        encryptedTitle: decrypt(storyDoc.encryptedTitle),
        encryptedContent: decrypt(storyDoc.encryptedContent),
        eventTimestamp: storyDoc.eventTimestamp,
        eventGranularity: storyDoc.eventGranularity,
        eventEndDate: storyDoc.eventEndDate || null,
        eventLabel: storyDoc.eventLabel || null,
        location: decryptedLocation,
        customFields: decryptedCustomFields
      } as LifeStoryEntry;
    });
  });

  /**
   * Add a new life story entry
   * @param data The life story entry data (without id, userId, timestamps)
   */
  const addLifeStory = async (data: Omit<LifeStoryEntry, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    if (!userId.value) {
      error.value = new Error('You must be authenticated to create a life story entry');
      return null;
    }

    isLoading.value = true;
    error.value = null;

    try {
      const now = Timestamp.now();
      
      // Prepare the data for Firestore, encrypting sensitive fields
      const storyData: Partial<FirestoreLifeStoryDoc> = {
        userId: userId.value,
        createdAt: now,
        updatedAt: now,
        encryptedTitle: encrypt(data.encryptedTitle),
        encryptedContent: encrypt(data.encryptedContent),
        eventTimestamp: data.eventTimestamp,
        eventGranularity: data.eventGranularity
      };

      // Add optional fields if they exist
      if (data.eventEndDate) {
        storyData.eventEndDate = data.eventEndDate;
      }

      if (data.eventLabel) {
        storyData.eventLabel = data.eventLabel;
      }

      // Encrypt location details if they exist
      if (data.location) {
        storyData.location = {
          country: data.location.country,
          city: data.location.city,
          encryptedDetails: data.location.encryptedDetails ? encrypt(data.location.encryptedDetails) : null
        };
      }

      // Encrypt custom fields if they exist
      if (data.customFields && data.customFields.length > 0) {
        storyData.customFields = data.customFields.map(field => ({
          fieldName: field.fieldName,
          encryptedValue: encrypt(field.encryptedValue)
        }));
      }

      // Add the document to Firestore
      const docRef = await addDoc(
        collection(firestore as Firestore, 'users', userId.value, 'life_stories'), 
        storyData
      );

      return { id: docRef.id };
    } catch (err) {
      console.error('Error creating life story entry:', err);
      error.value = new Error('Failed to create life story entry');
      return null;
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * Update an existing life story entry
   * @param entryId The ID of the entry to update
   * @param updates The updates to apply (partial data)
   */
  const updateLifeStory = async (entryId: string, updates: Partial<LifeStoryEntry>) => {
    if (!userId.value) {
      error.value = new Error('You must be authenticated to update a life story entry');
      return false;
    }

    isLoading.value = true;
    error.value = null;

    try {
      const docRef = doc(firestore as Firestore, 'users', userId.value, 'life_stories', entryId);
      const updateData: Partial<FirestoreLifeStoryDoc> = {
        updatedAt: Timestamp.now()
      };

      // Only encrypt and update fields that are included in the updates
      if (updates.encryptedTitle !== undefined) {
        updateData.encryptedTitle = encrypt(updates.encryptedTitle);
      }

      if (updates.encryptedContent !== undefined) {
        updateData.encryptedContent = encrypt(updates.encryptedContent);
      }

      if (updates.eventTimestamp !== undefined) {
        updateData.eventTimestamp = updates.eventTimestamp;
      }

      if (updates.eventGranularity !== undefined) {
        updateData.eventGranularity = updates.eventGranularity;
      }

      if (updates.eventEndDate !== undefined) {
        updateData.eventEndDate = updates.eventEndDate;
      }

      if (updates.eventLabel !== undefined) {
        updateData.eventLabel = updates.eventLabel;
      }

      // Handle location updates if provided
      if (updates.location !== undefined) {
        if (updates.location === null) {
          updateData.location = null;
        } else {
          updateData.location = {
            country: updates.location.country,
            city: updates.location.city,
            encryptedDetails: updates.location.encryptedDetails 
              ? encrypt(updates.location.encryptedDetails) 
              : null
          };
        }
      }

      // Handle custom fields updates if provided
      if (updates.customFields !== undefined) {
        if (updates.customFields === null) {
          updateData.customFields = null;
        } else {
          updateData.customFields = updates.customFields.map(field => ({
            fieldName: field.fieldName,
            encryptedValue: encrypt(field.encryptedValue)
          }));
        }
      }

      // Update the document in Firestore
      await updateDoc(docRef, updateData);
      return true;
    } catch (err) {
      console.error('Error updating life story entry:', err);
      error.value = new Error('Failed to update life story entry');
      return false;
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * Delete a life story entry
   * @param entryId The ID of the entry to delete
   */
  const deleteLifeStory = async (entryId: string) => {
    if (!userId.value) {
      error.value = new Error('You must be authenticated to delete a life story entry');
      return false;
    }

    isLoading.value = true;
    error.value = null;

    try {
      const docRef = doc(firestore as Firestore, 'users', userId.value, 'life_stories', entryId);
      await deleteDoc(docRef);
      return true;
    } catch (err) {
      console.error('Error deleting life story entry:', err);
      error.value = new Error('Failed to delete life story entry');
      return false;
    } finally {
      isLoading.value = false;
    }
  };

  return {
    lifeStories,
    pending,
    isLoading,
    error,
    addLifeStory,
    updateLifeStory,
    deleteLifeStory
  };
}; 
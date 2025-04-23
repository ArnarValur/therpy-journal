import type { Timestamp } from 'firebase/firestore';

export type LifeStoryGranularity = 'day' | 'month' | 'year' | 'range' | 'era';

export interface LifeStoryLocation {
  country?: string | null;
  city?: string | null;
  encryptedDetails?: string | null; // Client-side encrypted
}

// Define structure for custom fields (decided on array of objects approach)
export interface CustomField {
   fieldName: string;
   encryptedValue: string; // Client-side encrypted
}
export type LifeStoryCustomFields = CustomField[];

export interface LifeStoryEntry {
  id: string; // Firestore document ID, added client-side after fetch
  userId: string;
  createdAt: Timestamp; // Use Firestore Timestamp type for consistency
  updatedAt: Timestamp; // Use Firestore Timestamp type
  encryptedTitle: string; // Client-side encrypted
  encryptedContent: string; // Client-side encrypted (rich text)
  eventTimestamp: Timestamp; // Primary timestamp for sorting/filtering
  eventGranularity: LifeStoryGranularity;
  eventEndDate?: Timestamp | null; // For 'range' granularity
  eventLabel?: string | null; // Descriptive label (era, range)
  location?: LifeStoryLocation | null;
  customFields?: LifeStoryCustomFields | null;
}

// Type for raw data fetched from Firestore before decryption
export interface FirestoreLifeStoryDoc {
  // Define fields as stored in Firestore (e.g., encrypted strings)
  // Mirror LifeStoryEntry structure but with raw encrypted fields
  // Omit 'id' as it comes from the document snapshot
  userId: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  encryptedTitle: string;
  encryptedContent: string;
  eventTimestamp: Timestamp;
  eventGranularity: LifeStoryGranularity;
  eventEndDate?: Timestamp | null;
  eventLabel?: string | null;
  location?: LifeStoryLocation | null; // Structure might need encrypted values within
  customFields?: LifeStoryCustomFields | null; // Structure might need encrypted values within
} 
import type { Timestamp } from 'firebase/firestore';

export type LifeStoryGranularity = 'day' | 'month' | 'year' | 'range' | 'era';

export interface LifeStoryLocation {
  country?: string | null;
  city?: string | null;
  Details?: string | null; // Client-side 
}

// Define structure for custom fields (decided on array of objects approach)
export interface CustomField {
   fieldName: string;
   Value: string; // Client-side 
}
export type LifeStoryCustomFields = CustomField[];

export interface LifeStoryEntry {
  id: string; // Firestore document ID, added client-side after fetch
  userId: string;
  createdAt: Timestamp; // Use Firestore Timestamp type for consistency
  updatedAt: Timestamp; // Use Firestore Timestamp type
  title: string; // Client-side 
  content: string; // Client-side  (rich text)
  eventTimestamp: Timestamp; // Primary timestamp for sorting/filtering
  eventGranularity: LifeStoryGranularity;
  eventEndDate?: Timestamp | null; // For 'range' granularity
  eventLabel?: string | null; // Descriptive label (era, range)
  location?: LifeStoryLocation | null;
  customFields?: LifeStoryCustomFields | null;
  isDraft?: boolean; // Flag for draft status
}

// Type for raw data fetched from Firestore before decryption
export interface FirestoreLifeStoryDoc {
  // Define fields as stored in Firestore (e.g., encrypted strings)
  // Mirror LifeStoryEntry structure but with raw encrypted fields
  // Omit 'id' as it comes from the document snapshot
  userId: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  title: string; // Encrypted
  content: string; // Encrypted
  eventTimestamp: Timestamp;
  eventGranularity: string; // Encrypted LifeStoryGranularity
  eventEndDate?: Timestamp | null;
  eventLabel?: string | null; // Encrypted
  location?: {
    country?: string | null; // Encrypted
    city?: string | null; // Encrypted
    Details?: string | null; // Encrypted
  } | null;
  customFields?: {
    fieldName: string; // Encrypted
    Value: string; // Encrypted
  }[] | null;
  isDraft?: boolean; // Flag for draft status
} 
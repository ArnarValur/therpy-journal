// composables/useEncryption.ts
import CryptoJS from 'crypto-js';

/**
 * Composable for handling encryption and decryption of sensitive data
 * Uses AES encryption with user-specific key
 */
export function useEncryption() {
  // Get the current user ID to use as part of the encryption key
  const getUserEncryptionKey = (): string => {
    const { user } = useAuthStore();
    if (!user) {
      throw new Error('User must be authenticated to encrypt/decrypt data');
    }
    
    // Create a user-specific encryption key by combining their ID with a secret
    // This ensures each user has a unique encryption key tied to their account
    return `therpy-journal-${user.id}-secure-key`;
  };

  /**
   * Encrypts text data using AES encryption
   * @param data - Plain text data to encrypt
   * @returns Encrypted string
   */
  const encrypt = (data: string): string => {
    try {
      const key = getUserEncryptionKey();
      return CryptoJS.AES.encrypt(data, key).toString();
    } catch (error) {
      console.error('Encryption error:', error);
      throw new Error('Failed to encrypt data');
    }
  };

  /**
   * Decrypts encrypted data back to plain text
   * @param encryptedData - Encrypted string
   * @returns Decrypted plain text
   */
  const decrypt = (encryptedData: string): string => {
    try {
      const key = getUserEncryptionKey();
      const bytes = CryptoJS.AES.decrypt(encryptedData, key);
      return bytes.toString(CryptoJS.enc.Utf8);
    } catch (error) {
      console.error('Decryption error:', error);
      throw new Error('Failed to decrypt data');
    }
  };

  return {
    encrypt,
    decrypt
  };
} 
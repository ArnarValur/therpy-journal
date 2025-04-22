import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { defineNuxtPlugin } from '#app';
import { useRuntimeConfig } from '#imports';

interface FirebaseConfig {
  projectId: string;
  clientEmail: string;
  privateKey: string;
}

export default defineNuxtPlugin({
  name: 'firebase-admin',
  enforce: 'pre',
  async setup() {
    const config = useRuntimeConfig();
    const firebaseConfig = config.firebaseAdmin as FirebaseConfig;
    const publicConfig = config.public.firebase as {
      projectId: string;
      [key: string]: string;
    };
    
    // Only initialize if no apps exist
    if (getApps().length === 0) {
      try {
        // Initialize with service account
        initializeApp({
          credential: cert({
            projectId: publicConfig.projectId,
            clientEmail: firebaseConfig.clientEmail,
            privateKey: firebaseConfig.privateKey.replace(/\\n/g, '\n'),
          })
        });
        console.log('[SERVER] Firebase Admin initialized successfully');
      } catch (error) {
        console.error('[SERVER] Error initializing Firebase Admin:', error);
        throw error;
      }
    }
  }
}); 
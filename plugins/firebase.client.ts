import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import type { FirebaseOptions } from 'firebase/app';

/**
 * Firebase plugin to initialize Firebase services
 * This plugin has higher priority to ensure it's initialized before auth plugin
 */
export default defineNuxtPlugin({
  name: 'firebase',
  enforce: 'pre', // This ensures this plugin runs before others
  setup() {
    const config = useRuntimeConfig();
    
    // Firebase config
    const firebaseConfig: FirebaseOptions = {
      apiKey: config.public.firebaseApiKey as string,
      authDomain: config.public.firebaseAuthDomain as string,
      projectId: config.public.firebaseProjectId as string,
      storageBucket: config.public.firebaseStorageBucket as string,
      messagingSenderId: config.public.firebaseMessagingSenderId as string,
      appId: config.public.firebaseAppId as string,
      measurementId: config.public.firebaseMeasurementId as string
    };

    console.log('Initializing Firebase');
    
    // Initialize Firebase only on client-side
    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const firestore = getFirestore(app);
    const storage = getStorage(app);

    return {
      provide: {
        firebaseApp: app,
        firebaseAuth: auth,
        firebaseDb: firestore,
        firebaseStorage: storage
      }
    };
  }
}); 
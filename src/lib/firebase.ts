import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'dummy-key-for-compilation',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

export const isConfigured =
  Boolean(firebaseConfig.projectId) &&
  firebaseConfig.projectId !== 'your-project-id' &&
  firebaseConfig.apiKey !== 'your-api-key' &&
  firebaseConfig.apiKey !== 'dummy-key-for-compilation';

let appInstance: any = null;
let dbInstance: any = null;

if (isConfigured) {
  try {
    appInstance = initializeApp(firebaseConfig);
    dbInstance = getFirestore(appInstance);
  } catch (err) {
    console.error('[Firebase Init Error]:', err);
  }
}

export const app = appInstance;
export const db = dbInstance;

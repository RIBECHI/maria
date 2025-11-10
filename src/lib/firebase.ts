
import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getStorage, type FirebaseStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Singleton pattern to initialize Firebase app only once, and only on the client
function initializeFirebaseApp(): FirebaseApp | null {
  if (typeof window === 'undefined') {
    return null;
  }
  if (getApps().length === 0) {
    if (Object.values(firebaseConfig).some(value => !value)) {
        console.error("Firebase config is incomplete. Firebase App could not be initialized.");
        return null;
    }
    return initializeApp(firebaseConfig);
  }
  return getApp();
}

const app = initializeFirebaseApp();

// Correctly export services, which will be null on the server.
export const db: Firestore | null = app ? getFirestore(app) : null;
export const auth: Auth | null = app ? getAuth(app) : null;
export const storage: FirebaseStorage | null = app ? getStorage(app) : null;

// Re-exporting for compatibility with existing imports
export const getDb = () => db;
export const getAuthInstance = () => auth;
export const getStorageInstance = () => storage;

export { app };

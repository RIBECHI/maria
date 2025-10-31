
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

// Singleton pattern to initialize Firebase app only once
function getFirebaseApp(): FirebaseApp {
  if (!getApps().length) {
    return initializeApp(firebaseConfig);
  }
  return getApp();
}

export function getDb(): Firestore {
  return getFirestore(getFirebaseApp());
}

export function getAuthInstance(): Auth {
  return getAuth(getFirebaseApp());
}

export function getStorageInstance(): FirebaseStorage {
  return getStorage(getFirebaseApp());
}

// Exporting the app instance for any other potential direct use
export const app = getFirebaseApp();
// Exporting services for compatibility with existing code that might still import them directly
export const db = getDb();
export const auth = getAuthInstance();
export const storage = getStorageInstance();

    
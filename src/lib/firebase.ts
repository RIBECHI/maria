
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

// This function is safe to be called in any environment.
// It checks if we are on the client side before initializing.
function getFirebaseApp(): FirebaseApp | null {
    if (typeof window === 'undefined') {
        return null;
    }
    return getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
}

// These functions will now safely return null on the server
export function getDb(): Firestore | null {
    const app = getFirebaseApp();
    return app ? getFirestore(app) : null;
}

export function getAuthInstance(): Auth | null {
    const app = getFirebaseApp();
    return app ? getAuth(app) : null;
}

export function getStorageInstance(): FirebaseStorage | null {
    const app = getFirebaseApp();
    return app ? getStorage(app) : null;
}

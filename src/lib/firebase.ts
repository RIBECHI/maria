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

// This function ensures Firebase is initialized only once
const getFirebaseApp = (): FirebaseApp => {
  if (getApps().length === 0) {
    // This check ensures we have a valid config before initializing
    if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
      // In a server environment during build, these might be undefined.
      // We throw a clear error that can be seen during development.
      // In production (Vercel), these env vars MUST be set.
      throw new Error("Firebase config is not valid. Make sure NEXT_PUBLIC_FIREBASE_ environment variables are set.");
    }
    return initializeApp(firebaseConfig);
  } else {
    return getApp();
  }
};

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let storage: FirebaseStorage;

// This block ensures that Firebase is ONLY initialized on the client-side
if (typeof window !== 'undefined') {
  try {
    app = getFirebaseApp();
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);
  } catch (e) {
    console.error("Failed to initialize Firebase on the client.", e);
    // You could potentially set these to null or handle the error gracefully
  }
}

// @ts-ignore - These will be initialized on the client
export { app, db, storage, auth };

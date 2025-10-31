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

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let storage: FirebaseStorage;

// This check is crucial. It ensures that Firebase is only initialized on the client-side.
// The code inside this block will not run during server-side rendering or build time.
if (typeof window !== 'undefined' && !getApps().length) {
    try {
        app = initializeApp(firebaseConfig);
        auth = getAuth(app);
        db = getFirestore(app);
        storage = getStorage(app);
    } catch (e) {
        console.error("Failed to initialize Firebase on the client.", e);
        // In case of an error, you might want to handle it gracefully.
        // For now, we'll log it. The services will be undefined, which might
        // cause subsequent errors, but it prevents the initial crash.
    }
}

// We re-export the initialized services. They will be undefined on the server,
// but that's okay because our components using them are now strictly client-side.
export { app, db, storage, auth };


import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getStorage, type FirebaseStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyAgRM15QQg0Kf0BMFhP7V-GmN5aPF_Z3zk",
  authDomain: "lexmanager.firebaseapp.com",
  projectId: "lexmanager",
  storageBucket: "lexmanager.appspot.com",
  messagingSenderId: "487471917143",
  appId: "1:487471917143:web:82033f194252d4ada95b12",
};

// This will hold the initialized services
let services: {
    app: FirebaseApp;
    auth: Auth;
    db: Firestore;
    storage: FirebaseStorage;
} | null = null;

/**
 * Initializes and/or returns the Firebase services singleton.
 * This ensures Firebase is initialized only once, whether on server or client.
 */
export const getFirebaseServices = () => {
    if (!services) {
        const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
        services = {
            app,
            auth: getAuth(app),
            db: getFirestore(app),
            storage: getStorage(app),
        };
    }
    return services;
};

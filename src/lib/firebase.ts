
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  "projectId": "lexmanager",
  "appId": "1:487471917143:web:82033f194252d4ada95b12",
  "apiKey": "AIzaSyAgRM15QQg0Kf0BMFhP7V-GmN5aPF_Z3zk",
  "authDomain": "lexmanager.firebaseapp.com",
  "measurementId": "",
  "messagingSenderId": "487471917143"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

export { app, db };

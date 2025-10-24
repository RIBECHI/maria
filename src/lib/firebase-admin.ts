
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getStorage } from 'firebase-admin/storage';

const serviceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
};

const BUCKET_NAME = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;

// Garante que o app admin seja inicializado apenas uma vez.
if (!getApps().length) {
  try {
    initializeApp({
      credential: cert(serviceAccount),
      storageBucket: BUCKET_NAME,
    });
  } catch (e: any) {
    console.error('Firebase Admin Initialization Error:', e.message);
    // Não lança o erro para evitar que a aplicação quebre em cenários onde o admin sdk não é estritamente necessário.
  }
}

let bucket;
try {
  bucket = getStorage().bucket();
} catch (e: any) {
  console.error("Could not get storage bucket. Firebase Admin SDK might not be initialized correctly.");
}

export { bucket };

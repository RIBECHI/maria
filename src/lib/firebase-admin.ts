
import { initializeApp, getApps, cert, getApp } from 'firebase-admin/app';
import { getStorage } from 'firebase-admin/storage';

function initializeFirebaseAdmin() {
  if (getApps().length > 0) {
    return getApp();
  }

  const serviceAccount = {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  };

  // Durante o build, as variáveis de ambiente podem não estar disponíveis.
  // Não inicialize se as credenciais não estiverem completas.
  if (!serviceAccount.projectId || !serviceAccount.clientEmail || !serviceAccount.privateKey) {
    console.warn("Firebase Admin credentials not fully provided. Skipping initialization.");
    return null;
  }

  try {
    return initializeApp({
      credential: cert(serviceAccount),
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    });
  } catch (e: any) {
    console.error('Firebase Admin Initialization Error:', e.message);
    return null;
  }
}

function getBucket() {
  const app = initializeFirebaseAdmin();
  if (!app) {
    console.error("Cannot get bucket, Firebase Admin SDK is not initialized.");
    return null; // Retorna null se a inicialização falhar
  }
  return getStorage(app).bucket();
}

const bucket = getBucket();

export { bucket };

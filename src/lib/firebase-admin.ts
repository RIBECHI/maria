import admin from 'firebase-admin';
import { getApps } from 'firebase-admin/app';

// As credenciais são lidas automaticamente das variáveis de ambiente
// FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, e FIREBASE_PRIVATE_KEY
// que você configurará no arquivo .env.local

if (!getApps().length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    });
    console.log("Firebase Admin SDK inicializado com sucesso.");
  } catch (error: any) {
    console.error("Erro ao inicializar Firebase Admin SDK:", error.message);
    if (!process.env.FIREBASE_PROJECT_ID) console.error("Variável de ambiente FIREBASE_PROJECT_ID não definida.");
    if (!process.env.FIREBASE_CLIENT_EMAIL) console.error("Variável de ambiente FIREBASE_CLIENT_EMAIL não definida.");
    if (!process.env.FIREBASE_PRIVATE_KEY) console.error("Variável de ambiente FIREBASE_PRIVATE_KEY não definida.");
    if (!process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET) console.error("Variável de ambiente NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET não definida.");
  }
}

const adminDb = admin.firestore();
const adminStorage = admin.storage();

export { adminDb, adminStorage, admin };

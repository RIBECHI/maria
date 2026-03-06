'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';

// Armazena as instâncias dos serviços Firebase para garantir que sejam inicializadas apenas uma vez (padrão Singleton).
let firebaseServices: {
  firebaseApp: FirebaseApp;
  auth: Auth;
  firestore: Firestore;
  storage: FirebaseStorage;
} | null = null;

/**
 * Inicializa e/ou obtém as instâncias dos serviços do Firebase de forma segura.
 * Garante que a inicialização ocorra apenas uma vez com a configuração correta.
 */
export function initializeFirebase() {
  // Se os serviços já foram inicializados, retorna a instância existente.
  if (firebaseServices) {
    return firebaseServices;
  }

  // Obtém a app Firebase existente ou a inicializa com a configuração completa.
  // Isso é crucial para garantir que todas as propriedades, como 'storageBucket', estejam definidas.
  const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

  // Obtém as instâncias dos serviços associados à app.
  const auth = getAuth(app);
  const firestore = getFirestore(app);
  // Força o uso do bucket correto, fornecendo o URL completo.
  const storage = getStorage(app, `gs://${firebaseConfig.storageBucket}`);

  // Armazena as instâncias na variável do módulo para uso futuro.
  firebaseServices = { firebaseApp: app, auth, firestore, storage };
  
  return firebaseServices;
}


// IMPORTANT: DO NOT MODIFY THIS FUNCTION
export function getSdks(firebaseApp: FirebaseApp) {
  return {
    firebaseApp,
    auth: getAuth(firebaseApp),
    firestore: getFirestore(firebaseApp),
    storage: getStorage(firebaseApp)
  };
}

export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './non-blocking-updates';
export * from './non-blocking-login';
export * from './errors';
export * from './error-emitter';

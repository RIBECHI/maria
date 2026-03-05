
import { initializeFirebase } from '@/firebase';
import { collection, getDocs, doc, setDoc, updateDoc, serverTimestamp, query, orderBy, FirestoreError, getDoc, type DocumentData } from 'firebase/firestore';
import { errorEmitter, FirestorePermissionError } from '@/firebase';
import type { User } from 'firebase/auth';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: 'Admin' | 'Usuário Padrão';
  createdAt: string;
  updatedAt?: string;
}

const fromFirestore = (docSnap: DocumentData): UserProfile => {
  const data = docSnap.data();
  return {
    id: docSnap.id,
    name: data.name,
    email: data.email,
    role: data.role,
    createdAt: data.createdAt?.toDate().toISOString(),
    updatedAt: data.updatedAt?.toDate().toISOString(),
  };
};

const USERS_COLLECTION = 'users';

// CREATE USER PROFILE
export async function createUserProfile(user: User): Promise<void> {
  const { firestore } = initializeFirebase();
  const userDocRef = doc(firestore, USERS_COLLECTION, user.uid);
  
  // Define o e-mail do administrador. Altere se desejar.
  const adminEmail = "admin@lexmanager.com";

  const newUserProfile: Omit<UserProfile, 'id' | 'createdAt' | 'updatedAt'> = {
    name: user.displayName || user.email || 'Usuário Anônimo',
    email: user.email || '',
    role: user.email === adminEmail ? 'Admin' : 'Usuário Padrão', // Atribui Admin se o e-mail corresponder
  };

  try {
    const docSnap = await getDoc(userDocRef);
    if (!docSnap.exists()) {
        const dataToSave = {
            ...newUserProfile,
            id: user.uid,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        };
        setDoc(userDocRef, dataToSave).catch(error => {
            if (error instanceof FirestoreError && error.code === 'permission-denied') {
              errorEmitter.emit('permission-error', new FirestorePermissionError({
                path: `${USERS_COLLECTION}/${user.uid}`,
                operation: 'create',
                requestResourceData: dataToSave,
              }));
            }
        });
    }
  } catch(error) {
    if (error instanceof FirestoreError && error.code === 'permission-denied') {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: `${USERS_COLLECTION}/${user.uid}`,
        operation: 'get',
      }));
    }
  }
}

// READ ALL USERS (for admins)
export function getUsers(): Promise<UserProfile[]> {
  const { firestore, auth } = initializeFirebase();
  const usersCollectionRef = collection(firestore, USERS_COLLECTION);
  const q = query(usersCollectionRef, orderBy("name", "asc"));
  
  return getDocs(q)
    .then(querySnapshot => querySnapshot.docs.map(fromFirestore))
    .catch(error => {
        if (error instanceof FirestoreError && error.code === 'permission-denied') {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: USERS_COLLECTION,
            operation: 'list',
        }));
        }
        return [];
    });
}

// UPDATE USER ROLE (for admins)
export function updateUserRole(userId: string, role: 'Admin' | 'Usuário Padrão'): void {
    const { firestore, auth } = initializeFirebase();
    const userDocRef = doc(firestore, USERS_COLLECTION, userId);
    const dataToUpdate = { role, updatedAt: serverTimestamp() };
    
    updateDoc(userDocRef, dataToUpdate).catch(error => {
       if (error instanceof FirestoreError && error.code === 'permission-denied') {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: `${USERS_COLLECTION}/${userId}`,
            operation: 'update',
            requestResourceData: dataToUpdate,
        }));
        }
    });
}

// UPDATE USER NAME
export function updateUserName(userId: string, newName: string): void {
  const { firestore, auth } = initializeFirebase();
  const userDocRef = doc(firestore, USERS_COLLECTION, userId);
  const dataToUpdate = { name: newName, updatedAt: serverTimestamp() };
  
  updateDoc(userDocRef, dataToUpdate).catch(error => {
     if (error instanceof FirestoreError && error.code === 'permission-denied') {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: `${USERS_COLLECTION}/${userId}`,
          operation: 'update',
          requestResourceData: dataToUpdate,
      }));
      }
  });
}

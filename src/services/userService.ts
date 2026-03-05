
import { getFirebaseServices } from '@/lib/firebase';
import { collection, getDocs, doc, setDoc, updateDoc, serverTimestamp, query, orderBy, FirestoreError, getDoc, type DocumentData } from 'firebase/firestore';
import { errorEmitter, FirestorePermissionError, SecurityRuleContext } from '@/lib/errors';
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
  const { db } = getFirebaseServices();
  const userDocRef = doc(db, USERS_COLLECTION, user.uid);
  
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
              const context: SecurityRuleContext = {
                path: `${USERS_COLLECTION}/${user.uid}`,
                operation: 'create',
                auth: user ? { uid: user.uid } : null,
                resource: dataToSave,
              };
              errorEmitter.emit('permission-error', new FirestorePermissionError(context));
            }
        });
    }
  } catch(error) {
    if (error instanceof FirestoreError && error.code === 'permission-denied') {
      const context: SecurityRuleContext = {
        path: `${USERS_COLLECTION}/${user.uid}`,
        operation: 'get',
        auth: user ? { uid: user.uid } : null,
      };
      errorEmitter.emit('permission-error', new FirestorePermissionError(context));
    }
  }
}

// READ ALL USERS (for admins)
export function getUsers(): Promise<UserProfile[]> {
  const { db, auth } = getFirebaseServices();
  const usersCollectionRef = collection(db, USERS_COLLECTION);
  const q = query(usersCollectionRef, orderBy("name", "asc"));
  
  return getDocs(q)
    .then(querySnapshot => querySnapshot.docs.map(fromFirestore))
    .catch(error => {
        if (error instanceof FirestoreError && error.code === 'permission-denied') {
        const context: SecurityRuleContext = {
            path: USERS_COLLECTION,
            operation: 'list',
            auth: auth.currentUser ? { uid: auth.currentUser.uid } : null,
        };
        errorEmitter.emit('permission-error', new FirestorePermissionError(context));
        }
        return [];
    });
}

// UPDATE USER ROLE (for admins)
export function updateUserRole(userId: string, role: 'Admin' | 'Usuário Padrão'): void {
    const { db, auth } = getFirebaseServices();
    const userDocRef = doc(db, USERS_COLLECTION, userId);
    const dataToUpdate = { role, updatedAt: serverTimestamp() };
    
    updateDoc(userDocRef, dataToUpdate).catch(error => {
       if (error instanceof FirestoreError && error.code === 'permission-denied') {
        const context: SecurityRuleContext = {
            path: `${USERS_COLLECTION}/${userId}`,
            operation: 'update',
            auth: auth.currentUser ? { uid: auth.currentUser.uid } : null,
            resource: dataToUpdate,
        };
        errorEmitter.emit('permission-error', new FirestorePermissionError(context));
        }
    });
}

// UPDATE USER NAME
export function updateUserName(userId: string, newName: string): void {
  const { db, auth } = getFirebaseServices();
  const userDocRef = doc(db, USERS_COLLECTION, userId);
  const dataToUpdate = { name: newName, updatedAt: serverTimestamp() };
  
  updateDoc(userDocRef, dataToUpdate).catch(error => {
     if (error instanceof FirestoreError && error.code === 'permission-denied') {
      const context: SecurityRuleContext = {
          path: `${USERS_COLLECTION}/${userId}`,
          operation: 'update',
          auth: auth.currentUser ? { uid: auth.currentUser.uid } : null,
          resource: dataToUpdate,
      };
      errorEmitter.emit('permission-error', new FirestorePermissionError(context));
      }
  });
}

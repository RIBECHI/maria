
import { auth, db } from '@/lib/firebase';
import { collection, getDocs, doc, setDoc, updateDoc, serverTimestamp, query, orderBy, FirestoreError, getDoc, type DocumentData } from 'firebase/firestore';
import { errorEmitter, FirestorePermissionError, SecurityRuleContext } from '@/lib/errors';
import type { User } from 'firebase/auth';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: 'Admin' | 'Usuário Padrão';
  createdAt: string;
}

const fromFirestore = (docSnap: DocumentData): UserProfile => {
  const data = docSnap.data();
  return {
    id: docSnap.id,
    name: data.name,
    email: data.email,
    role: data.role,
    createdAt: data.createdAt?.toDate().toISOString(),
  };
};

const USERS_COLLECTION = 'users';

// CREATE USER PROFILE
export async function createUserProfile(user: User): Promise<void> {
  if (!db) throw new Error("Firebase DB not initialized");
  const userDocRef = doc(db, USERS_COLLECTION, user.uid);
  
  const newUserProfile: Omit<UserProfile, 'id' | 'createdAt'> = {
    name: user.displayName || user.email || 'Usuário Anônimo',
    email: user.email || '',
    role: 'Usuário Padrão', // Default role for new users
  };

  try {
    // Use setDoc com merge: true para criar ou atualizar sem sobrescrever,
    // mas só se o documento não existir para evitar reescritas desnecessárias.
    const docSnap = await getDoc(userDocRef);
    if (!docSnap.exists()) {
        await setDoc(userDocRef, {
            ...newUserProfile,
            createdAt: serverTimestamp(),
        });
    }
  } catch(error) {
    if (error instanceof FirestoreError && error.code === 'permission-denied') {
      const context: SecurityRuleContext = {
        path: `${USERS_COLLECTION}/${user.uid}`,
        operation: 'create',
        auth: user ? { uid: user.uid } : null,
        resource: newUserProfile,
      };
      errorEmitter.emit('permission-error', new FirestorePermissionError(context));
    }
    throw error;
  }
}

// READ ALL USERS (for admins)
export async function getUsers(): Promise<UserProfile[]> {
  if (!db) throw new Error("Firebase DB not initialized");
  const usersCollectionRef = collection(db, USERS_COLLECTION);
  const q = query(usersCollectionRef, orderBy("name", "asc"));
  try {
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(fromFirestore);
  } catch (error) {
    if (error instanceof FirestoreError && error.code === 'permission-denied') {
      const context: SecurityRuleContext = {
        path: USERS_COLLECTION,
        operation: 'list',
        auth: auth.currentUser ? { uid: auth.currentUser.uid } : null,
      };
      errorEmitter.emit('permission-error', new FirestorePermissionError(context));
    }
    throw error;
  }
}

// UPDATE USER ROLE (for admins)
export async function updateUserRole(userId: string, role: 'Admin' | 'Usuário Padrão'): Promise<void> {
    if (!db) throw new Error("Firebase DB not initialized");
    const userDocRef = doc(db, USERS_COLLECTION, userId);
    
    try {
        await updateDoc(userDocRef, { role });
    } catch(error) {
       if (error instanceof FirestoreError && error.code === 'permission-denied') {
        const context: SecurityRuleContext = {
            path: `${USERS_COLLECTION}/${userId}`,
            operation: 'update',
            auth: auth.currentUser ? { uid: auth.currentUser.uid } : null,
            resource: { role },
        };
        errorEmitter.emit('permission-error', new FirestorePermissionError(context));
        }
        throw error;
    }
}

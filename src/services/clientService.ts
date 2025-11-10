
import { auth, db } from '@/lib/firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, query, orderBy, limit, type DocumentData, getDoc, FirestoreError } from 'firebase/firestore';
import type { Client, ClientFormValues } from '@/components/clients/ClientFormDialog';
import { Timestamp } from 'firebase/firestore';
import { errorEmitter, FirestorePermissionError, SecurityRuleContext } from '@/lib/errors';

const fromFirestore = (docSnap: DocumentData): Client => {
  const data = docSnap.data();
  const client: Client = {
    id: docSnap.id,
    name: data.name,
    contact: data.contact,
    cpf: data.cpf,
    caseCount: data.caseCount,
    lastActivity: data.lastActivity,
    address: data.address,
    notes: data.notes,
  };
  if (data.createdAt && data.createdAt instanceof Timestamp) {
      client.createdAt = data.createdAt.toDate().toISOString();
  }
  return client;
};


// READ
export async function getClients(): Promise<Client[]> {
  if (!db) throw new Error("Firebase DB not initialized");
  const clientsCollectionRef = collection(db, 'clients');
  const q = query(clientsCollectionRef, orderBy("name", "asc"));
  try {
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(fromFirestore);
  } catch (error) {
    if (error instanceof FirestoreError && error.code === 'permission-denied') {
      const context: SecurityRuleContext = {
        path: 'clients',
        operation: 'list',
        auth: auth.currentUser ? { uid: auth.currentUser.uid } : null,
      };
      const permissionError = new FirestorePermissionError(context);
      errorEmitter.emit('permission-error', permissionError);
    }
    // Re-throw other errors or handle them as needed
    throw error;
  }
}

// READ RECENT
export async function getRecentClients(count: number = 3): Promise<Client[]> {
  if (!db) throw new Error("Firebase DB not initialized");
  const clientsCollectionRef = collection(db, 'clients');
  const q = query(clientsCollectionRef, orderBy("createdAt", "desc"), limit(count));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(fromFirestore);
}

// CREATE
export async function addClient(clientData: Omit<Client, 'id' | 'createdAt'>): Promise<Client> {
    if (!db) throw new Error("Firebase DB not initialized");
    const clientsCollectionRef = collection(db, 'clients');
    
    try {
        const docRef = await addDoc(clientsCollectionRef, {
            ...clientData,
            createdAt: serverTimestamp(),
        });
        const snapshot = await getDoc(docRef);
        return fromFirestore(snapshot);
    } catch(error) {
        if (error instanceof FirestoreError && error.code === 'permission-denied') {
            const context: SecurityRuleContext = {
                path: `clients`,
                operation: 'create',
                auth: auth.currentUser ? { uid: auth.currentUser.uid } : null,
                resource: clientData,
            };
            errorEmitter.emit('permission-error', new FirestorePermissionError(context));
        }
        throw error;
    }
}

// UPDATE
export async function updateClient(clientId: string, clientData: ClientFormValues): Promise<Client> {
    if (!db) throw new Error("Firebase DB not initialized");
    const clientDocRef = doc(db, 'clients', clientId);
    try {
        await updateDoc(clientDocRef, {
            ...clientData,
            updatedAt: serverTimestamp(),
        });
        
        const snapshot = await getDoc(clientDocRef);
        return fromFirestore(snapshot);
    } catch(error) {
        if (error instanceof FirestoreError && error.code === 'permission-denied') {
            const context: SecurityRuleContext = {
                path: `clients/${clientId}`,
                operation: 'update',
                auth: auth.currentUser ? { uid: auth.currentUser.uid } : null,
                resource: clientData,
            };
            errorEmitter.emit('permission-error', new FirestorePermissionError(context));
        }
        throw error;
    }
}

// DELETE
export async function deleteClient(clientId: string): Promise<void> {
    if (!db) throw new Error("Firebase DB not initialized");
    const clientDocRef = doc(db, 'clients', clientId);
    try {
        await deleteDoc(clientDocRef);
    } catch(error) {
        if (error instanceof FirestoreError && error.code === 'permission-denied') {
            const context: SecurityRuleContext = {
                path: `clients/${clientId}`,
                operation: 'delete',
                auth: auth.currentUser ? { uid: auth.currentUser.uid } : null,
            };
            errorEmitter.emit('permission-error', new FirestorePermissionError(context));
        }
        throw error;
    }
}

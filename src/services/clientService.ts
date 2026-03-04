
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
    maritalStatus: data.maritalStatus,
    occupation: data.occupation,
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
export function getClients(): Promise<Client[]> {
  if (!db) throw new Error("Firebase DB not initialized");
  const clientsCollectionRef = collection(db, 'clients');
  const q = query(clientsCollectionRef, orderBy("name", "asc"));
  
  return getDocs(q)
    .then(querySnapshot => querySnapshot.docs.map(fromFirestore))
    .catch(error => {
      if (error instanceof FirestoreError && error.code === 'permission-denied') {
        const context: SecurityRuleContext = {
          path: 'clients',
          operation: 'list',
          auth: auth.currentUser ? { uid: auth.currentUser.uid } : null,
        };
        errorEmitter.emit('permission-error', new FirestorePermissionError(context));
      }
      return [];
    });
}

// READ RECENT
export function getRecentClients(count: number = 3): Promise<Client[]> {
  if (!db) throw new Error("Firebase DB not initialized");
  const clientsCollectionRef = collection(db, 'clients');
  const q = query(clientsCollectionRef, orderBy("createdAt", "desc"), limit(count));
  
  return getDocs(q)
    .then(querySnapshot => querySnapshot.docs.map(fromFirestore))
    .catch(error => {
       if (error instanceof FirestoreError && error.code === 'permission-denied') {
        const context: SecurityRuleContext = {
          path: 'clients',
          operation: 'list',
          auth: auth.currentUser ? { uid: auth.currentUser.uid } : null,
        };
        errorEmitter.emit('permission-error', new FirestorePermissionError(context));
      }
      return [];
    });
}

// CREATE
export function addClient(clientData: Omit<Client, 'id' | 'createdAt'>): void {
    if (!db) throw new Error("Firebase DB not initialized");
    const clientsCollectionRef = collection(db, 'clients');
    
    const dataToSave = {
        ...clientData,
        createdAt: serverTimestamp(),
    };

    addDoc(clientsCollectionRef, dataToSave)
      .catch(error => {
        if (error instanceof FirestoreError && error.code === 'permission-denied') {
            const context: SecurityRuleContext = {
                path: `clients`,
                operation: 'create',
                auth: auth.currentUser ? { uid: auth.currentUser.uid } : null,
                resource: dataToSave,
            };
            errorEmitter.emit('permission-error', new FirestorePermissionError(context));
        }
    });
}

// UPDATE
export function updateClient(clientId: string, clientData: ClientFormValues): void {
    if (!db) throw new Error("Firebase DB not initialized");
    const clientDocRef = doc(db, 'clients', clientId);
    const dataToUpdate = {
        ...clientData,
        updatedAt: serverTimestamp(),
    };

    updateDoc(clientDocRef, dataToUpdate)
      .catch(error => {
        if (error instanceof FirestoreError && error.code === 'permission-denied') {
            const context: SecurityRuleContext = {
                path: `clients/${clientId}`,
                operation: 'update',
                auth: auth.currentUser ? { uid: auth.currentUser.uid } : null,
                resource: dataToUpdate,
            };
            errorEmitter.emit('permission-error', new FirestorePermissionError(context));
        }
    });
}

// DELETE
export function deleteClient(clientId: string): void {
    if (!db) throw new Error("Firebase DB not initialized");
    const clientDocRef = doc(db, 'clients', clientId);
    
    deleteDoc(clientDocRef).catch(error => {
        if (error instanceof FirestoreError && error.code === 'permission-denied') {
            const context: SecurityRuleContext = {
                path: `clients/${clientId}`,
                operation: 'delete',
                auth: auth.currentUser ? { uid: auth.currentUser.uid } : null,
            };
            errorEmitter.emit('permission-error', new FirestorePermissionError(context));
        }
    });
}

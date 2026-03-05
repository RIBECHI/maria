
import { initializeFirebase } from '@/firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, query, orderBy, limit, type DocumentData, getDoc, FirestoreError } from 'firebase/firestore';
import type { Client, ClientFormValues } from '@/components/clients/ClientFormDialog';
import { Timestamp } from 'firebase/firestore';
import { errorEmitter, FirestorePermissionError } from '@/firebase';

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
  const { firestore, auth } = initializeFirebase();
  const clientsCollectionRef = collection(firestore, 'clients');
  const q = query(clientsCollectionRef, orderBy("name", "asc"));
  
  return getDocs(q)
    .then(querySnapshot => querySnapshot.docs.map(fromFirestore))
    .catch(error => {
      if (error instanceof FirestoreError && error.code === 'permission-denied') {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: 'clients',
          operation: 'list',
        }));
      }
      return [];
    });
}

// READ RECENT
export function getRecentClients(count: number = 3): Promise<Client[]> {
  const { firestore, auth } = initializeFirebase();
  const clientsCollectionRef = collection(firestore, 'clients');
  const q = query(clientsCollectionRef, orderBy("createdAt", "desc"), limit(count));
  
  return getDocs(q)
    .then(querySnapshot => querySnapshot.docs.map(fromFirestore))
    .catch(error => {
       if (error instanceof FirestoreError && error.code === 'permission-denied') {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: 'clients',
          operation: 'list',
        }));
      }
      return [];
    });
}

// CREATE
export async function addClient(clientData: Omit<Client, 'id' | 'createdAt'>): Promise<void> {
    const { firestore, auth } = initializeFirebase();
    const clientsCollectionRef = collection(firestore, 'clients');
    
    const dataToSave = {
        ...clientData,
        createdAt: serverTimestamp(),
    };

    try {
        await addDoc(clientsCollectionRef, dataToSave);
    } catch (error) {
      if (error instanceof FirestoreError && error.code === 'permission-denied') {
          errorEmitter.emit('permission-error', new FirestorePermissionError({
              path: `clients`,
              operation: 'create',
              requestResourceData: dataToSave,
          }));
      }
      throw error;
    }
}

// UPDATE
export async function updateClient(clientId: string, clientData: ClientFormValues): Promise<void> {
    const { firestore, auth } = initializeFirebase();
    const clientDocRef = doc(firestore, 'clients', clientId);
    const dataToUpdate = {
        ...clientData,
        updatedAt: serverTimestamp(),
    };

    try {
      await updateDoc(clientDocRef, dataToUpdate);
    } catch (error) {
      if (error instanceof FirestoreError && error.code === 'permission-denied') {
          errorEmitter.emit('permission-error', new FirestorePermissionError({
              path: `clients/${clientId}`,
              operation: 'update',
              requestResourceData: dataToUpdate,
          }));
      }
      throw error;
    }
}

// DELETE
export function deleteClient(clientId: string): void {
    const { firestore, auth } = initializeFirebase();
    const clientDocRef = doc(firestore, 'clients', clientId);
    
    deleteDoc(clientDocRef).catch(error => {
        if (error instanceof FirestoreError && error.code === 'permission-denied') {
            errorEmitter.emit('permission-error', new FirestorePermissionError({
                path: `clients/${clientId}`,
                operation: 'delete',
            }));
        }
    });
}

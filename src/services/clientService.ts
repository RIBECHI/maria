
import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, query, orderBy, limit, type DocumentData, getDoc } from 'firebase/firestore';
import type { Client, ClientFormValues } from '@/components/clients/ClientFormDialog';
import { Timestamp } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors';


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
  if (!db) {
    console.error("Firestore DB is not initialized.");
    return [];
  }
  const clientsCollectionRef = collection(db, 'clients');
  const q = query(clientsCollectionRef, orderBy("name", "asc"));
  const querySnapshot = await getDocs(q).catch(async (serverError) => {
    const permissionError = new FirestorePermissionError({
        path: clientsCollectionRef.path,
        operation: 'list',
    } satisfies SecurityRuleContext);
    errorEmitter.emit('permission-error', permissionError);
    throw permissionError;
  });
  return querySnapshot.docs.map(fromFirestore);
}

// READ RECENT
export async function getRecentClients(count: number = 3): Promise<Client[]> {
  if (!db) {
    console.error("Firestore DB is not initialized.");
    return [];
  }
  const clientsCollectionRef = collection(db, 'clients');
  const q = query(clientsCollectionRef, orderBy("createdAt", "desc"), limit(count));
  const querySnapshot = await getDocs(q).catch(async (serverError) => {
    const permissionError = new FirestorePermissionError({
        path: clientsCollectionRef.path,
        operation: 'list',
    } satisfies SecurityRuleContext);
    errorEmitter.emit('permission-error', permissionError);
    throw permissionError;
  });
  return querySnapshot.docs.map(fromFirestore);
}

// CREATE
export async function addClient(clientData: Omit<Client, 'id' | 'createdAt'>): Promise<Client> {
    if (!db) {
      throw new Error("Firestore DB is not initialized.");
    }
    const clientsCollectionRef = collection(db, 'clients');
    const dataWithTimestamp = {
        ...clientData,
        createdAt: serverTimestamp(),
    };
    const docRef = await addDoc(clientsCollectionRef, dataWithTimestamp)
        .catch(async (serverError) => {
            const permissionError = new FirestorePermissionError({
                path: clientsCollectionRef.path,
                operation: 'create',
                requestResourceData: dataWithTimestamp,
            } satisfies SecurityRuleContext);
            errorEmitter.emit('permission-error', permissionError);
            throw permissionError;
        });
    const snapshot = await getDoc(docRef);
    return fromFirestore(snapshot);
}

// UPDATE
export async function updateClient(clientId: string, clientData: ClientFormValues): Promise<Client> {
    if (!db) {
      throw new Error("Firestore DB is not initialized.");
    }
    const clientDocRef = doc(db, 'clients', clientId);
    const dataWithTimestamp = {
        ...clientData,
        updatedAt: serverTimestamp(),
    };
    await updateDoc(clientDocRef, dataWithTimestamp)
        .catch(async (serverError) => {
            const permissionError = new FirestorePermissionError({
                path: clientDocRef.path,
                operation: 'update',
                requestResourceData: dataWithTimestamp,
            } satisfies SecurityRuleContext);
            errorEmitter.emit('permission-error', permissionError);
            throw permissionError;
        });
    
    const snapshot = await getDoc(clientDocRef);
    return fromFirestore(snapshot);
}

// DELETE
export async function deleteClient(clientId: string): Promise<void> {
    if (!db) {
      throw new Error("Firestore DB is not initialized.");
    }
    const clientDocRef = doc(db, 'clients', clientId);
    deleteDoc(clientDocRef)
        .catch(async (serverError) => {
            const permissionError = new FirestorePermissionError({
                path: clientDocRef.path,
                operation: 'delete',
            } satisfies SecurityRuleContext);
            errorEmitter.emit('permission-error', permissionError);
            throw permissionError;
        });
}

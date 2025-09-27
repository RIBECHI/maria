
import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import type { Client, ClientFormValues } from '@/components/clients/ClientFormDialog';

const clientsCollectionRef = collection(db, 'clients');

// READ
export async function getClients(): Promise<Client[]> {
  const querySnapshot = await getDocs(clientsCollectionRef);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as Client[];
}

// CREATE
export async function addClient(clientData: Omit<Client, 'id'>): Promise<Client> {
    const docRef = await addDoc(clientsCollectionRef, {
        ...clientData,
        createdAt: serverTimestamp(),
    });
    return { id: docRef.id, ...clientData } as Client;
}

// UPDATE
export async function updateClient(clientId: string, clientData: ClientFormValues): Promise<Client> {
    const clientDocRef = doc(db, 'clients', clientId);
    await updateDoc(clientDocRef, {
        ...clientData,
        updatedAt: serverTimestamp(),
    });
    // This is a bit of a simplification. We're returning the updated data,
    // but the full client object might have other properties.
    // In a real app you might re-fetch the client data.
    return { id: clientId, ...clientData, caseCount: 0, lastActivity: '' } as Client;
}

// DELETE
export async function deleteClient(clientId: string): Promise<void> {
    const clientDocRef = doc(db, 'clients', clientId);
    await deleteDoc(clientDocRef);
}

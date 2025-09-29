
import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, query, orderBy, limit, type DocumentData, getDoc } from 'firebase/firestore';
import type { Client, ClientFormValues } from '@/components/clients/ClientFormDialog';
import { Timestamp } from 'firebase/firestore';

const clientsCollectionRef = collection(db, 'clients');

const fromFirestore = (docSnap: DocumentData): Client => {
  const data = docSnap.data();
  const client: Client = {
    id: docSnap.id,
    name: data.name,
    contact: data.contact,
    cpf: data.cpf,
    caseCount: data.caseCount,
    lastActivity: data.lastActivity,
    city: data.city,
    notes: data.notes,
  };
  if (data.createdAt) {
      client.createdAt = data.createdAt.toDate().toISOString();
  }
  return client;
};


// READ
export async function getClients(): Promise<Client[]> {
  const q = query(clientsCollectionRef, orderBy("name", "asc"));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(fromFirestore);
}

// READ RECENT
export async function getRecentClients(count: number = 3): Promise<Client[]> {
  const q = query(clientsCollectionRef, orderBy("createdAt", "desc"), limit(count));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(fromFirestore);
}

// CREATE
export async function addClient(clientData: Omit<Client, 'id' | 'createdAt'>): Promise<Client> {
    const docRef = await addDoc(clientsCollectionRef, {
        ...clientData,
        createdAt: serverTimestamp(),
    });
    const snapshot = await getDoc(docRef);
    return fromFirestore(snapshot);
}

// UPDATE
export async function updateClient(clientId: string, clientData: ClientFormValues): Promise<Client> {
    const clientDocRef = doc(db, 'clients', clientId);
    await updateDoc(clientDocRef, {
        ...clientData,
        updatedAt: serverTimestamp(),
    });
    
    // Para um retorno consistente, o ideal seria refazer a busca do documento,
    // mas para simplificar, montamos o objeto de retorno.
    const snapshot = await getDoc(clientDocRef);
    return fromFirestore(snapshot);
}

// DELETE
export async function deleteClient(clientId: string): Promise<void> {
    const clientDocRef = doc(db, 'clients', clientId);
    await deleteDoc(clientDocRef);
}

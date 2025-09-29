
import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, query, orderBy, limit, type DocumentData } from 'firebase/firestore';
import type { Client, ClientFormValues } from '@/components/clients/ClientFormDialog';
import { Timestamp } from 'firebase/firestore';

const clientsCollectionRef = collection(db, 'clients');

const fromFirestore = (doc: DocumentData): Client => {
  const data = doc.data();
  return {
    id: doc.id,
    name: data.name,
    contact: data.contact,
    cpf: data.cpf,
    caseCount: data.caseCount,
    lastActivity: data.lastActivity,
    city: data.city,
    notes: data.notes,
    createdAt: data.createdAt,
  } as Client;
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
    const createdAt = Timestamp.now(); // Simula o timestamp para retorno imediato
    return { id: docRef.id, ...clientData, createdAt } as Client;
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

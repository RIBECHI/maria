
import { auth, db } from '@/lib/firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, type DocumentData, query, orderBy, limit, getDoc, Timestamp, FirestoreError } from 'firebase/firestore';
import type { Process, ProcessFormValues, TimelineEvent } from '@/components/processes/ProcessFormDialog';
import { errorEmitter, FirestorePermissionError, SecurityRuleContext } from '@/lib/errors';
import { getClients, addClient as createClient } from './clientService'; // Renomeando para evitar conflito

// Helper para remover chaves indefinidas de um objeto, agora de forma recursiva
const removeUndefinedKeys = (obj: any): any => {
  if (Array.isArray(obj)) {
    return obj.map(item => removeUndefinedKeys(item));
  }
  // A verificação foi ajustada para não remover 'null'
  if (obj !== null && typeof obj === 'object') {
    const newObj: { [key: string]: any } = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        const value = obj[key];
        if (value !== undefined) {
          newObj[key] = removeUndefinedKeys(value);
        }
      }
    }
    return newObj;
  }
  return obj;
};


// Helper para converter dados do Firestore
const fromFirestore = (docSnap: DocumentData): Process => {
  const data = docSnap.data();
  const process: Process = {
    id: docSnap.id,
    processNumber: data.processNumber,
    clients: data.clients || (data.client ? [data.client] : []), // Compatibilidade
    type: data.type,
    comarca: data.comarca,
    status: data.status,
    phaseId: data.phaseId,
    nextDeadline: data.nextDeadline,
    documents: data.documents,
    expressoGoias: data.expressoGoias,
    uhd: data.uhd,
    certidao: data.certidao,
    apensos: data.apensos || [],
    timeline: (data.timeline || []).sort((a: TimelineEvent, b: TimelineEvent) => new Date(b.date).getTime() - new Date(a.date).getTime()),
  };
  if (data.createdAt && data.createdAt instanceof Timestamp) {
    process.createdAt = data.createdAt.toDate().toISOString();
  }
  return process;
};

// READ ALL
export async function getProcesses(): Promise<Process[]> {
  if (!db) throw new Error("Firebase DB not initialized");
  const processesCollectionRef = collection(db, 'processes');
  const q = query(processesCollectionRef, orderBy("createdAt", "desc"));
  try {
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(fromFirestore);
  } catch (error) {
    if (error instanceof FirestoreError && error.code === 'permission-denied') {
      const context: SecurityRuleContext = {
        path: 'processes',
        operation: 'list',
        auth: auth.currentUser ? { uid: auth.currentUser.uid } : null,
      };
      errorEmitter.emit('permission-error', new FirestorePermissionError(context));
    }
    // Return empty array on permission error to avoid breaking UI
    if (error instanceof FirestoreError && error.code === 'permission-denied') {
      return [];
    }
    throw error;
  }
}

// READ RECENT
export async function getRecentProcesses(count?: number): Promise<Process[]> {
    if (!db) return [];
    const processesCollectionRef = collection(db, 'processes');
    const q = count 
        ? query(processesCollectionRef, orderBy("createdAt", "desc"), limit(count))
        : query(processesCollectionRef, orderBy("createdAt", "desc"));
    try {
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(fromFirestore);
    } catch(error) {
        console.error("Failed to get recent processes:", error);
        return []; // Return empty array on error
    }
}

// Automatic client creation logic
async function ensureClientsExist(clientNames: string[]): Promise<void> {
    if (clientNames.length === 0) return;

    const allClients = await getClients();
    // Normaliza os nomes existentes para minúsculas e sem espaços extras
    const existingClientNames = new Set(allClients.map(c => c.name.toLowerCase().trim()));
    const clientsToCreate = new Set<string>();

    for (const clientName of clientNames) {
        // Normaliza o nome do novo cliente antes de verificar
        const normalizedClientName = clientName.toLowerCase().trim();
        if (normalizedClientName && !existingClientNames.has(normalizedClientName)) {
            // Adiciona o nome original (com maiúsculas) para ser criado
            clientsToCreate.add(clientName.trim());
        }
    }

    if (clientsToCreate.size === 0) {
        return;
    }

    for (const clientName of clientsToCreate) {
        await createClient({
            name: clientName,
            contact: "Contato não informado",
            caseCount: 0,
            lastActivity: new Date().toISOString().split('T')[0],
        });
    }
}


// CREATE
export async function addProcess(processData: Omit<Process, 'id' | 'createdAt'>): Promise<Process> {
  if (!db) throw new Error("Firebase DB not initialized");
  const processesCollectionRef = collection(db, 'processes');
  const cleanData = removeUndefinedKeys(processData);
  
  // Garante que os clientes existam antes de criar o processo
  if (cleanData.clients && cleanData.clients.length > 0) {
    await ensureClientsExist(cleanData.clients);
  }

  try {
    const docRef = await addDoc(processesCollectionRef, {
        ...cleanData,
        createdAt: serverTimestamp(),
    });
    const snapshot = await getDoc(docRef);
    return fromFirestore(snapshot);
  } catch (error) {
    if (error instanceof FirestoreError && error.code === 'permission-denied') {
        const context: SecurityRuleContext = {
            path: `processes`,
            operation: 'create',
            auth: auth.currentUser ? { uid: auth.currentUser.uid } : null,
            resource: cleanData,
        };
        errorEmitter.emit('permission-error', new FirestorePermissionError(context));
    }
    throw error;
  }
}

// UPDATE
export async function updateProcess(processId: string, processData: Partial<ProcessFormValues & { timeline?: TimelineEvent[] }>): Promise<Process> {
  if (!db) throw new Error("Firebase DB not initialized");
  const processDocRef = doc(db, 'processes', processId);
  const cleanData = removeUndefinedKeys(processData);

  // Garante que os clientes existam antes de atualizar o processo
  if (cleanData.clients && cleanData.clients.length > 0) {
    await ensureClientsExist(cleanData.clients);
  }
  
  try {
    await updateDoc(processDocRef, {
        ...cleanData,
        updatedAt: serverTimestamp(),
    });

    const snapshot = await getDoc(processDocRef);
    return fromFirestore(snapshot);
  } catch (error) {
    if (error instanceof FirestoreError && error.code === 'permission-denied') {
        const context: SecurityRuleContext = {
            path: `processes/${processId}`,
            operation: 'update',
            auth: auth.currentUser ? { uid: auth.currentUser.uid } : null,
            resource: cleanData,
        };
        errorEmitter.emit('permission-error', new FirestorePermissionError(context));
    }
    throw error;
  }
}

// DELETE
export async function deleteProcess(processId: string): Promise<void> {
  if (!db) throw new Error("Firebase DB not initialized");
  const processDocRef = doc(db, 'processes', processId);
  try {
    await deleteDoc(processDocRef);
  } catch (error) {
    if (error instanceof FirestoreError && error.code === 'permission-denied') {
        const context: SecurityRuleContext = {
            path: `processes/${processId}`,
            operation: 'delete',
            auth: auth.currentUser ? { uid: auth.currentUser.uid } : null,
        };
        errorEmitter.emit('permission-error', new FirestorePermissionError(context));
    }
    throw error;
  }
}


import { initializeFirebase } from '@/firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, type DocumentData, query, orderBy, limit, getDoc, Timestamp, FirestoreError } from 'firebase/firestore';
import type { Process, ProcessFormValues, TimelineEvent } from '@/components/processes/ProcessFormDialog';
import { errorEmitter, FirestorePermissionError } from '@/firebase';
import { getClients, addClient as createClient } from './clientService'; // Renomeando para evitar conflito
import { getPhases } from './phaseService';

// Helper para remover chaves indefinidas de um objeto, agora de forma recursiva
const removeUndefinedKeys = (obj: any): any => {
  if (Array.isArray(obj)) {
    return obj.map(item => removeUndefinedKeys(item));
  }
  
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
const fromFirestore = (docSnap: DocumentData, phases: any[]): Process => {
  const data = docSnap.data();
  const phase = phases.find(p => p.id === data.phaseId);

  const process: Process = {
    id: docSnap.id,
    processNumber: data.processNumber,
    clients: data.clients || (data.client ? [data.client] : []), // Compatibilidade
    type: data.type,
    comarca: data.comarca,
    phaseId: data.phaseId,
    phaseName: phase ? phase.name : "Não Classificado",
    nextDeadline: data.nextDeadline,
    documents: data.documents,
    expressoGoias: data.expressoGoias,
    uhd: data.uhd,
    certidao: data.certidao,
    apensos: data.apensos || [],
    driveLinks: data.driveLinks || [],
    timeline: (data.timeline || []).sort((a: TimelineEvent, b: TimelineEvent) => new Date(b.date).getTime() - new Date(a.date).getTime()),
  };
  if (data.createdAt && data.createdAt instanceof Timestamp) {
    process.createdAt = data.createdAt.toDate().toISOString();
  }
  return process;
};

// READ ALL
export async function getProcesses(): Promise<Process[]> {
  const { firestore, auth } = initializeFirebase();
  try {
    const [phasesSnapshot, processesSnapshot] = await Promise.all([
        getPhases(),
        getDocs(query(collection(firestore, 'processes'), orderBy("createdAt", "desc")))
    ]);
    return processesSnapshot.docs.map(doc => fromFirestore(doc, phasesSnapshot));
  } catch(error) {
     if (error instanceof FirestoreError && error.code === 'permission-denied') {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: 'processes',
        operation: 'list',
      }));
    }
    return [];
  }
}

// READ RECENT
export async function getRecentProcesses(count?: number): Promise<Process[]> {
    if (!initializeFirebase().firestore) return [];
    try {
        const allProcesses = await getProcesses(); // Reutiliza a função principal que já ordena
        return count ? allProcesses.slice(0, count) : allProcesses;
    } catch(error) {
        console.error("Failed to get recent processes:", error);
        return []; // Return empty array on error
    }
}

// Automatic client creation logic
async function ensureClientsExist(clientNames: string[]): Promise<void> {
    if (clientNames.length === 0) return;

    const allClients = await getClients();
    const existingClientNames = new Set(allClients.map(c => c.name.toLowerCase().trim()));
    const clientsToCreate = new Set<string>();

    for (const clientName of clientNames) {
        const normalizedClientName = clientName.toLowerCase().trim();
        if (normalizedClientName && !existingClientNames.has(normalizedClientName)) {
            clientsToCreate.add(clientName.trim());
        }
    }

    if (clientsToCreate.size === 0) return;

    for (const clientName of clientsToCreate) {
        createClient({
            name: clientName,
            contact: "Contato não informado",
            caseCount: 0,
            lastActivity: new Date().toISOString().split('T')[0],
        });
    }
}


// CREATE
export async function addProcess(processData: Omit<Process, 'id' | 'createdAt' | 'phaseName'>): Promise<void> {
  const { firestore, auth } = initializeFirebase();
  const processesCollectionRef = collection(firestore, 'processes');
  const cleanData = removeUndefinedKeys(processData);
  
  if (cleanData.clients && cleanData.clients.length > 0) {
    await ensureClientsExist(cleanData.clients);
  }

  const dataToSave = {
    ...cleanData,
    createdAt: serverTimestamp(),
  };

  addDoc(processesCollectionRef, dataToSave).catch(error => {
    if (error instanceof FirestoreError && error.code === 'permission-denied') {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: `processes`,
            operation: 'create',
            requestResourceData: dataToSave,
        }));
    }
  });
}

// UPDATE
export async function updateProcess(processId: string, processData: Partial<ProcessFormValues & { timeline?: TimelineEvent[], driveLinks?: string[] }>): Promise<void> {
  const { firestore, auth } = initializeFirebase();
  const processDocRef = doc(firestore, 'processes', processId);
  const cleanData = removeUndefinedKeys(processData);

  if (cleanData.clients && cleanData.clients.length > 0) {
    await ensureClientsExist(cleanData.clients);
  }
  
  const dataToUpdate = {
      ...cleanData,
      updatedAt: serverTimestamp(),
  };
  
  try {
    await updateDoc(processDocRef, dataToUpdate);
  } catch(error) {
    if (error instanceof FirestoreError && error.code === 'permission-denied') {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: `processes/${processId}`,
            operation: 'update',
            requestResourceData: dataToUpdate,
        }));
    }
    throw error;
  }
}

// DELETE
export function deleteProcess(processId: string): void {
  const { firestore, auth } = initializeFirebase();
  const processDocRef = doc(firestore, 'processes', processId);
  
  deleteDoc(processDocRef).catch(error => {
    if (error instanceof FirestoreError && error.code === 'permission-denied') {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: `processes/${processId}`,
            operation: 'delete',
        }));
    }
  });
}

    
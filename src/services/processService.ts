
import { auth, db } from '@/lib/firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, type DocumentData, query, orderBy, limit, getDoc, Timestamp, FirestoreError } from 'firebase/firestore';
import type { Process, ProcessFormValues, TimelineEvent } from '@/components/processes/ProcessFormDialog';
import { errorEmitter, FirestorePermissionError, SecurityRuleContext } from '@/lib/errors';

// Helper para remover chaves indefinidas de um objeto, agora de forma recursiva
const removeUndefinedKeys = (obj: any): any => {
  if (Array.isArray(obj)) {
    return obj.map(item => removeUndefinedKeys(item));
  }
  if (obj !== null && typeof obj === 'object') {
    const newObj: { [key: string]: any } = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
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
    status: data.status,
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
    throw error;
  }
}

// READ RECENT
export async function getRecentProcesses(count?: number): Promise<Process[]> {
    if (!db) throw new Error("Firebase DB not initialized");
    const processesCollectionRef = collection(db, 'processes');
    const q = count 
        ? query(processesCollectionRef, orderBy("createdAt", "desc"), limit(count))
        : query(processesCollectionRef, orderBy("createdAt", "desc"));

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(fromFirestore);
}


// CREATE
export async function addProcess(processData: Omit<Process, 'id' | 'createdAt'>): Promise<Process> {
  if (!db) throw new Error("Firebase DB not initialized");
  const processesCollectionRef = collection(db, 'processes');
  const cleanData = removeUndefinedKeys(processData);
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
export async function updateProcess(processId: string, processData: ProcessFormValues & { timeline?: TimelineEvent[] }): Promise<Process> {
  if (!db) throw new Error("Firebase DB not initialized");
  const processDocRef = doc(db, 'processes', processId);
  const cleanData = removeUndefinedKeys(processData);
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

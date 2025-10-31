
import { getDb } from '@/lib/firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, type DocumentData, query, orderBy, limit, getDoc, Timestamp } from 'firebase/firestore';
import type { Process, ProcessFormValues, TimelineEvent } from '@/components/processes/ProcessFormDialog';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors';

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
  const db = getDb();
  const processesCollectionRef = collection(db, 'processes');
  const q = query(processesCollectionRef, orderBy("createdAt", "desc"));
  const querySnapshot = await getDocs(q).catch(async (serverError) => {
    const permissionError = new FirestorePermissionError({
        path: 'processes',
        operation: 'list',
    } satisfies SecurityRuleContext);
    errorEmitter.emit('permission-error', permissionError);
    throw permissionError;
  });
  return querySnapshot.docs.map(fromFirestore);
}

// READ RECENT
export async function getRecentProcesses(count?: number): Promise<Process[]> {
    const db = getDb();
    const processesCollectionRef = collection(db, 'processes');
    const q = count 
        ? query(processesCollectionRef, orderBy("createdAt", "desc"), limit(count))
        : query(processesCollectionRef, orderBy("createdAt", "desc"));

    const querySnapshot = await getDocs(q).catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
            path: 'processes',
            operation: 'list',
        } satisfies SecurityRuleContext);
        errorEmitter.emit('permission-error', permissionError);
        throw permissionError;
    });
    return querySnapshot.docs.map(fromFirestore);
}


// CREATE
export async function addProcess(processData: Omit<Process, 'id' | 'createdAt'>): Promise<Process> {
  const db = getDb();
  const processesCollectionRef = collection(db, 'processes');
  const cleanData = removeUndefinedKeys(processData);
  const dataToSave = {
    ...cleanData,
    createdAt: serverTimestamp(),
  };
  const docRef = await addDoc(processesCollectionRef, dataToSave)
    .catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
            path: 'processes',
            operation: 'create',
            requestResourceData: dataToSave,
        } satisfies SecurityRuleContext);
        errorEmitter.emit('permission-error', permissionError);
        throw permissionError;
    });
  const snapshot = await getDoc(docRef);
  return fromFirestore(snapshot);
}

// UPDATE
export async function updateProcess(processId: string, processData: ProcessFormValues & { timeline?: TimelineEvent[] }): Promise<Process> {
  const db = getDb();
  const processDocRef = doc(db, 'processes', processId);
  const cleanData = removeUndefinedKeys(processData);
  const dataToUpdate = {
    ...cleanData,
    updatedAt: serverTimestamp(),
  };
  await updateDoc(processDocRef, dataToUpdate)
    .catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
            path: processDocRef.path,
            operation: 'update',
            requestResourceData: dataToUpdate,
        } satisfies SecurityRuleContext);
        errorEmitter.emit('permission-error', permissionError);
        throw permissionError;
    });

  const snapshot = await getDoc(processDocRef);
  return fromFirestore(snapshot);
}

// DELETE
export async function deleteProcess(processId: string): Promise<void> {
  const db = getDb();
  const processDocRef = doc(db, 'processes', processId);
  await deleteDoc(processDocRef)
    .catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
            path: processDocRef.path,
            operation: 'delete',
        } satisfies SecurityRuleContext);
        errorEmitter.emit('permission-error', permissionError);
        throw permissionError;
    });
}

    
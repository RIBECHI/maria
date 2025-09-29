
import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, type DocumentData, query, orderBy, limit, getDoc } from 'firebase/firestore';
import type { Process, ProcessFormValues, TimelineEvent } from '@/components/processes/ProcessFormDialog';

const processesCollectionRef = collection(db, 'processes');

// Helper para remover chaves indefinidas de um objeto
const removeUndefinedKeys = (obj: Record<string, any>) => {
  const newObj: Record<string, any> = {};
  Object.keys(obj).forEach(key => {
    if (obj[key] !== undefined) {
      newObj[key] = obj[key];
    }
  });
  return newObj;
};


// Helper para converter dados do Firestore
const fromFirestore = (docSnap: DocumentData): Process => {
  const data = docSnap.data();
  return {
    id: docSnap.id,
    ...data,
    timeline: (data.timeline || []).sort((a: TimelineEvent, b: TimelineEvent) => new Date(b.date).getTime() - new Date(a.date).getTime()),
  } as Process;
};

// READ ALL
export async function getProcesses(): Promise<Process[]> {
  const q = query(processesCollectionRef, orderBy("createdAt", "desc"));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(fromFirestore);
}

// READ RECENT
export async function getRecentProcesses(count?: number): Promise<Process[]> {
    const q = count 
        ? query(processesCollectionRef, orderBy("createdAt", "desc"), limit(count))
        : query(processesCollectionRef, orderBy("createdAt", "desc"));

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(fromFirestore);
}


// CREATE
export async function addProcess(processData: Omit<Process, 'id' | 'createdAt'>): Promise<Process> {
  const cleanData = removeUndefinedKeys(processData);
  const docRef = await addDoc(processesCollectionRef, {
    ...cleanData,
    createdAt: serverTimestamp(),
  });
  const snapshot = await getDoc(docRef);
  return fromFirestore(snapshot);
}

// UPDATE
export async function updateProcess(processId: string, processData: ProcessFormValues & { timeline?: TimelineEvent[] }): Promise<Process> {
  const processDocRef = doc(db, 'processes', processId);
  const cleanData = removeUndefinedKeys(processData);
  await updateDoc(processDocRef, {
    ...cleanData,
    updatedAt: serverTimestamp(),
  });

  const snapshot = await getDoc(processDocRef);
  return fromFirestore(snapshot);
}

// DELETE
export async function deleteProcess(processId: string): Promise<void> {
  const processDocRef = doc(db, 'processes', processId);
  await deleteDoc(processDocRef);
}

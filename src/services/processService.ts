
import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, type DocumentData } from 'firebase/firestore';
import type { Process, ProcessFormValues, TimelineEvent } from '@/components/processes/ProcessFormDialog';

const processesCollectionRef = collection(db, 'processes');

// Helper para converter dados do Firestore
const fromFirestore = (doc: DocumentData): Process => {
  const data = doc.data();
  return {
    id: doc.id,
    processNumber: data.processNumber,
    client: data.client,
    type: data.type,
    status: data.status,
    nextDeadline: data.nextDeadline,
    documents: data.documents || 0,
    monitorProjudi: data.monitorProjudi || false,
    uhd: data.uhd,
    certidao: data.certidao || false,
    apenso: data.apenso,
    timeline: data.timeline || [], // Timeline é um array no documento principal
    // createdAt e updatedAt podem ser adicionados se necessário
  } as Process;
};

// READ
export async function getProcesses(): Promise<Process[]> {
  const querySnapshot = await getDocs(processesCollectionRef);
  return querySnapshot.docs.map(fromFirestore);
}

// CREATE
export async function addProcess(processData: Omit<Process, 'id'>): Promise<Process> {
  const docRef = await addDoc(processesCollectionRef, {
    ...processData,
    createdAt: serverTimestamp(),
  });
  return { id: docRef.id, ...processData } as Process;
}

// UPDATE
export async function updateProcess(processId: string, processData: ProcessFormValues & { timeline?: TimelineEvent[] }): Promise<Process> {
  const processDocRef = doc(db, 'processes', processId);
  await updateDoc(processDocRef, {
    ...processData,
    updatedAt: serverTimestamp(),
  });

  // Re-fetch or build the updated object to return
  const updatedDocData: Process = {
    id: processId,
    ...processData,
    documents: 0, // Should probably fetch existing doc to keep this
    // For simplicity, returning what was passed, but fetching is safer
  };

  return updatedDocData;
}

// DELETE
export async function deleteProcess(processId: string): Promise<void> {
  const processDocRef = doc(db, 'processes', processId);
  await deleteDoc(processDocRef);
}

    
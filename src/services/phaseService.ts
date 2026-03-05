
import { initializeFirebase } from '@/firebase';
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  query,
  orderBy,
  getDoc,
  type DocumentData,
  FirestoreError,
  writeBatch,
} from 'firebase/firestore';
import { errorEmitter, FirestorePermissionError } from '@/firebase';

export interface Phase extends DocumentData {
  id: string;
  name: string;
  order: number;
  createdAt: string;
}

const fromFirestore = (docSnap: DocumentData): Phase => {
  const data = docSnap.data();
  return {
    id: docSnap.id,
    name: data.name,
    order: data.order,
    createdAt: data.createdAt?.toDate().toISOString(),
  };
};

const PHASES_COLLECTION = 'documentPhases';

// READ
export async function getPhases(): Promise<Phase[]> {
  const { firestore, auth } = initializeFirebase();
  const phasesCollectionRef = collection(firestore, PHASES_COLLECTION);
  const q = query(phasesCollectionRef, orderBy('order', 'asc'));
  try {
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) {
        const defaultPhases = [
            { name: "Análise Inicial", order: 1 },
            { name: "Aguardando Documentos", order: 2 },
            { name: "Em Elaboração", order: 3 },
            { name: "Protocolado", order: 4 },
            { name: "Concluído", order: 5 },
        ];
        const addedPhases: Phase[] = [];
        const batch = writeBatch(firestore);
        
        for (const phase of defaultPhases) {
             const docRef = doc(collection(firestore, PHASES_COLLECTION));
             batch.set(docRef, { ...phase, createdAt: serverTimestamp() });
             addedPhases.push({ ...phase, id: docRef.id, createdAt: new Date().toISOString() });
        }
        await batch.commit().catch(error => {
            if (error instanceof FirestoreError && error.code === 'permission-denied') {
                errorEmitter.emit('permission-error', new FirestorePermissionError({
                    path: PHASES_COLLECTION,
                    operation: 'create',
                }));
            }
        });
        
        return addedPhases.sort((a,b) => a.order - b.order);
    }
    return querySnapshot.docs.map(fromFirestore);
  } catch (error) {
    if (error instanceof FirestoreError && error.code === 'permission-denied') {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: PHASES_COLLECTION,
        operation: 'list',
      }));
    }
    // Return empty on error to avoid crash
    return [];
  }
}

// CREATE
export async function addPhase(phaseData: Partial<Omit<Phase, 'id' | 'createdAt'>>): Promise<void> {
  const { firestore, auth } = initializeFirebase();
  const phasesCollectionRef = collection(firestore, PHASES_COLLECTION);
  const dataToSave = {
    ...phaseData,
    createdAt: serverTimestamp(),
  };
  addDoc(phasesCollectionRef, dataToSave).catch(error => {
    if (error instanceof FirestoreError && error.code === 'permission-denied') {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: PHASES_COLLECTION,
        operation: 'create',
        requestResourceData: dataToSave,
      }));
    }
  });
}

// UPDATE
export async function updatePhase(phaseId: string, phaseData: Partial<Omit<Phase, 'id' | 'createdAt'>>): Promise<void> {
  const { firestore, auth } = initializeFirebase();
  const phaseDocRef = doc(firestore, PHASES_COLLECTION, phaseId);
  const dataToUpdate = { ...phaseData, updatedAt: serverTimestamp() };
  updateDoc(phaseDocRef, dataToUpdate).catch(error => {
    if (error instanceof FirestoreError && error.code === 'permission-denied') {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: `${PHASES_COLLECTION}/${phaseId}`,
        operation: 'update',
        requestResourceData: dataToUpdate,
      }));
    }
  });
}

// DELETE
export async function deletePhase(phaseId: string): Promise<void> {
  const { firestore, auth } = initializeFirebase();
  const phaseDocRef = doc(firestore, PHASES_COLLECTION, phaseId);
  deleteDoc(phaseDocRef).catch(error => {
    if (error instanceof FirestoreError && error.code === 'permission-denied') {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: `${PHASES_COLLECTION}/${phaseId}`,
        operation: 'delete',
      }));
    }
  });
}

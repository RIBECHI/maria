
import { auth, db } from '@/lib/firebase';
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
import { errorEmitter, FirestorePermissionError, type SecurityRuleContext } from '@/lib/errors';

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
  if (!db) throw new Error('Firebase DB not initialized');
  const phasesCollectionRef = collection(db, PHASES_COLLECTION);
  const q = query(phasesCollectionRef, orderBy('order', 'asc'));
  try {
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) {
        // Se estiver vazio, crie as fases padrão
        const defaultPhases = [
            { name: "Análise Inicial", order: 1 },
            { name: "Aguardando Documentos", order: 2 },
            { name: "Em Elaboração", order: 3 },
            { name: "Protocolado", order: 4 },
            { name: "Concluído", order: 5 },
        ];
        const addedPhases: Phase[] = [];
        const batch = writeBatch(db);
        
        for (const phase of defaultPhases) {
             const docRef = doc(collection(db, PHASES_COLLECTION));
             batch.set(docRef, { ...phase, createdAt: serverTimestamp() });
             addedPhases.push({ ...phase, id: docRef.id, createdAt: new Date().toISOString() });
        }
        await batch.commit();
        
        return addedPhases.sort((a,b) => a.order - b.order);
    }
    return querySnapshot.docs.map(fromFirestore);
  } catch (error) {
    if (error instanceof FirestoreError && error.code === 'permission-denied') {
      const context: SecurityRuleContext = {
        path: PHASES_COLLECTION,
        operation: 'list',
        auth: auth.currentUser ? { uid: auth.currentUser.uid } : null,
      };
      errorEmitter.emit('permission-error', new FirestorePermissionError(context));
    }
    throw error;
  }
}

// CREATE
export async function addPhase(phaseData: Partial<Omit<Phase, 'id' | 'createdAt'>>): Promise<Phase> {
  if (!db) throw new Error('Firebase DB not initialized');
  const phasesCollectionRef = collection(db, PHASES_COLLECTION);
  const dataToSave = {
    ...phaseData,
    createdAt: serverTimestamp(),
  };
  try {
    const docRef = await addDoc(phasesCollectionRef, dataToSave);
    const snapshot = await getDoc(docRef);
    return fromFirestore(snapshot);
  } catch (error) {
    if (error instanceof FirestoreError && error.code === 'permission-denied') {
      const context: SecurityRuleContext = {
        path: PHASES_COLLECTION,
        operation: 'create',
        auth: auth.currentUser ? { uid: auth.currentUser.uid } : null,
        resource: dataToSave,
      };
      errorEmitter.emit('permission-error', new FirestorePermissionError(context));
    }
    throw error;
  }
}

// UPDATE
export async function updatePhase(phaseId: string, phaseData: Partial<Omit<Phase, 'id' | 'createdAt'>>): Promise<Phase> {
  if (!db) throw new Error('Firebase DB not initialized');
  const phaseDocRef = doc(db, PHASES_COLLECTION, phaseId);
  try {
    await updateDoc(phaseDocRef, { ...phaseData, updatedAt: serverTimestamp() });
    const snapshot = await getDoc(phaseDocRef);
    return fromFirestore(snapshot);
  } catch (error) {
    if (error instanceof FirestoreError && error.code === 'permission-denied') {
      const context: SecurityRuleContext = {
        path: `${PHASES_COLLECTION}/${phaseId}`,
        operation: 'update',
        auth: auth.currentUser ? { uid: auth.currentUser.uid } : null,
        resource: phaseData,
      };
      errorEmitter.emit('permission-error', new FirestorePermissionError(context));
    }
    throw error;
  }
}

// DELETE
export async function deletePhase(phaseId: string): Promise<void> {
  if (!db) throw new Error('Firebase DB not initialized');
  const phaseDocRef = doc(db, PHASES_COLLECTION, phaseId);
  try {
    await deleteDoc(phaseDocRef);
  } catch (error) {
    if (error instanceof FirestoreError && error.code === 'permission-denied') {
      const context: SecurityRuleContext = {
        path: `${PHASES_COLLECTION}/${phaseId}`,
        operation: 'delete',
        auth: auth.currentUser ? { uid: auth.currentUser.uid } : null,
      };
      errorEmitter.emit('permission-error', new FirestorePermissionError(context));
    }
    throw error;
  }
}

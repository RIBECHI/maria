
import { initializeFirebase } from '@/firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, query, orderBy, getDoc, type DocumentData, FirestoreError } from 'firebase/firestore';
import { errorEmitter, FirestorePermissionError } from '@/firebase';


export interface DocumentTemplate extends DocumentData {
  id: string;
  name: string;
  content: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface TemplateFormValues {
    name: string;
    content: string;
}

const fromFirestore = (docSnap: DocumentData): DocumentTemplate => {
  const data = docSnap.data();
  return {
    id: docSnap.id,
    name: data.name,
    content: data.content,
    createdAt: data.createdAt?.toDate().toISOString(),
    updatedAt: data.updatedAt?.toDate().toISOString(),
  };
};

// READ
export function getTemplates(): Promise<DocumentTemplate[]> {
  const { firestore, auth } = initializeFirebase();
  const templatesCollectionRef = collection(firestore, 'documentTemplates');
  const q = query(templatesCollectionRef, orderBy("name", "asc"));
  
  return getDocs(q)
    .then(querySnapshot => querySnapshot.docs.map(fromFirestore))
    .catch(error => {
      if (error instanceof FirestoreError && error.code === 'permission-denied') {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: 'documentTemplates',
          operation: 'list',
        }));
      }
      return [];
  });
}

// CREATE
export async function addTemplate(templateData: TemplateFormValues): Promise<void> {
    const { firestore, auth } = initializeFirebase();
    const templatesCollectionRef = collection(firestore, 'documentTemplates');
    const dataToSave = {
        ...templateData,
        createdAt: serverTimestamp(),
    };

    try {
      await addDoc(templatesCollectionRef, dataToSave);
    } catch (error) {
      if (error instanceof FirestoreError && error.code === 'permission-denied') {
          errorEmitter.emit('permission-error', new FirestorePermissionError({
              path: 'documentTemplates',
              operation: 'create',
              requestResourceData: dataToSave,
          }));
      }
      throw error;
    }
}

// UPDATE
export async function updateTemplate(templateId: string, templateData: TemplateFormValues): Promise<void> {
    const { firestore, auth } = initializeFirebase();
    const templateDocRef = doc(firestore, 'documentTemplates', templateId);
    const dataToUpdate = {
        ...templateData,
        updatedAt: serverTimestamp(),
    };

    try {
      await updateDoc(templateDocRef, dataToUpdate);
    } catch (error) {
      if (error instanceof FirestoreError && error.code === 'permission-denied') {
          errorEmitter.emit('permission-error', new FirestorePermissionError({
              path: `documentTemplates/${templateId}`,
              operation: 'update',
              requestResourceData: dataToUpdate,
          }));
      }
      throw error;
    }
}

// DELETE
export async function deleteTemplate(templateId: string): Promise<void> {
    const { firestore, auth } = initializeFirebase();
    const templateDocRef = doc(firestore, 'documentTemplates', templateId);
    
    try {
      await deleteDoc(templateDocRef);
    } catch (error) {
      if (error instanceof FirestoreError && error.code === 'permission-denied') {
          errorEmitter.emit('permission-error', new FirestorePermissionError({
              path: `documentTemplates/${templateId}`,
              operation: 'delete',
          }));
      }
      throw error;
    }
}

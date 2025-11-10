
import { auth, db } from '@/lib/firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, query, orderBy, getDoc, type DocumentData, FirestoreError } from 'firebase/firestore';
import { errorEmitter, FirestorePermissionError, SecurityRuleContext } from '@/lib/errors';


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
export async function getTemplates(): Promise<DocumentTemplate[]> {
  if (!db) throw new Error("Firebase DB not initialized");
  const templatesCollectionRef = collection(db, 'documentTemplates');
  const q = query(templatesCollectionRef, orderBy("name", "asc"));
  try {
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(fromFirestore);
  } catch (error) {
    if (error instanceof FirestoreError && error.code === 'permission-denied') {
      const context: SecurityRuleContext = {
        path: 'documentTemplates',
        operation: 'list',
        auth: auth.currentUser ? { uid: auth.currentUser.uid } : null,
      };
      errorEmitter.emit('permission-error', new FirestorePermissionError(context));
    }
    throw error;
  }
}

// CREATE
export async function addTemplate(templateData: TemplateFormValues): Promise<DocumentTemplate> {
    if (!db) throw new Error("Firebase DB not initialized");
    const templatesCollectionRef = collection(db, 'documentTemplates');
    try {
        const docRef = await addDoc(templatesCollectionRef, {
            ...templateData,
            createdAt: serverTimestamp(),
        });
        const snapshot = await getDoc(docRef);
        return fromFirestore(snapshot);
    } catch (error) {
        if (error instanceof FirestoreError && error.code === 'permission-denied') {
            const context: SecurityRuleContext = {
                path: 'documentTemplates',
                operation: 'create',
                auth: auth.currentUser ? { uid: auth.currentUser.uid } : null,
                resource: templateData,
            };
            errorEmitter.emit('permission-error', new FirestorePermissionError(context));
        }
        throw error;
    }
}

// UPDATE
export async function updateTemplate(templateId: string, templateData: TemplateFormValues): Promise<DocumentTemplate> {
    if (!db) throw new Error("Firebase DB not initialized");
    const templateDocRef = doc(db, 'documentTemplates', templateId);
    try {
        await updateDoc(templateDocRef, {
            ...templateData,
            updatedAt: serverTimestamp(),
        });
        const snapshot = await getDoc(templateDocRef);
        return fromFirestore(snapshot);
    } catch (error) {
        if (error instanceof FirestoreError && error.code === 'permission-denied') {
            const context: SecurityRuleContext = {
                path: `documentTemplates/${templateId}`,
                operation: 'update',
                auth: auth.currentUser ? { uid: auth.currentUser.uid } : null,
                resource: templateData,
            };
            errorEmitter.emit('permission-error', new FirestorePermissionError(context));
        }
        throw error;
    }
}

// DELETE
export async function deleteTemplate(templateId: string): Promise<void> {
    if (!db) throw new Error("Firebase DB not initialized");
    const templateDocRef = doc(db, 'documentTemplates', templateId);
    try {
        await deleteDoc(templateDocRef);
    } catch (error) {
        if (error instanceof FirestoreError && error.code === 'permission-denied') {
            const context: SecurityRuleContext = {
                path: `documentTemplates/${templateId}`,
                operation: 'delete',
                auth: auth.currentUser ? { uid: auth.currentUser.uid } : null,
            };
            errorEmitter.emit('permission-error', new FirestorePermissionError(context));
        }
        throw error;
    }
}


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
export function getTemplates(): Promise<DocumentTemplate[]> {
  if (!db) throw new Error("Firebase DB not initialized");
  const templatesCollectionRef = collection(db, 'documentTemplates');
  const q = query(templatesCollectionRef, orderBy("name", "asc"));
  
  return getDocs(q)
    .then(querySnapshot => querySnapshot.docs.map(fromFirestore))
    .catch(error => {
      if (error instanceof FirestoreError && error.code === 'permission-denied') {
        const context: SecurityRuleContext = {
          path: 'documentTemplates',
          operation: 'list',
          auth: auth.currentUser ? { uid: auth.currentUser.uid } : null,
        };
        errorEmitter.emit('permission-error', new FirestorePermissionError(context));
      }
      return [];
  });
}

// CREATE
export function addTemplate(templateData: TemplateFormValues): void {
    if (!db) throw new Error("Firebase DB not initialized");
    const templatesCollectionRef = collection(db, 'documentTemplates');
    const dataToSave = {
        ...templateData,
        createdAt: serverTimestamp(),
    };

    addDoc(templatesCollectionRef, dataToSave)
      .catch(error => {
        if (error instanceof FirestoreError && error.code === 'permission-denied') {
            const context: SecurityRuleContext = {
                path: 'documentTemplates',
                operation: 'create',
                auth: auth.currentUser ? { uid: auth.currentUser.uid } : null,
                resource: dataToSave,
            };
            errorEmitter.emit('permission-error', new FirestorePermissionError(context));
        }
    });
}

// UPDATE
export function updateTemplate(templateId: string, templateData: TemplateFormValues): void {
    if (!db) throw new Error("Firebase DB not initialized");
    const templateDocRef = doc(db, 'documentTemplates', templateId);
    const dataToUpdate = {
        ...templateData,
        updatedAt: serverTimestamp(),
    };

    updateDoc(templateDocRef, dataToUpdate)
      .catch(error => {
        if (error instanceof FirestoreError && error.code === 'permission-denied') {
            const context: SecurityRuleContext = {
                path: `documentTemplates/${templateId}`,
                operation: 'update',
                auth: auth.currentUser ? { uid: auth.currentUser.uid } : null,
                resource: dataToUpdate,
            };
            errorEmitter.emit('permission-error', new FirestorePermissionError(context));
        }
    });
}

// DELETE
export function deleteTemplate(templateId: string): void {
    if (!db) throw new Error("Firebase DB not initialized");
    const templateDocRef = doc(db, 'documentTemplates', templateId);
    
    deleteDoc(templateDocRef).catch(error => {
        if (error instanceof FirestoreError && error.code === 'permission-denied') {
            const context: SecurityRuleContext = {
                path: `documentTemplates/${templateId}`,
                operation: 'delete',
                auth: auth.currentUser ? { uid: auth.currentUser.uid } : null,
            };
            errorEmitter.emit('permission-error', new FirestorePermissionError(context));
        }
    });
}

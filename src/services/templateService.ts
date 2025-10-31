
import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, query, orderBy, getDoc, type DocumentData } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors';

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

const templatesCollectionRef = collection(db, 'documentTemplates');

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
  const q = query(templatesCollectionRef, orderBy("name", "asc"));
  const querySnapshot = await getDocs(q).catch(async (serverError) => {
    const permissionError = new FirestorePermissionError({
        path: templatesCollectionRef.path,
        operation: 'list',
    } satisfies SecurityRuleContext);
    errorEmitter.emit('permission-error', permissionError);
    throw permissionError;
  });
  return querySnapshot.docs.map(fromFirestore);
}

// CREATE
export async function addTemplate(templateData: TemplateFormValues): Promise<DocumentTemplate> {
    const dataToSave = {
        ...templateData,
        createdAt: serverTimestamp(),
    };
    const docRef = await addDoc(templatesCollectionRef, dataToSave)
        .catch(async (serverError) => {
            const permissionError = new FirestorePermissionError({
                path: templatesCollectionRef.path,
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
export async function updateTemplate(templateId: string, templateData: TemplateFormValues): Promise<DocumentTemplate> {
    const templateDocRef = doc(db, 'documentTemplates', templateId);
    const dataToUpdate = {
        ...templateData,
        updatedAt: serverTimestamp(),
    };
    await updateDoc(templateDocRef, dataToUpdate)
        .catch(async (serverError) => {
            const permissionError = new FirestorePermissionError({
                path: templateDocRef.path,
                operation: 'update',
                requestResourceData: dataToUpdate,
            } satisfies SecurityRuleContext);
            errorEmitter.emit('permission-error', permissionError);
            throw permissionError;
        });
    const snapshot = await getDoc(templateDocRef);
    return fromFirestore(snapshot);
}

// DELETE
export async function deleteTemplate(templateId: string): Promise<void> {
    const templateDocRef = doc(db, 'documentTemplates', templateId);
    deleteDoc(templateDocRef)
        .catch(async (serverError) => {
            const permissionError = new FirestorePermissionError({
                path: templateDocRef.path,
                operation: 'delete',
            } satisfies SecurityRuleContext);
            errorEmitter.emit('permission-error', permissionError);
            throw permissionError;
        });
}

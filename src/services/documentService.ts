
import { db, storage } from '@/lib/firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, getDoc, query, orderBy } from 'firebase/firestore';
import type { Document } from '@/components/documents/DocumentFormDialog';
import type { DocumentData } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors';

const getDocumentsCollectionRef = () => collection(db, 'documents');

const fromFirestore = (docSnap: DocumentData): Document => {
  const data = docSnap.data();
  const document: Document = {
    id: docSnap.id,
    name: data.name,
    process: data.process,
    tags: data.tags || [],
    uploadDate: data.uploadDate,
    filePath: data.filePath,
    fileUrl: data.fileUrl || '', 
  };
   if (data.createdAt) {
      document.createdAt = data.createdAt.toDate().toISOString();
  }
  return document;
};

// READ
export async function getDocuments(): Promise<Document[]> {
  const documentsCollectionRef = getDocumentsCollectionRef();
  const q = query(documentsCollectionRef, orderBy("createdAt", "desc"));
  const querySnapshot = await getDocs(q).catch(async (serverError) => {
    const permissionError = new FirestorePermissionError({
        path: documentsCollectionRef.path,
        operation: 'list',
    } satisfies SecurityRuleContext);
    errorEmitter.emit('permission-error', permissionError);
    throw permissionError;
  });
  return querySnapshot.docs.map(fromFirestore);
}

// CREATE
export async function addDocument(docData: { process: string; tagsString?: string | undefined; name: string; }, filePath: string): Promise<Document> {
  const documentsCollectionRef = getDocumentsCollectionRef();
  const tags = docData.tagsString ? docData.tagsString.split(',').map(t => t.trim()).filter(Boolean) : [];
  
  const dataToSave = {
    name: docData.name,
    process: docData.process,
    tags: tags,
    uploadDate: new Date().toISOString().split('T')[0],
    createdAt: serverTimestamp(),
    filePath: filePath,
  };

  const docRef = await addDoc(documentsCollectionRef, dataToSave)
    .catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
            path: documentsCollectionRef.path,
            operation: 'create',
            requestResourceData: dataToSave,
        } satisfies SecurityRuleContext);
        errorEmitter.emit('permission-error', permissionError);
        throw permissionError;
    });

  const snapshot = await getDoc(docRef);
  return fromFirestore(snapshot);
}

// UPDATE (metadata only)
export async function updateDocument(documentId: string, docData: { process: string, tags: string[] }): Promise<Document> {
  const docRef = doc(db, 'documents', documentId);
  const dataToUpdate = {
    process: docData.process,
    tags: docData.tags,
    updatedAt: serverTimestamp(),
  };

  await updateDoc(docRef, dataToUpdate)
    .catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
            path: docRef.path,
            operation: 'update',
            requestResourceData: dataToUpdate,
        } satisfies SecurityRuleContext);
        errorEmitter.emit('permission-error', permissionError);
        throw permissionError;
    });
  
  const snapshot = await getDoc(docRef);
  return fromFirestore(snapshot);
}

// DELETE
export async function deleteDocument(document: Document): Promise<void> {
  const docRef = doc(db, 'documents', document.id);
  deleteDoc(docRef)
    .catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
            path: docRef.path,
            operation: 'delete',
        } satisfies SecurityRuleContext);
        errorEmitter.emit('permission-error', permissionError);
        throw permissionError;
    });
}

// DOWNLOAD URL GETTER
export async function getDownloadUrl(filePath: string): Promise<string> {
    const bucketName = "lexmanager.appspot.com";
    const encodedFilePath = encodeURIComponent(filePath);
    // Usa o proxy para obter a URL de download
    return `/v0/b/${bucketName}/o/${encodedFilePath}?alt=media`;
}

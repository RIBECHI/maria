
import { initializeFirebase } from '@/firebase';
import { collection, getDocs, updateDoc, deleteDoc, doc, serverTimestamp, getDoc, query, orderBy, FirestoreError, where } from 'firebase/firestore';
import { ref, getDownloadURL, deleteObject } from "firebase/storage";
import type { Document, DocumentFormValues } from '@/components/documents/DocumentFormDialog';
import type { DocumentData } from 'firebase/firestore';
import { errorEmitter, FirestorePermissionError } from '@/firebase';


const fromFirestore = (docSnap: DocumentData): Document => {
  const data = docSnap.data();
  const document: Document = {
    id: docSnap.id,
    name: data.name,
    process: data.process,
    tags: data.tags || [],
    uploadDate: data.uploadDate,
    fileUrl: data.fileUrl,
    filePath: data.filePath,
    ownerId: data.ownerId,
  };
   if (data.createdAt) {
      document.createdAt = data.createdAt.toDate().toISOString();
  }
  return document;
};

// READ
export function getDocuments(): Promise<Document[]> {
  const { firestore, auth } = initializeFirebase();
  
  const user = auth.currentUser;
  if (!user) {
    // If no user, return no documents.
    return Promise.resolve([]);
  }

  const documentsCollectionRef = collection(firestore, 'documents');
  // Filter documents by the current user's ID
  const q = query(documentsCollectionRef, where("ownerId", "==", user.uid), orderBy("createdAt", "desc"));
  
  return getDocs(q)
    .then(querySnapshot => querySnapshot.docs.map(fromFirestore))
    .catch (error => {
      if (error instanceof FirestoreError && error.code === 'permission-denied') {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: 'documents',
          operation: 'list',
        }));
      }
      return [];
  });
}

// UPDATE (metadata only)
export async function updateDocument(documentId: string, docData: DocumentFormValues & { name: string }): Promise<void> {
  const { firestore } = initializeFirebase();
  const docRef = doc(firestore, 'documents', documentId);
  
  const dataToUpdate = {
      process: docData.process,
      tags: docData.tagsString ? docData.tagsString.split(',').map(t => t.trim()).filter(t => t) : [],
      updatedAt: serverTimestamp(),
  };

  try {
    await updateDoc(docRef, dataToUpdate);
  }
  catch(error) {
     if (error instanceof FirestoreError && error.code === 'permission-denied') {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: `documents/${documentId}`,
        operation: 'update',
        requestResourceData: dataToUpdate,
      }));
      throw new Error("Você não tem permissão para atualizar este documento.");
    }
    throw new Error("Ocorreu um erro desconhecido ao atualizar.");
  }
}

// DELETE
export async function deleteDocument(document: Document): Promise<void> {
  const { firestore, storage, auth } = initializeFirebase();
  const user = auth.currentUser;
  if (!user) throw new Error("Usuário não autenticado.");

  // For security, ideally we check ownership before deleting
  if (document.ownerId && document.ownerId !== user.uid) {
    throw new Error("Você não tem permissão para excluir este arquivo.");
  }

  if (document.filePath) {
      const fileRef = ref(storage, document.filePath);
      await deleteObject(fileRef).catch(error => {
          if (error.code !== 'storage/object-not-found') {
              console.error("Error deleting file from storage:", error);
              throw error; 
          }
      });
  }

  const docRef = doc(firestore, 'documents', document.id);
  try {
    await deleteDoc(docRef);
  } catch(error) {
    if (error instanceof FirestoreError && error.code === 'permission-denied') {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: `documents/${document.id}`,
        operation: 'delete',
      }));
    }
    throw error;
  }
}

// DOWNLOAD URL GETTER
export async function getDownloadUrl(filePath: string): Promise<string> {
    const { storage } = initializeFirebase();
    const fileRef = ref(storage, filePath);
    const url = await getDownloadURL(fileRef);
    return url;
}

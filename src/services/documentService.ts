
import { auth, db, storage } from '@/lib/firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, getDoc, query, orderBy, FirestoreError, where } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import type { Document, DocumentFormValues } from '@/components/documents/DocumentFormDialog';
import type { DocumentData } from 'firebase/firestore';
import { errorEmitter, FirestorePermissionError, SecurityRuleContext } from '@/lib/errors';


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
  if (!db) throw new Error("Firebase DB not initialized");
  
  const user = auth.currentUser;
  if (!user) {
    // If no user, return no documents.
    return Promise.resolve([]);
  }

  const documentsCollectionRef = collection(db, 'documents');
  // Filter documents by the current user's ID
  const q = query(documentsCollectionRef, where("ownerId", "==", user.uid), orderBy("createdAt", "desc"));
  
  return getDocs(q)
    .then(querySnapshot => querySnapshot.docs.map(fromFirestore))
    .catch (error => {
      if (error instanceof FirestoreError && error.code === 'permission-denied') {
        const context: SecurityRuleContext = {
          path: 'documents',
          operation: 'list',
          auth: auth.currentUser ? { uid: auth.currentUser.uid } : null,
        };
        errorEmitter.emit('permission-error', new FirestorePermissionError(context));
      }
      return [];
  });
}

// CREATE (metadata only)
export async function addDocument(docData: Omit<Document, 'id' | 'createdAt'>): Promise<void> {
  if (!db) throw new Error("Firebase DB not initialized");

  const user = auth.currentUser;
  if (!user) {
    throw new Error("Usuário não autenticado.");
  }
  
  const dataToSave = { 
    ...docData,
    createdAt: serverTimestamp(),
  };

  try {
    await addDoc(collection(db, 'documents'), dataToSave);
  } catch (error) {
     if (error instanceof FirestoreError && error.code === 'permission-denied') {
      const context: SecurityRuleContext = {
        path: 'documents',
        operation: 'create',
        auth: user ? { uid: user.uid } : null,
        resource: dataToSave,
      };
      errorEmitter.emit('permission-error', new FirestorePermissionError(context));
     }
     // Re-throw the error so the calling function can catch it.
     throw error;
  }
}

// UPDATE (metadata only)
export async function updateDocument(documentId: string, docData: DocumentFormValues & { name: string }): Promise<void> {
  if (!db) throw new Error("Firebase DB not initialized");
  const docRef = doc(db, 'documents', documentId);
  
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
      const context: SecurityRuleContext = {
        path: `documents/${documentId}`,
        operation: 'update',
        auth: auth.currentUser ? { uid: auth.currentUser.uid } : null,
        resource: dataToUpdate,
      };
      errorEmitter.emit('permission-error', new FirestorePermissionError(context));
    }
    throw error;
  }
}

// DELETE
export async function deleteDocument(document: Document): Promise<void> {
  if (!db || !storage) throw new Error("Firebase not initialized");

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

  const docRef = doc(db, 'documents', document.id);
  try {
    await deleteDoc(docRef);
  } catch(error) {
    if (error instanceof FirestoreError && error.code === 'permission-denied') {
      const context: SecurityRuleContext = {
        path: `documents/${document.id}`,
        operation: 'delete',
        auth: auth.currentUser ? { uid: auth.currentUser.uid } : null,
      };
      errorEmitter.emit('permission-error', new FirestorePermissionError(context));
    }
    throw error;
  }
}

// DOWNLOAD URL GETTER
export async function getDownloadUrl(filePath: string): Promise<string> {
    if (!storage) throw new Error("Firebase Storage not initialized");
    const fileRef = ref(storage, filePath);
    const url = await getDownloadURL(fileRef);
    return url;
}

    
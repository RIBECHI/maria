
import { auth, db, storage } from '@/lib/firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, getDoc, query, orderBy, FirestoreError } from 'firebase/firestore';
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
  };
   if (data.createdAt) {
      document.createdAt = data.createdAt.toDate().toISOString();
  }
  return document;
};

// READ
export function getDocuments(): Promise<Document[]> {
  if (!db) throw new Error("Firebase DB not initialized");
  const documentsCollectionRef = collection(db, 'documents');
  const q = query(documentsCollectionRef, orderBy("createdAt", "desc"));
  
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

// CREATE
export async function addDocument(docData: DocumentFormValues & { name: string }, file: File): Promise<void> {
  if (!db || !storage) throw new Error("Firebase not initialized");
  if (!file) throw new Error("File is required for upload.");

  const filePath = `documents/${Date.now()}-${file.name}`;
  const storageRef = ref(storage, filePath);
  
  // Storage operations can also have security rules, but we focus on Firestore for this pattern.
  await uploadBytes(storageRef, file);
  const fileUrl = await getDownloadURL(storageRef);

  const dataToSave = {
    name: docData.name,
    process: docData.process,
    tags: docData.tagsString ? docData.tagsString.split(',').map(t => t.trim()).filter(t => t) : [],
    uploadDate: new Date().toISOString().split('T')[0],
    createdAt: serverTimestamp(),
    fileUrl: fileUrl,
    filePath: filePath,
  };

  addDoc(collection(db, 'documents'), dataToSave)
    .catch(error => {
     if (error instanceof FirestoreError && error.code === 'permission-denied') {
      const context: SecurityRuleContext = {
        path: 'documents',
        operation: 'create',
        auth: auth.currentUser ? { uid: auth.currentUser.uid } : null,
        resource: dataToSave,
      };
      errorEmitter.emit('permission-error', new FirestorePermissionError(context));
    }
  });
}

// UPDATE (metadata only)
export function updateDocument(documentId: string, docData: DocumentFormValues & { name: string }): void {
  if (!db) throw new Error("Firebase DB not initialized");
  const docRef = doc(db, 'documents', documentId);
  
  const dataToUpdate = {
      process: docData.process,
      tags: docData.tagsString ? docData.tagsString.split(',').map(t => t.trim()).filter(t => t) : [],
      updatedAt: serverTimestamp(),
  };

  updateDoc(docRef, dataToUpdate)
    .catch(error => {
     if (error instanceof FirestoreError && error.code === 'permission-denied') {
      const context: SecurityRuleContext = {
        path: `documents/${documentId}`,
        operation: 'update',
        auth: auth.currentUser ? { uid: auth.currentUser.uid } : null,
        resource: dataToUpdate,
      };
      errorEmitter.emit('permission-error', new FirestorePermissionError(context));
    }
  });
}

// DELETE
export async function deleteDocument(document: Document): Promise<void> {
  if (!db || !storage) throw new Error("Firebase not initialized");

  if (document.filePath) {
      const fileRef = ref(storage, document.filePath);
      await deleteObject(fileRef).catch(error => {
          if (error.code !== 'storage/object-not-found') {
              console.error("Error deleting file from storage:", error);
          }
      });
  }

  const docRef = doc(db, 'documents', document.id);
  deleteDoc(docRef).catch(error => {
    if (error instanceof FirestoreError && error.code === 'permission-denied') {
      const context: SecurityRuleContext = {
        path: `documents/${document.id}`,
        operation: 'delete',
        auth: auth.currentUser ? { uid: auth.currentUser.uid } : null,
      };
      errorEmitter.emit('permission-error', new FirestorePermissionError(context));
    }
  });
}

// DOWNLOAD URL GETTER
export async function getDownloadUrl(filePath: string): Promise<string> {
    if (!storage) throw new Error("Firebase Storage not initialized");
    const fileRef = ref(storage, filePath);
    const url = await getDownloadURL(fileRef);
    return url;
}

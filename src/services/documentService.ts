
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

// CREATE (handles both upload and metadata)
export async function addDocument(docData: DocumentFormValues, file: File): Promise<void> {
  if (!db || !storage) throw new Error("Firebase não foi inicializado corretamente.");
  const user = auth.currentUser;
  if (!user) {
    throw new Error("Usuário não autenticado. Por favor, faça o login novamente.");
  }

  // 1. Upload file to Storage
  const filePath = `documents/${user.uid}/${Date.now()}-${file.name}`;
  const storageRef = ref(storage, filePath);
  let fileUrl = '';
  try {
    await uploadBytes(storageRef, file);
    fileUrl = await getDownloadURL(storageRef);
  } catch (storageError) {
    console.error("Erro no upload para o Firebase Storage:", storageError);
    throw new Error(`Falha no upload do arquivo: ${(storageError as Error).message}`);
  }
  
  // 2. Create document metadata in Firestore
  const dataToSave = {
    name: file.name,
    process: docData.process,
    tags: docData.tagsString ? docData.tagsString.split(',').map(t => t.trim()).filter(t => t) : [],
    uploadDate: new Date().toISOString().split('T')[0],
    fileUrl: fileUrl,
    filePath: filePath,
    ownerId: user.uid,
    createdAt: serverTimestamp(),
  };

  try {
    await addDoc(collection(db, 'documents'), dataToSave);
  } catch (firestoreError) {
     if (firestoreError instanceof FirestoreError && firestoreError.code === 'permission-denied') {
      const context: SecurityRuleContext = {
        path: 'documents',
        operation: 'create',
        auth: user ? { uid: user.uid } : null,
        resource: dataToSave,
      };
      errorEmitter.emit('permission-error', new FirestorePermissionError(context));
     }
     console.error("Erro ao salvar metadados no Firestore:", firestoreError);
     throw firestoreError;
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

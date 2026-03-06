
import { initializeFirebase } from '@/firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, getDoc, query, orderBy, FirestoreError, where } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
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

// CREATE (handles both upload and metadata)
export async function addDocument(docData: DocumentFormValues, file: File): Promise<{ success: boolean; error?: string; }> {
  const { firestore, storage, auth } = initializeFirebase();
  const user = auth.currentUser;
  if (!user) {
    return { success: false, error: "Usuário não autenticado. Por favor, faça o login novamente." };
  }

  // 1. Upload file to Storage
  const filePath = `documents/${user.uid}/${Date.now()}-${file.name}`;
  const storageRef = ref(storage, filePath);
  let fileUrl = '';
  try {
    const uploadResult = await uploadBytes(storageRef, file);
    fileUrl = await getDownloadURL(uploadResult.ref);
  } catch (storageError: any) {
    console.error("Erro no upload para o Firebase Storage:", storageError.code, storageError.message);
    let friendlyMessage = "Falha no upload do arquivo. Verifique o console do navegador para mais detalhes.";

    if (storageError.code === 'storage/unauthorized') {
        friendlyMessage = "Erro de permissão (CORS). Verifique se o bucket do Storage permite uploads do seu domínio de desenvolvimento. Siga as instruções de configuração de CORS.";
    } else if (storageError.code === 'storage/retry-limit-exceeded') {
        friendlyMessage = "O tempo limite da conexão foi excedido. Isso geralmente é um problema de configuração de CORS ou de rede. Verifique se as regras de CORS do seu bucket do Storage estão corretas.";
    }
    
    return { success: false, error: friendlyMessage };
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
    await addDoc(collection(firestore, 'documents'), dataToSave);
  } catch (firestoreError) {
     if (firestoreError instanceof FirestoreError && firestoreError.code === 'permission-denied') {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: 'documents',
        operation: 'create',
        requestResourceData: dataToSave,
      }));
     }
     console.error("Erro ao salvar metadados no Firestore:", firestoreError);
     // Clean up uploaded file if metadata fails
     await deleteObject(storageRef).catch(cleanupError => {
        console.error("Failed to clean up uploaded file after Firestore error:", cleanupError);
     });
     return { success: false, error: "Falha ao salvar os metadados do arquivo no banco de dados." };
  }
  
  return { success: true };
}

// UPDATE (metadata only)
export async function updateDocument(documentId: string, docData: DocumentFormValues & { name: string }): Promise<{ success: boolean; error?: string; }> {
  const { firestore } = initializeFirebase();
  const docRef = doc(firestore, 'documents', documentId);
  
  const dataToUpdate = {
      process: docData.process,
      tags: docData.tagsString ? docData.tagsString.split(',').map(t => t.trim()).filter(t => t) : [],
      updatedAt: serverTimestamp(),
  };

  try {
    await updateDoc(docRef, dataToUpdate);
    return { success: true };
  }
  catch(error) {
     if (error instanceof FirestoreError && error.code === 'permission-denied') {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: `documents/${documentId}`,
        operation: 'update',
        requestResourceData: dataToUpdate,
      }));
      return { success: false, error: "Você não tem permissão para atualizar este documento." };
    }
    return { success: false, error: "Ocorreu um erro desconhecido ao atualizar." };
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

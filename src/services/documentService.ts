
"use server";

import { db, storage } from '@/lib/firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, getDoc, query, orderBy } from 'firebase/firestore';
import { ref, deleteObject, getDownloadURL } from "firebase/storage";
import type { Document, DocumentFormValues } from '@/components/documents/DocumentFormDialog';
import type { DocumentData } from 'firebase/firestore';

const documentsCollectionRef = collection(db, 'documents');

const fromFirestore = (docSnap: DocumentData): Document => {
  const data = docSnap.data();
  const document: Document = {
    id: docSnap.id,
    name: data.name,
    process: data.process,
    tags: data.tags || [],
    uploadDate: data.uploadDate,
    filePath: data.filePath,
    // fileUrl não é mais um campo primário, mas pode existir em documentos antigos
    fileUrl: data.fileUrl || '', 
  };
   if (data.createdAt) {
      document.createdAt = data.createdAt.toDate().toISOString();
  }
  return document;
};

// READ
export async function getDocuments(): Promise<Document[]> {
  const q = query(documentsCollectionRef, orderBy("createdAt", "desc"));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(fromFirestore);
}

// CREATE
export async function addDocument(docData: Omit<DocumentFormValues, 'file'> & { name: string }, filePath: string): Promise<Document> {
  const tags = docData.tagsString ? docData.tagsString.split(',').map(t => t.trim()).filter(t => t) : [];
  
  const docRef = await addDoc(documentsCollectionRef, {
    name: docData.name,
    process: docData.process,
    tags: tags,
    uploadDate: new Date().toISOString().split('T')[0], // Simple YYYY-MM-DD
    createdAt: serverTimestamp(),
    filePath: filePath, // Salva apenas o caminho do arquivo
  });

  const snapshot = await getDoc(docRef);
  return fromFirestore(snapshot);
}

// UPDATE (metadata only)
export async function updateDocument(documentId: string, docData: Omit<DocumentFormValues, 'file'> & { name: string }): Promise<Document> {
  const docRef = doc(db, 'documents', documentId);
  const tags = docData.tagsString ? docData.tagsString.split(',').map(t => t.trim()).filter(t => t) : [];
  
  await updateDoc(docRef, {
    process: docData.process,
    tags: tags,
    updatedAt: serverTimestamp(),
  });
  
  const snapshot = await getDoc(docRef);
  return fromFirestore(snapshot);
}

// DELETE
export async function deleteDocument(document: Document): Promise<void> {
  // Delete file from storage
  if (document.filePath) {
      const fileRef = ref(storage, document.filePath);
      await deleteObject(fileRef).catch(error => {
          // It's okay if the file doesn't exist, log other errors.
          if (error.code !== 'storage/object-not-found') {
              console.error("Error deleting file from storage:", error);
              throw error;
          }
      });
  }

  // Delete document from Firestore
  const docRef = doc(db, 'documents', document.id);
  await deleteDoc(docRef);
}

// DOWNLOAD URL GETTER (USADO APENAS PARA O PROXY AGORA)
export async function getDownloadUrl(filePath: string): Promise<string> {
    const fileRef = ref(storage, filePath);
    const url = await getDownloadURL(fileRef);
    return url;
}

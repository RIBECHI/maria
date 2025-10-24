
"use server";

import { db, storage } from '@/lib/firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, getDoc, query, orderBy } from 'firebase/firestore';
import type { Document } from '@/components/documents/DocumentFormDialog';
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
export async function addDocument(docData: { process: string; tagsString?: string | undefined; name: string; }, filePath: string): Promise<Document> {
  const tags = docData.tagsString ? docData.tagsString.split(',').map(t => t.trim()).filter(Boolean) : [];
  
  const docRef = await addDoc(documentsCollectionRef, {
    name: docData.name,
    process: docData.process,
    tags: tags,
    uploadDate: new Date().toISOString().split('T')[0],
    createdAt: serverTimestamp(),
    filePath: filePath,
  });

  const snapshot = await getDoc(docRef);
  return fromFirestore(snapshot);
}

// UPDATE (metadata only)
export async function updateDocument(documentId: string, docData: { process: string, tags: string[] }): Promise<Document> {
  const docRef = doc(db, 'documents', documentId);
  
  await updateDoc(docRef, {
    process: docData.process,
    tags: docData.tags,
    updatedAt: serverTimestamp(),
  });
  
  const snapshot = await getDoc(docRef);
  return fromFirestore(snapshot);
}

// DELETE
export async function deleteDocument(document: Document): Promise<void> {
  if (document.filePath) {
      const encodedFilePath = encodeURIComponent(document.filePath);
      const proxyUrl = `/api/storage-proxy/${encodedFilePath}`;
      
      // Usa o proxy para deletar
      await fetch(proxyUrl, { method: 'DELETE' }).catch(error => {
          console.error("Error deleting file via proxy:", error);
          // Não joga o erro para não impedir a deleção do registro no DB
      });
  }

  const docRef = doc(db, 'documents', document.id);
  await deleteDoc(docRef);
}

// DOWNLOAD URL GETTER
export async function getDownloadUrl(filePath: string): Promise<string> {
    const encodedFilePath = encodeURIComponent(filePath);
    // Usa o proxy para obter a URL de download
    return `/v0/b/${process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET}/o/${encodedFilePath}?alt=media`;
}

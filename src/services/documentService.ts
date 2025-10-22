
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
      const fileRef = ref(storage, document.filePath);
      await deleteObject(fileRef).catch(error => {
          if (error.code !== 'storage/object-not-found') {
              console.error("Error deleting file from storage:", error);
              throw error;
          }
      });
  }

  const docRef = doc(db, 'documents', document.id);
  await deleteDoc(docRef);
}

// DOWNLOAD URL GETTER
export async function getDownloadUrl(filePath: string): Promise<string> {
    const fileRef = ref(storage, filePath);
    const url = await getDownloadURL(fileRef);
    return url;
}

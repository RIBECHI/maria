
"use server";

import { getDb, getStorageInstance } from '@/lib/firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, getDoc, query, orderBy } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import type { Document, DocumentFormValues } from '@/components/documents/DocumentFormDialog';
import type { DocumentData } from 'firebase/firestore';


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
export async function getDocuments(): Promise<Document[]> {
  const db = getDb();
  if (!db) throw new Error("Firebase DB not initialized");
  const documentsCollectionRef = collection(db, 'documents');
  const q = query(documentsCollectionRef, orderBy("createdAt", "desc"));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(fromFirestore);
}

// CREATE
export async function addDocument(docData: DocumentFormValues & { name: string }, file: File): Promise<Document> {
  const db = getDb();
  const storage = getStorageInstance();
  if (!db || !storage) throw new Error("Firebase not initialized");

  if (!file) throw new Error("File is required for upload.");

  const filePath = `documents/${Date.now()}-${file.name}`;
  const storageRef = ref(storage, filePath);
  
  // Upload file to Firebase Storage
  await uploadBytes(storageRef, file);
  
  // Get download URL
  const fileUrl = await getDownloadURL(storageRef);

  const tags = docData.tagsString ? docData.tagsString.split(',').map(t => t.trim()).filter(t => t) : [];
  const documentsCollectionRef = collection(db, 'documents');
  const docRef = await addDoc(documentsCollectionRef, {
    name: docData.name,
    process: docData.process,
    tags: tags,
    uploadDate: new Date().toISOString().split('T')[0], // Simple YYYY-MM-DD
    createdAt: serverTimestamp(),
    fileUrl: fileUrl,
    filePath: filePath,
  });
  const snapshot = await getDoc(docRef);
  return fromFirestore(snapshot);
}

// UPDATE (metadata only)
export async function updateDocument(documentId: string, docData: DocumentFormValues & { name: string }): Promise<Document> {
  const db = getDb();
  if (!db) throw new Error("Firebase DB not initialized");
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
  const db = getDb();
  const storage = getStorageInstance();
  if (!db || !storage) throw new Error("Firebase not initialized");

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

// DOWNLOAD URL GETTER
export async function getDownloadUrl(filePath: string): Promise<string> {
    const storage = getStorageInstance();
    if (!storage) throw new Error("Firebase Storage not initialized");
    const fileRef = ref(storage, filePath);
    const url = await getDownloadURL(fileRef);
    return url;
}

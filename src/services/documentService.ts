
"use server";

import { db, storage } from '@/lib/firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, getDoc, query, orderBy } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
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
  const q = query(documentsCollectionRef, orderBy("createdAt", "desc"));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(fromFirestore);
}

// CREATE
export async function addDocument(docData: DocumentFormValues & { name: string }, file: File): Promise<Document> {
  if (!file) throw new Error("File is required for upload.");

  const filePath = `documents/${Date.now()}-${file.name}`;
  const storageRef = ref(storage, filePath);
  
  // Upload file to Firebase Storage
  await uploadBytes(storageRef, file);
  
  // Get download URL
  const fileUrl = await getDownloadURL(storageRef);

  const tags = docData.tagsString ? docData.tagsString.split(',').map(t => t.trim()).filter(t => t) : [];
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
  const docRef = doc(db, 'documents', documentId);
  const tags = docData.tagsString ? docData.tagsString.split(',').map(t => t.trim()).filter(t => t) : [];
  
  await updateDoc(docRef, {
    // name: docData.name, // O nome do arquivo não deve ser alterado sem alterar o arquivo
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

// DOWNLOAD
export async function downloadFile(filePath: string, fileName: string): Promise<void> {
    const fileRef = ref(storage, filePath);
    const url = await getDownloadURL(fileRef);

    // This part is tricky to do on the server side in a Next.js server action.
    // The best approach is to pass the URL to the client and let the client handle the download.
    // However, since this is a server action, we cannot directly trigger a browser download.
    // This function will primarily be used to get the URL, which we can then use on the client.
    // For a direct download simulation, we'd need a different setup (e.g. API route).
    // For now, we will just open the url in a new tab.
    
    // The code below is a client-side pattern. It will throw an error on the server.
    // We will call this function from the client to get the URL and handle the download there.
    
    const response = await fetch(url);
    const blob = await response.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(blobUrl);
    document.body.removeChild(a);
}

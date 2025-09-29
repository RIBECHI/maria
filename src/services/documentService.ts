
"use server";

import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, getDoc, query, orderBy } from 'firebase/firestore';
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
  };
   if (data.createdAt) {
      // Assuming createdAt is a Firestore Timestamp
      document.createdAt = data.createdAt.toDate().toISOString();
  }
  return document;
};

// READ
export async function getDocuments(): Promise<Document[]> {
  const q = query(documentsCollectionRef, orderBy("uploadDate", "desc"));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(fromFirestore);
}

// CREATE
export async function addDocument(docData: DocumentFormValues): Promise<Document> {
  const tags = docData.tagsString ? docData.tagsString.split(',').map(t => t.trim()).filter(t => t) : [];
  const docRef = await addDoc(documentsCollectionRef, {
    name: docData.name,
    process: docData.process,
    tags: tags,
    uploadDate: new Date().toISOString().split('T')[0], // Simple YYYY-MM-DD
    createdAt: serverTimestamp(),
  });
  const snapshot = await getDoc(docRef);
  return fromFirestore(snapshot);
}

// UPDATE
export async function updateDocument(documentId: string, docData: DocumentFormValues): Promise<Document> {
  const docRef = doc(db, 'documents', documentId);
  const tags = docData.tagsString ? docData.tagsString.split(',').map(t => t.trim()).filter(t => t) : [];
  
  await updateDoc(docRef, {
    name: docData.name,
    process: docData.process,
    tags: tags,
    updatedAt: serverTimestamp(),
  });
  
  const snapshot = await getDoc(docRef);
  return fromFirestore(snapshot);
}

// DELETE
export async function deleteDocument(documentId: string): Promise<void> {
  const docRef = doc(db, 'documents', documentId);
  await deleteDoc(docRef);
}

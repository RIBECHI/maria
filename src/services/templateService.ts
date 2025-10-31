
import { getDb } from '@/lib/firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, query, orderBy, getDoc, type DocumentData } from 'firebase/firestore';

export interface DocumentTemplate extends DocumentData {
  id: string;
  name: string;
  content: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface TemplateFormValues {
    name: string;
    content: string;
}

const fromFirestore = (docSnap: DocumentData): DocumentTemplate => {
  const data = docSnap.data();
  return {
    id: docSnap.id,
    name: data.name,
    content: data.content,
    createdAt: data.createdAt?.toDate().toISOString(),
    updatedAt: data.updatedAt?.toDate().toISOString(),
  };
};

// READ
export async function getTemplates(): Promise<DocumentTemplate[]> {
  const db = getDb();
  if (!db) throw new Error("Firebase DB not initialized");
  const templatesCollectionRef = collection(db, 'documentTemplates');
  const q = query(templatesCollectionRef, orderBy("name", "asc"));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(fromFirestore);
}

// CREATE
export async function addTemplate(templateData: TemplateFormValues): Promise<DocumentTemplate> {
    const db = getDb();
    if (!db) throw new Error("Firebase DB not initialized");
    const templatesCollectionRef = collection(db, 'documentTemplates');
    const docRef = await addDoc(templatesCollectionRef, {
        ...templateData,
        createdAt: serverTimestamp(),
    });
    const snapshot = await getDoc(docRef);
    return fromFirestore(snapshot);
}

// UPDATE
export async function updateTemplate(templateId: string, templateData: TemplateFormValues): Promise<DocumentTemplate> {
    const db = getDb();
    if (!db) throw new Error("Firebase DB not initialized");
    const templateDocRef = doc(db, 'documentTemplates', templateId);
    await updateDoc(templateDocRef, {
        ...templateData,
        updatedAt: serverTimestamp(),
    });
    const snapshot = await getDoc(templateDocRef);
    return fromFirestore(snapshot);
}

// DELETE
export async function deleteTemplate(templateId: string): Promise<void> {
    const db = getDb();
    if (!db) throw new Error("Firebase DB not initialized");
    const templateDocRef = doc(db, 'documentTemplates', templateId);
    await deleteDoc(templateDocRef);
}

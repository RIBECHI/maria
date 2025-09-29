
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

const notepadDocRef = doc(db, 'notepad', 'main');

// GET
export async function getNotepadContent(): Promise<string> {
  const docSnap = await getDoc(notepadDocRef);
  if (docSnap.exists()) {
    // Retorna o conteúdo do campo 'content' ou uma string vazia se não existir
    return docSnap.data().content || "";
  } else {
    // Se o documento não existe, retorna uma string vazia
    return "";
  }
}

// SAVE
export async function saveNotepadContent(content: string): Promise<void> {
  await setDoc(notepadDocRef, {
    content: content,
    updatedAt: serverTimestamp(),
  });
}

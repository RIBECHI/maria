
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp, Timestamp } from 'firebase/firestore';

export interface Note {
  id: string;
  content: string;
  createdAt: Timestamp;
  isTask?: boolean;
  completed?: boolean;
}

const notepadDocRef = doc(db, 'notepad', 'main');

// GET
export async function getNotes(): Promise<Note[]> {
  const docSnap = await getDoc(notepadDocRef);
  if (docSnap.exists() && docSnap.data().notes) {
    const notesData = docSnap.data().notes as any[];
    // Certifica-se de que createdAt é um objeto Timestamp do Firebase, 
    // e não uma string, para ordenação correta.
    return notesData.map(note => ({
      ...note,
      createdAt: new Timestamp(note.createdAt.seconds, note.createdAt.nanoseconds)
    })).sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());
  } else {
    return [];
  }
}

// SAVE
export async function saveNotes(notes: Note[]): Promise<void> {
  // A ordenação já é feita no getNotes e ao adicionar, mas garantimos aqui antes de salvar.
  const sortedNotes = [...notes].sort((a, b) => 
    (b.createdAt?.toMillis() ?? 0) - (a.createdAt?.toMillis() ?? 0)
  );

  await setDoc(notepadDocRef, {
    notes: sortedNotes,
    updatedAt: serverTimestamp(),
  });
}

// GET ONLY TASKS
export async function getNotepadTasks(): Promise<Note[]> {
    const allNotes = await getNotes();
    return allNotes.filter(note => note.isTask);
}

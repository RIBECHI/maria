
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors';

export interface Note {
  id: string;
  content: string;
  createdAt: Timestamp;
  isTask?: boolean;
  completed?: boolean;
}

// GET
export async function getNotes(): Promise<Note[]> {
  const notepadDocRef = doc(db, 'notepad', 'main');
  const docSnap = await getDoc(notepadDocRef).catch(async (serverError) => {
    const permissionError = new FirestorePermissionError({
        path: notepadDocRef.path,
        operation: 'get',
    } satisfies SecurityRuleContext);
    errorEmitter.emit('permission-error', permissionError);
    throw permissionError;
  });

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
  const notepadDocRef = doc(db, 'notepad', 'main');
  // A ordenação já é feita no getNotes e ao adicionar, mas garantimos aqui antes de salvar.
  const sortedNotes = [...notes].sort((a, b) => 
    (b.createdAt?.toMillis() ?? 0) - (a.createdAt?.toMillis() ?? 0)
  );

  const dataToSave = {
    notes: sortedNotes,
    updatedAt: serverTimestamp(),
  };

  setDoc(notepadDocRef, dataToSave)
    .catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
            path: notepadDocRef.path,
            operation: 'update', // setDoc acts as an update here
            requestResourceData: dataToSave,
        } satisfies SecurityRuleContext);
        errorEmitter.emit('permission-error', permissionError);
        throw permissionError;
    });
}

// GET ONLY TASKS
export async function getNotepadTasks(): Promise<Note[]> {
    const allNotes = await getNotes();
    return allNotes.filter(note => note.isTask);
}

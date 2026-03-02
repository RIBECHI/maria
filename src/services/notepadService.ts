
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp, Timestamp, FirestoreError } from 'firebase/firestore';
import { errorEmitter, FirestorePermissionError, SecurityRuleContext } from '@/lib/errors';


export interface Note {
  id: string;
  content: string;
  createdAt: Timestamp;
  author: string;
  isTask?: boolean;
  status?: 'aberto' | 'urgente' | 'concluido';
}

// GET
export async function getNotes(): Promise<Note[]> {
  if (!db) return []; // Return empty array if db is not available
  const notepadDocRef = doc(db, 'notepad', 'main');
  try {
    const docSnap = await getDoc(notepadDocRef);
    if (docSnap.exists() && docSnap.data().notes) {
        const notesData = docSnap.data().notes as any[];
        return notesData.map(note => {
          const newNote: any = {
            ...note,
            createdAt: new Timestamp(note.createdAt.seconds, note.createdAt.nanoseconds),
            author: note.author || 'Usuário Desconhecido'
          };
          // Migration from old 'completed' to new 'status'
          if (note.isTask && typeof note.completed !== 'undefined') {
            newNote.status = note.completed ? 'concluido' : 'aberto';
            delete newNote.completed; // remove old field
          }
          return newNote as Note;
        }).sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());
    } else {
        return [];
    }
  } catch(error) {
     if (error instanceof FirestoreError && error.code === 'permission-denied') {
      const context: SecurityRuleContext = {
        path: 'notepad/main',
        operation: 'get',
        auth: auth.currentUser ? { uid: auth.currentUser.uid } : null,
      };
      errorEmitter.emit('permission-error', new FirestorePermissionError(context));
    }
    // Para GET, podemos retornar um array vazio em caso de erro de permissão para não quebrar a UI
    return [];
  }
}

// SAVE
export async function saveNotes(notes: Note[]): Promise<void> {
  if (!db) throw new Error("Firebase DB not initialized");
  const notepadDocRef = doc(db, 'notepad', 'main');
  
  const sortedNotes = [...notes].sort((a, b) => 
    (b.createdAt?.toMillis() ?? 0) - (a.createdAt?.toMillis() ?? 0)
  );

  const dataToSave = {
    notes: sortedNotes,
    updatedAt: serverTimestamp(),
  };

  try {
    await setDoc(notepadDocRef, dataToSave);
  } catch(error) {
     if (error instanceof FirestoreError && error.code === 'permission-denied') {
      const context: SecurityRuleContext = {
        path: 'notepad/main',
        operation: 'update',
        auth: auth.currentUser ? { uid: auth.currentUser.uid } : null,
        resource: dataToSave,
      };
      errorEmitter.emit('permission-error', new FirestorePermissionError(context));
    }
    throw error;
  }
}

// GET ONLY TASKS
export async function getNotepadTasks(): Promise<Note[]> {
    if (!db) return [];
    const allNotes = await getNotes();
    return allNotes.filter(note => note.isTask);
}

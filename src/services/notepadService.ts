
import { initializeFirebase } from '@/firebase';
import { doc, getDoc, setDoc, serverTimestamp, Timestamp, FirestoreError } from 'firebase/firestore';
import { errorEmitter, FirestorePermissionError } from '@/firebase';


export interface Note {
  id: string;
  content: string;
  createdAt: Timestamp;
  author: string;
  isTask?: boolean;
  status?: 'aberto' | 'urgente' | 'concluido';
}

// GET
export function getNotes(): Promise<Note[]> {
  const { firestore, auth } = initializeFirebase();
  if (!firestore) return Promise.resolve([]);
  const notepadDocRef = doc(firestore, 'notepad', 'main');
  
  return getDoc(notepadDocRef)
    .then(docSnap => {
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
      }
      return [];
    })
    .catch(error => {
       if (error instanceof FirestoreError && error.code === 'permission-denied') {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: 'notepad/main',
          operation: 'get',
        }));
      }
      return [];
    });
}

// SAVE
export function saveNotes(notes: Note[]): void {
  const { firestore, auth } = initializeFirebase();
  if (!firestore) throw new Error("Firebase DB not initialized");
  const notepadDocRef = doc(firestore, 'notepad', 'main');
  
  const sortedNotes = [...notes].sort((a, b) => 
    (b.createdAt?.toMillis() ?? 0) - (a.createdAt?.toMillis() ?? 0)
  );

  const dataToSave = {
    notes: sortedNotes,
    updatedAt: serverTimestamp(),
  };

  setDoc(notepadDocRef, dataToSave)
    .catch(error => {
      if (error instanceof FirestoreError && error.code === 'permission-denied') {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: 'notepad/main',
          operation: 'update',
          requestResourceData: dataToSave,
        }));
      }
    });
}

// GET ONLY TASKS
export async function getNotepadTasks(): Promise<Note[]> {
    const { firestore } = initializeFirebase();
    if (!firestore) return [];
    const allNotes = await getNotes();
    return allNotes.filter(note => note.isTask);
}

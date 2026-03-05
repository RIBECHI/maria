
import { getFirebaseServices } from '@/lib/firebase';
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
export function getNotes(): Promise<Note[]> {
  const { db, auth } = getFirebaseServices();
  if (!db) return Promise.resolve([]);
  const notepadDocRef = doc(db, 'notepad', 'main');
  
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
        const context: SecurityRuleContext = {
          path: 'notepad/main',
          operation: 'get',
          auth: auth.currentUser ? { uid: auth.currentUser.uid } : null,
        };
        errorEmitter.emit('permission-error', new FirestorePermissionError(context));
      }
      return [];
    });
}

// SAVE
export function saveNotes(notes: Note[]): void {
  const { db, auth } = getFirebaseServices();
  if (!db) throw new Error("Firebase DB not initialized");
  const notepadDocRef = doc(db, 'notepad', 'main');
  
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
        const context: SecurityRuleContext = {
          path: 'notepad/main',
          operation: 'update',
          auth: auth.currentUser ? { uid: auth.currentUser.uid } : null,
          resource: dataToSave,
        };
        errorEmitter.emit('permission-error', new FirestorePermissionError(context));
      }
    });
}

// GET ONLY TASKS
export async function getNotepadTasks(): Promise<Note[]> {
    const { db } = getFirebaseServices();
    if (!db) return [];
    const allNotes = await getNotes();
    return allNotes.filter(note => note.isTask);
}

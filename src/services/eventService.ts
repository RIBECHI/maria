
import { auth, db } from '@/lib/firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, where, orderBy, limit, serverTimestamp, getDoc, FirestoreError } from 'firebase/firestore';
import type { CalendarEvent, EventFormValues } from '@/components/agenda/EventFormDialog';
import { startOfToday, format } from 'date-fns';
import { errorEmitter, FirestorePermissionError, SecurityRuleContext } from '@/lib/errors';


const fromFirestore = (docSnap: any): CalendarEvent => {
    const data = docSnap.data();
    const event: CalendarEvent = {
        id: docSnap.id,
        date: data.date,
        type: data.type,
        description: data.description,
        time: data.time,
        client: data.client,
        process: data.process,
    };
    if (data.createdAt) {
        event.createdAt = data.createdAt.toDate().toISOString();
    }
    return event;
};

// READ ALL
export function getEvents(): Promise<CalendarEvent[]> {
  if (!db) throw new Error("Firebase DB not initialized");
  const eventsCollectionRef = collection(db, 'events');
  const q = query(eventsCollectionRef, orderBy('date', 'asc'));
  return getDocs(q)
    .then(querySnapshot => querySnapshot.docs.map(fromFirestore))
    .catch(error => {
      if (error instanceof FirestoreError && error.code === 'permission-denied') {
        const context: SecurityRuleContext = {
          path: 'events',
          operation: 'list',
          auth: auth.currentUser ? { uid: auth.currentUser.uid } : null,
        };
        errorEmitter.emit('permission-error', new FirestorePermissionError(context));
      }
      return [];
    });
}

// READ for Dashboard/Sidebar
export function getEventsForDashboard(count: number): Promise<CalendarEvent[]> {
  if (!db) throw new Error("Firebase DB not initialized");
  const eventsCollectionRef = collection(db, 'events');
  const today = format(startOfToday(), 'yyyy-MM-dd');
  const q = query(
    eventsCollectionRef, 
    where('date', '>=', today), 
    orderBy('date', 'asc'), 
    limit(count)
  );
  
  return getDocs(q)
    .then(querySnapshot => querySnapshot.docs.map(fromFirestore))
    .catch(error => {
        if (error instanceof FirestoreError && error.code === 'permission-denied') {
            const context: SecurityRuleContext = {
                path: 'events',
                operation: 'list',
                auth: auth.currentUser ? { uid: auth.currentUser.uid } : null,
            };
            errorEmitter.emit('permission-error', new FirestorePermissionError(context));
        }
        return [];
    });
}

// CREATE
export function addEvent(eventData: Omit<EventFormValues, "clientId"> & { client?: string | undefined; }): void {
  if (!db) throw new Error("Firebase DB not initialized");
  const eventsCollectionRef = collection(db, 'events');
  const dataToSave = {
      ...eventData,
      createdAt: serverTimestamp(),
  };

  addDoc(eventsCollectionRef, dataToSave)
    .catch(error => {
      if (error instanceof FirestoreError && error.code === 'permission-denied') {
          const context: SecurityRuleContext = {
              path: 'events',
              operation: 'create',
              auth: auth.currentUser ? { uid: auth.currentUser.uid } : null,
              resource: dataToSave,
          };
          errorEmitter.emit('permission-error', new FirestorePermissionError(context));
      }
  });
}

// UPDATE
export function updateEvent(eventId: string, eventData: Omit<EventFormValues, "clientId"> & { client?: string | undefined; }): void {
  if (!db) throw new Error("Firebase DB not initialized");
  const eventDocRef = doc(db, 'events', eventId);
  const dataToUpdate = {
      ...eventData,
      updatedAt: serverTimestamp(),
  };

  updateDoc(eventDocRef, dataToUpdate)
    .catch(error => {
      if (error instanceof FirestoreError && error.code === 'permission-denied') {
          const context: SecurityRuleContext = {
              path: `events/${eventId}`,
              operation: 'update',
              auth: auth.currentUser ? { uid: auth.currentUser.uid } : null,
              resource: dataToUpdate,
          };
          errorEmitter.emit('permission-error', new FirestorePermissionError(context));
      }
  });
}

// DELETE
export function deleteEvent(eventId: string): void {
  if (!db) throw new Error("Firebase DB not initialized");
  const eventDocRef = doc(db, 'events', eventId);
  
  deleteDoc(eventDocRef).catch(error => {
    if (error instanceof FirestoreError && error.code === 'permission-denied') {
        const context: SecurityRuleContext = {
            path: `events/${eventId}`,
            operation: 'delete',
            auth: auth.currentUser ? { uid: auth.currentUser.uid } : null,
        };
        errorEmitter.emit('permission-error', new FirestorePermissionError(context));
    }
  });
}

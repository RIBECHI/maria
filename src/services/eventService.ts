
import { initializeFirebase } from '@/firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, where, orderBy, limit, serverTimestamp, getDoc, FirestoreError } from 'firebase/firestore';
import type { CalendarEvent, EventFormValues } from '@/components/agenda/EventFormDialog';
import { startOfToday, format } from 'date-fns';
import { errorEmitter, FirestorePermissionError } from '@/firebase';


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
  const { firestore, auth } = initializeFirebase();
  const eventsCollectionRef = collection(firestore, 'events');
  const q = query(eventsCollectionRef, orderBy('date', 'asc'));
  return getDocs(q)
    .then(querySnapshot => querySnapshot.docs.map(fromFirestore))
    .catch(error => {
      if (error instanceof FirestoreError && error.code === 'permission-denied') {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: 'events',
          operation: 'list',
        }));
      }
      return [];
    });
}

// READ for Dashboard/Sidebar
export function getEventsForDashboard(count: number): Promise<CalendarEvent[]> {
  const { firestore, auth } = initializeFirebase();
  const eventsCollectionRef = collection(firestore, 'events');
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
            errorEmitter.emit('permission-error', new FirestorePermissionError({
                path: 'events',
                operation: 'list',
            }));
        }
        return [];
    });
}

// CREATE
export function addEvent(eventData: Omit<EventFormValues, "clientId"> & { client?: string | undefined; }): void {
  const { firestore, auth } = initializeFirebase();
  const eventsCollectionRef = collection(firestore, 'events');
  const dataToSave = {
      ...eventData,
      createdAt: serverTimestamp(),
  };

  addDoc(eventsCollectionRef, dataToSave)
    .catch(error => {
      if (error instanceof FirestoreError && error.code === 'permission-denied') {
          errorEmitter.emit('permission-error', new FirestorePermissionError({
              path: 'events',
              operation: 'create',
              requestResourceData: dataToSave,
          }));
      }
  });
}

// UPDATE
export function updateEvent(eventId: string, eventData: Omit<EventFormValues, "clientId"> & { client?: string | undefined; }): void {
  const { firestore, auth } = initializeFirebase();
  const eventDocRef = doc(firestore, 'events', eventId);
  const dataToUpdate = {
      ...eventData,
      updatedAt: serverTimestamp(),
  };

  updateDoc(eventDocRef, dataToUpdate)
    .catch(error => {
      if (error instanceof FirestoreError && error.code === 'permission-denied') {
          errorEmitter.emit('permission-error', new FirestorePermissionError({
              path: `events/${eventId}`,
              operation: 'update',
              requestResourceData: dataToUpdate,
          }));
      }
  });
}

// DELETE
export function deleteEvent(eventId: string): void {
  const { firestore, auth } = initializeFirebase();
  const eventDocRef = doc(firestore, 'events', eventId);
  
  deleteDoc(eventDocRef).catch(error => {
    if (error instanceof FirestoreError && error.code === 'permission-denied') {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: `events/${eventId}`,
            operation: 'delete',
        }));
    }
  });
}

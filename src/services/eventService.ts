
import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, where, orderBy, limit, serverTimestamp, getDoc } from 'firebase/firestore';
import type { CalendarEvent } from '@/components/agenda/EventFormDialog';
import { startOfToday, format } from 'date-fns';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors';


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
export async function getEvents(): Promise<CalendarEvent[]> {
  const eventsCollectionRef = collection(db, 'events');
  const q = query(eventsCollectionRef, orderBy('date', 'asc'));
  const querySnapshot = await getDocs(q).catch(async (serverError) => {
    const permissionError = new FirestorePermissionError({
        path: eventsCollectionRef.path,
        operation: 'list',
    } satisfies SecurityRuleContext);
    errorEmitter.emit('permission-error', permissionError);
    throw permissionError;
  });
  return querySnapshot.docs.map(fromFirestore);
}

// READ for Dashboard/Sidebar
export async function getEventsForDashboard(count: number): Promise<CalendarEvent[]> {
  const eventsCollectionRef = collection(db, 'events');
  const today = format(startOfToday(), 'yyyy-MM-dd');
  const q = query(
    eventsCollectionRef, 
    where('date', '>=', today), 
    orderBy('date', 'asc'), 
    limit(count)
  );
  
  const querySnapshot = await getDocs(q).catch(async (serverError) => {
    const permissionError = new FirestorePermissionError({
        path: eventsCollectionRef.path,
        operation: 'list',
    } satisfies SecurityRuleContext);
    errorEmitter.emit('permission-error', permissionError);
    throw permissionError;
  });
  return querySnapshot.docs.map(fromFirestore);
}

// CREATE
export async function addEvent(eventData: Omit<import("/home/user/app/src/components/agenda/EventFormDialog").EventFormValues, "clientId"> & { client?: string | undefined; }): Promise<CalendarEvent> {
  const eventsCollectionRef = collection(db, 'events');
  const dataToSave = {
    ...eventData,
    createdAt: serverTimestamp(),
  };
  const docRef = await addDoc(eventsCollectionRef, dataToSave)
    .catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
            path: eventsCollectionRef.path,
            operation: 'create',
            requestResourceData: dataToSave,
        } satisfies SecurityRuleContext);
        errorEmitter.emit('permission-error', permissionError);
        throw permissionError;
    });
  const snapshot = await getDoc(docRef);
  return fromFirestore(snapshot);
}

// UPDATE
export async function updateEvent(eventId: string, eventData: Omit<import("/home/user/app/src/components/agenda/EventFormDialog").EventFormValues, "clientId"> & { client?: string | undefined; }): Promise<CalendarEvent> {
  const eventDocRef = doc(db, 'events', eventId);
  const dataToUpdate = {
    ...eventData,
    updatedAt: serverTimestamp(),
  };
  await updateDoc(eventDocRef, dataToUpdate)
    .catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
            path: eventDocRef.path,
            operation: 'update',
            requestResourceData: dataToUpdate,
        } satisfies SecurityRuleContext);
        errorEmitter.emit('permission-error', permissionError);
        throw permissionError;
    });
  const snapshot = await getDoc(eventDocRef);
  return fromFirestore(snapshot);
}

// DELETE
export async function deleteEvent(eventId: string): Promise<void> {
  const eventDocRef = doc(db, 'events', eventId);
  deleteDoc(eventDocRef)
    .catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
            path: eventDocRef.path,
            operation: 'delete',
        } satisfies SecurityRuleContext);
        errorEmitter.emit('permission-error', permissionError);
        throw permissionError;
    });
}

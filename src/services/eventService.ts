
"use server";

import { auth, db } from '@/lib/firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, where, orderBy, limit, serverTimestamp, getDoc, FirestoreError } from 'firebase/firestore';
import type { CalendarEvent } from '@/components/agenda/EventFormDialog';
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
export async function getEvents(): Promise<CalendarEvent[]> {
  if (!db) throw new Error("Firebase DB not initialized");
  const eventsCollectionRef = collection(db, 'events');
  const q = query(eventsCollectionRef, orderBy('date', 'asc'));
  try {
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(fromFirestore);
  } catch(error) {
    if (error instanceof FirestoreError && error.code === 'permission-denied') {
      const context: SecurityRuleContext = {
        path: 'events',
        operation: 'list',
        auth: auth.currentUser ? { uid: auth.currentUser.uid } : null,
      };
      errorEmitter.emit('permission-error', new FirestorePermissionError(context));
    }
    throw error;
  }
}

// READ for Dashboard/Sidebar
export async function getEventsForDashboard(count: number): Promise<CalendarEvent[]> {
  if (!db) throw new Error("Firebase DB not initialized");
  const eventsCollectionRef = collection(db, 'events');
  const today = format(startOfToday(), 'yyyy-MM-dd');
  const q = query(
    eventsCollectionRef, 
    where('date', '>=', today), 
    orderBy('date', 'asc'), 
    limit(count)
  );
  
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(fromFirestore);
}

// CREATE
export async function addEvent(eventData: Omit<import("/home/user/app/src/components/agenda/EventFormDialog").EventFormValues, "clientId"> & { client?: string | undefined; }): Promise<CalendarEvent> {
  if (!db) throw new Error("Firebase DB not initialized");
  const eventsCollectionRef = collection(db, 'events');
  try {
    const docRef = await addDoc(eventsCollectionRef, {
        ...eventData,
        createdAt: serverTimestamp(),
    });
    const snapshot = await getDoc(docRef);
    return fromFirestore(snapshot);
  } catch(error) {
    if (error instanceof FirestoreError && error.code === 'permission-denied') {
        const context: SecurityRuleContext = {
            path: 'events',
            operation: 'create',
            auth: auth.currentUser ? { uid: auth.currentUser.uid } : null,
            resource: eventData,
        };
        errorEmitter.emit('permission-error', new FirestorePermissionError(context));
    }
    throw error;
  }
}

// UPDATE
export async function updateEvent(eventId: string, eventData: Omit<import("/home/user/app/src/components/agenda/EventFormDialog").EventFormValues, "clientId"> & { client?: string | undefined; }): Promise<CalendarEvent> {
  if (!db) throw new Error("Firebase DB not initialized");
  const eventDocRef = doc(db, 'events', eventId);
  try {
    await updateDoc(eventDocRef, {
        ...eventData,
        updatedAt: serverTimestamp(),
    });
    const snapshot = await getDoc(eventDocRef);
    return fromFirestore(snapshot);
  } catch(error) {
    if (error instanceof FirestoreError && error.code === 'permission-denied') {
        const context: SecurityRuleContext = {
            path: `events/${eventId}`,
            operation: 'update',
            auth: auth.currentUser ? { uid: auth.currentUser.uid } : null,
            resource: eventData,
        };
        errorEmitter.emit('permission-error', new FirestorePermissionError(context));
    }
    throw error;
  }
}

// DELETE
export async function deleteEvent(eventId: string): Promise<void> {
  if (!db) throw new Error("Firebase DB not initialized");
  const eventDocRef = doc(db, 'events', eventId);
  try {
    await deleteDoc(eventDocRef);
  } catch(error) {
    if (error instanceof FirestoreError && error.code === 'permission-denied') {
        const context: SecurityRuleContext = {
            path: `events/${eventId}`,
            operation: 'delete',
            auth: auth.currentUser ? { uid: auth.currentUser.uid } : null,
        };
        errorEmitter.emit('permission-error', new FirestorePermissionError(context));
    }
    throw error;
  }
}

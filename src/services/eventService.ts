
"use server";

import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, where, orderBy, limit, serverTimestamp, getDoc } from 'firebase/firestore';
import type { CalendarEvent } from '@/components/agenda/EventFormDialog';
import { startOfToday, format } from 'date-fns';

const eventsCollectionRef = collection(db, 'events');

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
  const q = query(eventsCollectionRef, orderBy('date', 'asc'));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(fromFirestore);
}

// READ for Dashboard/Sidebar
export async function getEventsForDashboard(count: number): Promise<CalendarEvent[]> {
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
  const docRef = await addDoc(eventsCollectionRef, {
    ...eventData,
    createdAt: serverTimestamp(),
  });
  const snapshot = await getDoc(docRef);
  return fromFirestore(snapshot);
}

// UPDATE
export async function updateEvent(eventId: string, eventData: Omit<import("/home/user/app/src/components/agenda/EventFormDialog").EventFormValues, "clientId"> & { client?: string | undefined; }): Promise<CalendarEvent> {
  const eventDocRef = doc(db, 'events', eventId);
  await updateDoc(eventDocRef, {
    ...eventData,
    updatedAt: serverTimestamp(),
  });
  const snapshot = await getDoc(eventDocRef);
  return fromFirestore(snapshot);
}

// DELETE
export async function deleteEvent(eventId: string): Promise<void> {
  const eventDocRef = doc(db, 'events', eventId);
  await deleteDoc(eventDocRef);
}

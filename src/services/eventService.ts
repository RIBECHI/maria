
"use server";

import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, where, orderBy, limit, serverTimestamp, getDoc, Timestamp } from 'firebase/firestore';
import type { CalendarEvent, EventFormValues } from '@/components/agenda/EventFormDialog';
import { startOfToday } from 'date-fns';
import { format } from 'date-fns/fp';

const eventsCollectionRef = collection(db, 'events');

const fromFirestore = (docSnap: any): CalendarEvent => {
    const data = docSnap.data();
    return {
        id: docSnap.id,
        ...data,
        // As datas já estão como string 'YYYY-MM-DD', então não precisam de conversão complexa
    } as CalendarEvent;
};

// READ ALL
export async function getEvents(): Promise<CalendarEvent[]> {
  const q = query(eventsCollectionRef, orderBy('date', 'asc'));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(fromFirestore);
}

// READ for Dashboard/Sidebar
export async function getEventsForDashboard(count: number): Promise<CalendarEvent[]> {
  const today = format('yyyy-MM-dd', startOfToday());
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
export async function addEvent(eventData: EventFormValues): Promise<CalendarEvent> {
  const docRef = await addDoc(eventsCollectionRef, {
    ...eventData,
    createdAt: serverTimestamp(),
  });
  const snapshot = await getDoc(docRef);
  return fromFirestore(snapshot);
}

// UPDATE
export async function updateEvent(eventId: string, eventData: EventFormValues): Promise<CalendarEvent> {
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

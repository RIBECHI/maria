
"use server";

import { db } from '@/lib/firebase';
import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import type { CalendarEvent } from '@/components/agenda/EventFormDialog';
import { startOfToday } from 'date-fns';
import { format } from 'date-fns/fp';

const eventsCollectionRef = collection(db, 'events');

export async function getEventsForDashboard(count: number): Promise<CalendarEvent[]> {
  const today = format('yyyy-MM-dd', startOfToday());
  const q = query(
    eventsCollectionRef, 
    where('date', '>=', today), 
    orderBy('date', 'asc'), 
    limit(count)
  );
  
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as CalendarEvent[];
}

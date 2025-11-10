
"use client";

import * as React from 'react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import Link from 'next/link';
import { getEventsForDashboard } from '@/services/eventService';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { SidebarGroupLabel } from '@/components/ui/sidebar';
import type { CalendarEvent } from '@/components/agenda/EventFormDialog';
import { CalendarDays } from 'lucide-react';

export default function UpcomingEventsSidebar() {
    const [upcomingEvents, setUpcomingEvents] = React.useState<CalendarEvent[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);

    React.useEffect(() => {
        async function fetchEvents() {
            setIsLoading(true);
            try {
                // Buscamos um número maior de eventos para ter o que rolar
                const events = await getEventsForDashboard(15); 
                setUpcomingEvents(events);
            } catch (error) {
                console.error("Erro ao carregar eventos para a sidebar:", error);
            } finally {
                setIsLoading(false);
            }
        }
        fetchEvents();
    }, []);

    return (
        <div className="flex flex-col h-full overflow-hidden">
             <SidebarGroupLabel className="flex items-center gap-2 text-orange-400 font-semibold uppercase">
                <CalendarDays className="h-4 w-4" />
                <span>Próximos Prazos</span>
            </SidebarGroupLabel>
            
            <ScrollArea className="flex-1 -mx-2 px-2 group-data-[collapsible=icon]:h-0">
                <div className="space-y-2 pb-2 group-data-[collapsible=icon]:hidden">
                    {isLoading ? (
                        Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} className="px-2 py-1.5">
                                <Skeleton className="h-4 w-full mb-1" />
                                <Skeleton className="h-3 w-1/2" />
                            </div>
                        ))
                    ) : upcomingEvents.length > 0 ? (
                        upcomingEvents.slice(0, 5).map(event => (
                            <Link href="/agenda" key={event.id}>
                                <div className="px-2 py-1.5 rounded-md hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors cursor-pointer">
                                    <p className="text-xs font-semibold text-sidebar-foreground truncate">{event.description}</p>
                                    <p className="text-[11px] text-sidebar-foreground/70">
                                        {format(parseISO(event.date), 'dd/MM/yyyy', { locale: ptBR })}
                                        {event.time && ` às ${event.time}`}
                                    </p>
                                </div>
                            </Link>
                        ))
                    ) : (
                        <div className="px-2 py-4 text-center text-xs text-sidebar-foreground/60">
                            Nenhum prazo futuro.
                        </div>
                    )}

                    {/* Exibe mais itens na barra de rolagem se houver mais de 5 */}
                    {upcomingEvents.length > 5 && (
                         <div className="space-y-2">
                            {upcomingEvents.slice(5).map(event => (
                                <Link href="/agenda" key={event.id}>
                                    <div className="px-2 py-1.5 rounded-md hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors cursor-pointer">
                                        <p className="text-xs font-semibold text-sidebar-foreground truncate">{event.description}</p>
                                        <p className="text-[11px] text-sidebar-foreground/70">
                                            {format(parseISO(event.date), 'dd/MM/yyyy', { locale: ptBR })}
                                            {event.time && ` às ${event.time}`}
                                        </p>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </ScrollArea>
        </div>
    );
}

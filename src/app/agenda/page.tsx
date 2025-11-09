
"use client";

import * as React from 'react';
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { List, ListItem } from "@/components/ui/list";
import { PlusCircle, Clock, Users, BriefcaseIcon, Edit3, Trash2 } from "lucide-react";
import { Button } from '@/components/ui/button';
import { format, isSameDay, parseISO, startOfToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { EventFormDialog, type EventFormValues, type CalendarEvent } from "@/components/agenda/EventFormDialog";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { getEvents, addEvent, updateEvent, deleteEvent } from "@/services/eventService";
import { Skeleton } from "@/components/ui/skeleton";
import { getProcesses } from '@/services/processService';
import type { Process } from '@/components/processes/ProcessFormDialog';

const getEventTypeDetails = (type: CalendarEvent['type']) => {
  switch (type) {
    case 'prazo':
      return { label: 'Prazo', color: 'bg-destructive text-destructive-foreground', icon: <Clock className="h-4 w-4" /> };
    case 'audiencia':
      return { label: 'Audiência', color: 'bg-primary text-primary-foreground', icon: <Users className="h-4 w-4" /> };
    case 'consulta':
      return { label: 'Consulta', color: 'bg-accent text-accent-foreground', icon: <BriefcaseIcon className="h-4 w-4" /> };
    default:
      return { label: 'Evento', color: 'bg-secondary text-secondary-foreground', icon: <Clock className="h-4 w-4" /> };
  }
};


export default function AgendaPage() {
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(new Date());
  const [events, setEvents] = React.useState<CalendarEvent[]>([]);
  const [processes, setProcesses] = React.useState<Process[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isFormDialogOpen, setIsFormDialogOpen] = React.useState(false);
  const [editingEvent, setEditingEvent] = React.useState<CalendarEvent | undefined>(undefined);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [eventToDelete, setEventToDelete] = React.useState<CalendarEvent | null>(null);
  const { toast } = useToast();
  
  const fetchData = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const [eventsFromDb, processesFromDb] = await Promise.all([
        getEvents(),
        getProcesses()
      ]);
      setEvents(eventsFromDb);
      setProcesses(processesFromDb);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({
        title: "Erro ao buscar dados",
        description: "Não foi possível carregar a agenda. Tente novamente mais tarde.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);


  const handleOpenFormDialog = (event?: CalendarEvent) => {
    setEditingEvent(event);
    setIsFormDialogOpen(true);
  };

  const handleCloseFormDialog = () => {
    setEditingEvent(undefined);
    setIsFormDialogOpen(false);
  };

  const handleSubmitEventForm = async (data: EventFormValues) => {
    try {
      if (editingEvent) {
        await updateEvent(editingEvent.id, data);
        toast({ title: "Evento atualizado!", description: `O evento "${data.description}" foi atualizado.` });
      } else {
        await addEvent(data);
        toast({ title: "Evento adicionado!", description: `O evento foi adicionado.` });
      }
      handleCloseFormDialog();
      fetchData(); // Re-fetch para garantir consistência
    } catch(error) {
      console.error("Failed to save event:", error);
      toast({ title: "Erro ao salvar", description: "Não foi possível salvar o evento.", variant: "destructive" });
    }
  };

  const handleDeleteConfirmation = (event: CalendarEvent) => {
    setEventToDelete(event);
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteEvent = async () => {
    if (eventToDelete) {
      try {
        await deleteEvent(eventToDelete.id);
        setEvents(events.filter(e => e.id !== eventToDelete.id));
        toast({ title: "Evento excluído!", description: `O evento "${eventToDelete.description}" foi excluído.`});
      } catch (error) {
        console.error("Failed to delete event:", error);
        toast({ title: "Erro ao excluir", description: "Não foi possível excluir o evento.", variant: "destructive" });
      } finally {
        setEventToDelete(null);
        setIsDeleteDialogOpen(false);
      }
    }
  };

  const getProcessNumberById = (processId: string) => {
    const process = processes.find(p => p.id === processId);
    return process?.processNumber || processId; // Retorna o ID se não encontrar
  };

  const eventsForSelectedDate = selectedDate
    ? events.filter(event => isSameDay(parseISO(event.date), selectedDate))
    : [];
  
  const today = startOfToday();

  const upcomingEvents = events
    .filter(event => parseISO(event.date) >= today)
    .sort((a,b) => parseISO(a.date).getTime() - parseISO(b.date).getTime())
    .slice(0, 5);

  const eventDays = events.map(event => parseISO(event.date));

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-4xl font-headline font-extrabold text-primary">Agenda</h1>
        <Button onClick={() => handleOpenFormDialog()}>
          <PlusCircle className="mr-2 h-5 w-5" /> Adicionar Evento
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 shadow-lg">
          <CardHeader>
            <CardTitle>Calendário</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              className="rounded-md border"
              locale={ptBR}
              modifiers={{ events: eventDays }}
              modifiersClassNames={{
                events: 'bg-primary/20 text-primary-foreground rounded-full',
              }}
            />
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>
              {selectedDate ? `Eventos de ${format(selectedDate, 'PPP', { locale: ptBR })}` : 'Eventos'}
            </CardTitle>
            <CardDescription>
              {selectedDate ? 'Compromissos para o dia selecionado.' : 'Selecione um dia para ver os eventos.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                </div>
            ) : eventsForSelectedDate.length > 0 ? (
              <List>
                {eventsForSelectedDate.map(event => {
                  const eventTypeDetails = getEventTypeDetails(event.type);
                  return (
                    <ListItem key={event.id} onClick={() => handleOpenFormDialog(event)} className="mb-3 p-3 border rounded-md shadow-sm hover:bg-muted/50 group cursor-pointer">
                      <div className="flex items-start space-x-3">
                        <span className={`p-2 rounded-full ${eventTypeDetails.color}`}>
                          {eventTypeDetails.icon}
                        </span>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                             <Badge variant="outline" className={eventTypeDetails.color}>{eventTypeDetails.label}</Badge>
                             {event.time && <span className="text-xs text-muted-foreground">{event.time}</span>}
                          </div>
                          <p className="font-medium">{event.description}</p>
                          {event.client && <p className="text-sm text-muted-foreground">Cliente: {event.client}</p>}
                          {event.process && <p className="text-sm text-muted-foreground">Processo: {getProcessNumberById(event.process)}</p>}
                        </div>
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button variant="ghost" size="icon" className="hover:text-accent" onClick={(e) => { e.stopPropagation(); handleOpenFormDialog(event); }}>
                                <Edit3 className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="hover:text-destructive" onClick={(e) => { e.stopPropagation(); handleDeleteConfirmation(event); }}>
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                      </div>
                    </ListItem>
                  );
                })}
              </List>
            ) : (
              <p className="text-muted-foreground">Nenhum evento para este dia.</p>
            )}
          </CardContent>
        </Card>
      </div>

       <Card className="mt-8 shadow-lg">
        <CardHeader>
          <CardTitle>Próximos Eventos</CardTitle>
          <CardDescription>Visão geral dos seus próximos compromissos.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
             <div className="space-y-3">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
          ) : upcomingEvents.length > 0 ? (
            <List>
              {upcomingEvents.map(event => {
                const eventTypeDetails = getEventTypeDetails(event.type);
                return (
                  <ListItem key={event.id} onClick={() => handleOpenFormDialog(event)} className="mb-3 p-3 border rounded-md shadow-sm hover:bg-muted/50 group cursor-pointer">
                    <div className="flex items-start space-x-3">
                      <span className={`p-2 rounded-full ${eventTypeDetails.color}`}>
                        {eventTypeDetails.icon}
                      </span>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                           <Badge variant="outline" className={eventTypeDetails.color}>{eventTypeDetails.label}</Badge>
                           <span className="text-sm font-semibold">{format(parseISO(event.date), 'dd/MM/yyyy', { locale: ptBR })}</span>
                           {event.time && <span className="text-xs text-muted-foreground">{event.time}</span>}
                        </div>
                        <p className="font-medium">{event.description}</p>
                        {event.client && <p className="text-sm text-muted-foreground">Cliente: {event.client}</p>}
                        {event.process && <p className="text-sm text-muted-foreground">Processo: {getProcessNumberById(event.process)}</p>}
                      </div>
                       <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button variant="ghost" size="icon" className="hover:text-accent" onClick={(e) => { e.stopPropagation(); handleOpenFormDialog(event); }}>
                                <Edit3 className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="hover:text-destructive" onClick={(e) => { e.stopPropagation(); handleDeleteConfirmation(event); }}>
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                  </ListItem>
                );
              })}
            </List>
          ) : (
            <p className="text-muted-foreground">Nenhum evento futuro agendado.</p>
          )}
        </CardContent>
      </Card>

      <EventFormDialog
        isOpen={isFormDialogOpen}
        onClose={handleCloseFormDialog}
        onSubmit={handleSubmitEventForm}
        eventData={editingEvent}
      />

      {eventToDelete && (
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir o evento "{eventToDelete.description}"? Esta ação não poderá ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setIsDeleteDialogOpen(false)}>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDeleteEvent} className="bg-destructive hover:bg-destructive/90">Excluir</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}

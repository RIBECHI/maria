
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

const initialEvents: CalendarEvent[] = [
  { id: '1', date: '2024-08-15', type: 'prazo', description: 'Entrega de petição inicial - Processo Alpha', process: 'PROC001', client: 'Empresa Alpha Ltda.' },
  { id: '2', date: '2024-08-15', type: 'consulta', description: 'Reunião com Sr. João Silva sobre novo caso', time: '14:00', client: 'João Silva' },
  { id: '3', date: '2024-08-22', type: 'audiencia', description: 'Audiência de conciliação - Caso Beta', time: '10:30', process: 'PROC002', client: 'Construtora Beta S.A.' },
  { id: '4', date: '2024-08-22', type: 'prazo', description: 'Prazo final para contestação - Processo Gamma', process: 'PROC003', client: 'Maria Oliveira' },
  { id: '5', date: '2024-09-01', type: 'prazo', description: 'Pagamento de custas - Processo Delta', process: 'PROC004', client: 'Empresa Delta' },
  { id: '6', date: '2024-09-05', type: 'consulta', description: 'Consulta sobre direito imobiliário com Família Z', time: '16:00', client: 'Família Z'},
];

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
  const [events, setEvents] = React.useState<CalendarEvent[]>(initialEvents);
  const [isFormDialogOpen, setIsFormDialogOpen] = React.useState(false);
  const [editingEvent, setEditingEvent] = React.useState<CalendarEvent | undefined>(undefined);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [eventToDelete, setEventToDelete] = React.useState<CalendarEvent | null>(null);
  const { toast } = useToast();

  const handleOpenFormDialog = (event?: CalendarEvent) => {
    setEditingEvent(event);
    setIsFormDialogOpen(true);
  };

  const handleCloseFormDialog = () => {
    setEditingEvent(undefined);
    setIsFormDialogOpen(false);
  };

  const handleSubmitEventForm = (data: EventFormValues) => {
    if (editingEvent) {
      setEvents(events.map(e => 
        e.id === editingEvent.id ? { ...editingEvent, ...data, date: data.date } : e // Ensure date is properly updated
      ));
      toast({ title: "Evento atualizado!", description: `O evento "${data.description}" foi atualizado.` });
    } else {
      const newEvent: CalendarEvent = {
        id: `EVT${String(events.length + 1).padStart(3, '0')}`,
        ...data,
        date: data.date, // Ensure date is properly set
      };
      setEvents([...events, newEvent]);
      toast({ title: "Evento adicionado!", description: `O evento "${newEvent.description}" foi adicionado.` });
    }
    handleCloseFormDialog();
  };

  const handleDeleteConfirmation = (event: CalendarEvent) => {
    setEventToDelete(event);
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteEvent = () => {
    if (eventToDelete) {
      setEvents(events.filter(e => e.id !== eventToDelete.id));
      toast({ title: "Evento excluído!", description: `O evento "${eventToDelete.description}" foi excluído.`});
      setEventToDelete(null);
    }
    setIsDeleteDialogOpen(false);
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
        <h1 className="text-3xl font-headline font-bold text-primary">Agenda</h1>
        <Button onClick={() => handleOpenFormDialog()}>
          <PlusCircle className="mr-2 h-5 w-5" /> Adicionar Evento
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl font-headline">Calendário</CardTitle>
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
            <CardTitle className="text-xl font-headline">
              {selectedDate ? `Eventos de ${format(selectedDate, 'PPP', { locale: ptBR })}` : 'Eventos'}
            </CardTitle>
            <CardDescription>
              {selectedDate ? 'Compromissos para o dia selecionado.' : 'Selecione um dia para ver os eventos.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {eventsForSelectedDate.length > 0 ? (
              <List>
                {eventsForSelectedDate.map(event => {
                  const eventTypeDetails = getEventTypeDetails(event.type);
                  return (
                    <ListItem key={event.id} className="mb-3 p-3 border rounded-md shadow-sm hover:bg-muted/50 group">
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
                          {event.process && <p className="text-sm text-muted-foreground">Processo: {event.process}</p>}
                        </div>
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button variant="ghost" size="icon" className="hover:text-accent" onClick={() => handleOpenFormDialog(event)}>
                                <Edit3 className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="hover:text-destructive" onClick={() => handleDeleteConfirmation(event)}>
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
          <CardTitle className="text-xl font-headline">Próximos Eventos</CardTitle>
          <CardDescription>Visão geral dos seus próximos compromissos.</CardDescription>
        </CardHeader>
        <CardContent>
          {upcomingEvents.length > 0 ? (
            <List>
              {upcomingEvents.map(event => {
                const eventTypeDetails = getEventTypeDetails(event.type);
                return (
                  <ListItem key={event.id} className="mb-3 p-3 border rounded-md shadow-sm hover:bg-muted/50 group">
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
                        {event.process && <p className="text-sm text-muted-foreground">Processo: {event.process}</p>}
                      </div>
                       <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button variant="ghost" size="icon" className="hover:text-accent" onClick={() => handleOpenFormDialog(event)}>
                                <Edit3 className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="hover:text-destructive" onClick={() => handleDeleteConfirmation(event)}>
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

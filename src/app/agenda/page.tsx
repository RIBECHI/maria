
"use client";

import * from 'react';
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { List, ListItem } from "@/components/ui/list";
import { PlusCircle, Clock, Users, BriefcaseIcon } from "lucide-react";
import { Button } from '@/components/ui/button';
import { format, isSameDay, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface CalendarEvent {
  id: string;
  date: string; // YYYY-MM-DD
  type: 'prazo' | 'audiencia' | 'consulta';
  description: string;
  time?: string; // HH:MM (optional)
  client?: string; // Optional
  process?: string; // Optional
}

const mockEvents: CalendarEvent[] = [
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

  const eventsForSelectedDate = selectedDate
    ? mockEvents.filter(event => isSameDay(parseISO(event.date), selectedDate))
    : [];
  
  const today = new Date();
  today.setHours(0,0,0,0);

  const upcomingEvents = mockEvents
    .filter(event => parseISO(event.date) >= today)
    .sort((a,b) => parseISO(a.date).getTime() - parseISO(b.date).getTime())
    .slice(0, 5);


  const eventDays = mockEvents.map(event => parseISO(event.date));

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-headline font-bold text-primary">Agenda</h1>
        <Button>
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
                    <ListItem key={event.id} className="mb-3 p-3 border rounded-md shadow-sm hover:bg-muted/50">
                      <div className="flex items-start space-x-3">
                        <span className={`p-2 rounded-full ${eventTypeDetails.color}`}>
                          {eventTypeDetails.icon}
                        </span>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                             <Badge variant="outline" className={eventTypeDetails.color}>{eventTypeDetails.label}</Badge>
                             {event.time && <span className="text-xs text-muted-foreground">{event.time}</span>}
                          </div>
                          <p className="font-medium">{event.description}</p>
                          {event.client && <p className="text-sm text-muted-foreground">Cliente: {event.client}</p>}
                          {event.process && <p className="text-sm text-muted-foreground">Processo: {event.process}</p>}
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
                  <ListItem key={event.id} className="mb-3 p-3 border rounded-md shadow-sm hover:bg-muted/50">
                    <div className="flex items-start space-x-3">
                      <span className={`p-2 rounded-full ${eventTypeDetails.color}`}>
                        {eventTypeDetails.icon}
                      </span>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                           <Badge variant="outline" className={eventTypeDetails.color}>{eventTypeDetails.label}</Badge>
                           <span className="text-sm font-semibold">{format(parseISO(event.date), 'dd/MM/yyyy', { locale: ptBR })}</span>
                           {event.time && <span className="text-xs text-muted-foreground">{event.time}</span>}
                        </div>
                        <p className="font-medium">{event.description}</p>
                        {event.client && <p className="text-sm text-muted-foreground">Cliente: {event.client}</p>}
                        {event.process && <p className="text-sm text-muted-foreground">Processo: {event.process}</p>}
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
    </div>
  );
}

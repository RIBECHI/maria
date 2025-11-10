
"use client";

import * as React from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
  } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
  } from "@/components/ui/select";
import type { Process, TimelineEvent } from "./ProcessFormDialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Briefcase, Calendar, CheckCircle, Edit, Info, Loader2, PlusCircle, Trash2, XCircle } from "lucide-react";
import { format, parseISO } from 'date-fns';
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
import { addEvent } from "@/services/eventService";
import { Checkbox } from "../ui/checkbox";
  

const getStatusBadgeVariant = (status: string) => {
  switch (status) {
    case "Em Andamento": return "default";
    case "Concluído": return "secondary"; 
    case "Suspenso": return "outline";
    default: return "outline";
  }
};

const timelineEventSchema = z.object({
    eventDate: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Data inválida." }),
    eventDescription: z.string().min(5, { message: "A descrição deve ter pelo menos 5 caracteres." }),
    eventSource: z.enum(['Resumo de E-mail PROJUDI', 'Nota Manual', 'Prazo', 'Audiência', 'Outro']),
    isTask: z.boolean().optional(),
});
type TimelineEventFormValues = z.infer<typeof timelineEventSchema>;

interface ProcessDetailsSheetProps {
  isOpen: boolean;
  onClose: () => void;
  processData: Process | null;
  onTimelineUpdate: (processId: string, newTimeline: TimelineEvent[]) => Promise<void>;
  onOpenEditDialog: (process: Process) => void;
}

export function ProcessDetailsSheet({ isOpen, onClose, processData, onTimelineUpdate, onOpenEditDialog }: ProcessDetailsSheetProps) {
  const [currentTimeline, setCurrentTimeline] = React.useState<TimelineEvent[]>([]);
  const [timelineEventToDelete, setTimelineEventToDelete] = React.useState<TimelineEvent | null>(null);
  const [isDeleteTimelineAlertOpen, setIsDeleteTimelineAlertOpen] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const { toast } = useToast();

  const timelineForm = useForm<TimelineEventFormValues>({
    resolver: zodResolver(timelineEventSchema),
    defaultValues: {
      eventDate: format(new Date(), 'yyyy-MM-dd'),
      eventDescription: "",
      eventSource: "Nota Manual",
      isTask: false,
    },
  });

  React.useEffect(() => {
    if (processData) {
      setCurrentTimeline(
        (processData.timeline || []).sort((a, b) => parseISO(b.date).getTime() - parseISO(a.date).getTime())
      );
    } else {
      setCurrentTimeline([]);
    }
  }, [processData]);

  if (!processData) {
    return null;
  }

  const handleToggleTask = async (eventId: string) => {
    const newTimeline = currentTimeline.map(event =>
      event.id === eventId ? { ...event, completed: !event.completed } : event
    );
    
    await onTimelineUpdate(processData.id, newTimeline);
    setCurrentTimeline(newTimeline);
  };

  const handleAddTimelineEvent: SubmitHandler<TimelineEventFormValues> = async (data) => {
    setIsSaving(true);
    
    const newEvent: TimelineEvent = {
      id: `TL-${Date.now()}`,
      date: format(parseISO(data.eventDate + 'T00:00:00'), 'yyyy-MM-dd'),
      description: data.eventDescription,
      source: data.eventSource,
      isTask: data.isTask,
      completed: data.isTask ? false : undefined,
    };
    
    try {
      // Regra: Sempre que um evento com data futura é criado na timeline (seja tarefa ou não),
      // ele deve ser adicionado à agenda principal para visibilidade.
      const sourceLowerCase = data.eventSource.toLowerCase();
      let eventType: 'prazo' | 'audiencia' | 'consulta' | null = null;
      
      if (sourceLowerCase === 'prazo') eventType = 'prazo';
      else if (sourceLowerCase === 'audiência') eventType = 'audiencia';
      else if (sourceLowerCase === 'nota manual' || sourceLowerCase === 'outro') eventType = 'consulta';

      // Adiciona na agenda se for um tipo mapeado
      if (eventType) {
          await addEvent({
              date: newEvent.date,
              type: eventType,
              description: `[Processo: ${processData.processNumber}] ${data.eventDescription}`,
              client: processData.clients?.join(', '),
              process: processData.id,
          });
          toast({
              title: "Evento adicionado à Agenda!",
              description: "O compromisso agora também aparece na sua agenda principal.",
          });
      }
  
      const newTimeline = [newEvent, ...currentTimeline].sort((a, b) => parseISO(b.date).getTime() - parseISO(a.date).getTime());
      
      // Atualiza a linha do tempo do processo no banco de dados
      await onTimelineUpdate(processData.id, newTimeline);
  
      // Atualiza o estado local
      setCurrentTimeline(newTimeline); 
      timelineForm.reset({
        eventDate: format(new Date(), 'yyyy-MM-dd'),
        eventDescription: "",
        eventSource: "Nota Manual",
        isTask: false,
      });
      toast({ title: "Linha do tempo atualizada!" });
  
    } catch (error) {
      console.error("Failed to add timeline event or sync with agenda:", error);
      toast({
          title: "Erro ao Salvar Evento",
          description: "Não foi possível adicionar o evento à linha do tempo ou à agenda.",
          variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteTimelineEvent = (eventId: string) => {
    const event = currentTimeline.find(e => e.id === eventId);
    if (event) {
      setTimelineEventToDelete(event);
      setIsDeleteTimelineAlertOpen(true);
    }
  };

  const confirmDeleteTimelineEvent = async () => {
    if (timelineEventToDelete) {
      setIsSaving(true);
      const newTimeline = currentTimeline.filter(e => e.id !== timelineEventToDelete.id);
      await onTimelineUpdate(processData.id, newTimeline);
      setCurrentTimeline(newTimeline);
      setIsSaving(false);
    }
    setTimelineEventToDelete(null);
    setIsDeleteTimelineAlertOpen(false);
  };

  const handleOpenEdit = () => {
    onClose(); 
    onOpenEditDialog(processData);
  }

  return (
    <>
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent side="left" className="w-full sm:max-w-xl flex flex-col">
          <SheetHeader className="pr-10">
            <SheetTitle className="text-primary truncate">{processData.processNumber}</SheetTitle>
            <SheetDescription>
              Detalhes e linha do tempo do processo.
            </SheetDescription>
          </SheetHeader>
          <ScrollArea className="flex-1 -mx-6 px-6">
            {/* Detalhes do Processo */}
            <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                    <div className="flex items-center gap-2 text-foreground">
                        <Briefcase className="h-4 w-4 text-muted-foreground" />
                        <strong>Cliente(s):</strong>
                        <span className="truncate">{(processData.clients || []).join(', ')}</span>
                    </div>
                    <div className="flex items-center gap-2 text-foreground">
                        <Info className="h-4 w-4 text-muted-foreground" />
                        <strong>Tipo:</strong>
                        <span>{processData.type}</span>
                    </div>
                    <div className="flex items-center gap-2 text-foreground">
                         <Badge variant={getStatusBadgeVariant(processData.status) as any}>{processData.status}</Badge>
                    </div>
                     <div className="flex items-center gap-2 text-foreground">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <strong>Próximo Prazo:</strong>
                        <span>{processData.nextDeadline && processData.nextDeadline !== '-' ? format(parseISO(processData.nextDeadline), 'dd/MM/yyyy') : 'N/A'}</span>
                    </div>
                    {processData.expressoGoias && (
                        <div className="col-span-2 flex items-center gap-2 text-green-600 font-medium">
                            <CheckCircle className="h-4 w-4" />
                            <span>Pedido de pagamento no Expresso Goiás</span>
                        </div>
                    )}
                </div>

                {/* Adicionar Evento na Timeline */}
                <div className="pt-4 border-t">
                    <h3 className="font-semibold text-foreground mb-3">Adicionar à Linha do Tempo</h3>
                    <Form {...timelineForm}>
                        <div className="space-y-3 p-4 border rounded-md bg-background">
                            <FormField
                                control={timelineForm.control}
                                name="eventDescription"
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="sr-only">Descrição</FormLabel>
                                    <FormControl>
                                    <Textarea placeholder="Descreva a nova atualização..." {...field} rows={2}/>
                                    </FormControl>
                                    <FormMessage className="text-xs" />
                                </FormItem>
                                )}
                            />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-end">
                                <FormField
                                    control={timelineForm.control}
                                    name="eventDate"
                                    render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-xs text-muted-foreground">Data do Evento</FormLabel>
                                        <FormControl>
                                        <Input type="date" {...field} />
                                        </FormControl>
                                        <FormMessage className="text-xs" />
                                    </FormItem>
                                    )}
                                />
                                <FormField
                                    control={timelineForm.control}
                                    name="eventSource"
                                    render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-xs text-muted-foreground">Origem</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                <SelectValue placeholder="Selecione a origem" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="Resumo de E-mail PROJUDI">E-mail PROJUDI</SelectItem>
                                                <SelectItem value="Nota Manual">Nota Manual</SelectItem>
                                                <SelectItem value="Prazo">Prazo</SelectItem>
                                                <SelectItem value="Audiência">Audiência</SelectItem>
                                                <SelectItem value="Outro">Outro</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage className="text-xs" />
                                    </FormItem>
                                    )}
                                />
                            </div>
                            <div className="flex items-center justify-between pt-2">
                                <FormField
                                    control={timelineForm.control}
                                    name="isTask"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                                            <FormControl>
                                                <Checkbox
                                                checked={field.value}
                                                onCheckedChange={field.onChange}
                                                id="is-task-sheet"
                                                />
                                            </FormControl>
                                            <FormLabel htmlFor="is-task-sheet" className="text-sm font-normal">
                                                É uma tarefa pendente?
                                            </FormLabel>
                                        </FormItem>
                                    )}
                                />
                                <Button 
                                    type="button" 
                                    size="sm" 
                                    onClick={timelineForm.handleSubmit(handleAddTimelineEvent)}
                                    disabled={isSaving}
                                >
                                    {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlusCircle className="mr-2 h-4 w-4" />}
                                    Adicionar
                                </Button>
                            </div>
                        </div>
                    </Form>
                </div>


                {/* Lista da Linha do Tempo */}
                <div className="pt-4 border-t">
                    <h3 className="font-semibold text-foreground mb-3">Histórico do Processo</h3>
                    {currentTimeline.length > 0 ? (
                        <div className="space-y-3">
                            {currentTimeline.map(event => (
                            <div key={event.id} className="p-3 border rounded-md bg-muted/30 shadow-sm relative group">
                                <div className="flex justify-between items-start gap-2">
                                    {event.isTask ? (
                                        <div className="flex items-start gap-3 flex-1 pt-1">
                                            <Checkbox
                                                id={`task-sheet-${event.id}`}
                                                checked={event.completed}
                                                onCheckedChange={() => handleToggleTask(event.id)}
                                                aria-label="Marcar tarefa como concluída"
                                            />
                                            <div className="flex-1">
                                                <label
                                                    htmlFor={`task-sheet-${event.id}`}
                                                    className={`text-sm ${event.completed ? 'line-through text-muted-foreground' : ''}`}
                                                >
                                                    {event.description}
                                                </label>
                                                <p className={`text-xs text-muted-foreground mt-1 ${event.completed ? 'line-through' : ''}`}>
                                                    {format(parseISO(event.date), "dd/MM/yyyy")} - <strong>{event.source}</strong>
                                                </p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex-1">
                                            <p className="text-xs text-muted-foreground font-medium">{format(parseISO(event.date), "dd/MM/yyyy")} - <strong>{event.source}</strong></p>
                                            <p className="text-sm mt-1 whitespace-pre-wrap">{event.description}</p>
                                        </div>
                                    )}
                                    <Button variant="ghost" size="icon" className="absolute top-1 right-1 text-destructive hover:text-destructive/80 h-7 w-7 opacity-0 group-hover:opacity-100" onClick={() => handleDeleteTimelineEvent(event.id)} disabled={isSaving}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                            ))}
                        </div>
                        ) : (
                        <p className="text-sm text-muted-foreground text-center py-4">Nenhum evento na linha do tempo.</p>
                    )}
                </div>
            </div>
          </ScrollArea>
          <SheetFooter>
            <Button variant="outline" onClick={onClose}>Fechar</Button>
            <Button onClick={handleOpenEdit}><Edit className="mr-2 h-4 w-4" /> Editar Processo Completo</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {timelineEventToDelete && (
        <AlertDialog open={isDeleteTimelineAlertOpen} onOpenChange={setIsDeleteTimelineAlertOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir este evento da linha do tempo?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setIsDeleteTimelineAlertOpen(false)}>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDeleteTimelineEvent} className="bg-destructive hover:bg-destructive/90">Excluir</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  );
}



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
import { Briefcase, Calendar, CheckCircle, Edit, Info, Loader2, PlusCircle, Trash2, XCircle, Save, Link2 } from "lucide-react";
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
import { getProcesses } from "@/services/processService";
  

const getPhaseBadgeVariant = (phaseName?: string) => {
  if (!phaseName) return "outline";
  const lowerCaseName = phaseName.toLowerCase();
  if (lowerCaseName.includes('concluído')) return 'secondary';
  if (lowerCaseName.includes('suspenso') || lowerCaseName.includes('aguardando')) return 'outline';
  return 'default';
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
  onApensoClick?: (apensoNumber: string) => void;
}

export function ProcessDetailsSheet({ isOpen, onClose, processData, onTimelineUpdate, onOpenEditDialog, onApensoClick }: ProcessDetailsSheetProps) {
  const [currentTimeline, setCurrentTimeline] = React.useState<TimelineEvent[]>([]);
  const [timelineEventToDelete, setTimelineEventToDelete] = React.useState<TimelineEvent | null>(null);
  const [editingEventId, setEditingEventId] = React.useState<string | null>(null);
  const [isDeleteTimelineAlertOpen, setIsDeleteTimelineAlertOpen] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const [allProcesses, setAllProcesses] = React.useState<Process[]>([]);

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
    if (isOpen) {
        // Busca todos os processos para poder navegar para os apensos
        getProcesses().then(setAllProcesses);
    }
}, [isOpen]);

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
  
  const resetForm = () => {
    timelineForm.reset({
      eventDate: format(new Date(), 'yyyy-MM-dd'),
      eventDescription: "",
      eventSource: "Nota Manual",
      isTask: false,
    });
    setEditingEventId(null);
  };
  
  const handleTimelineSubmit: SubmitHandler<TimelineEventFormValues> = async (data) => {
    setIsSaving(true);
    let newTimeline: TimelineEvent[];

    if (editingEventId) {
      // Logic for updating an existing event
      newTimeline = currentTimeline.map(event => {
        if (event.id === editingEventId) {
          return {
            ...event,
            date: format(parseISO(data.eventDate + 'T00:00:00'), 'yyyy-MM-dd'),
            description: data.eventDescription,
            source: data.eventSource,
            isTask: data.isTask,
            // Preserve completed status if it's a task, otherwise remove it
            completed: data.isTask ? event.completed ?? false : undefined,
          };
        }
        return event;
      });
      toast({ title: "Evento da timeline atualizado!" });
    } else {
      // Logic for adding a new event
      const newEvent: TimelineEvent = {
        id: `TL-${Date.now()}`,
        date: format(parseISO(data.eventDate + 'T00:00:00'), 'yyyy-MM-dd'),
        description: data.eventDescription,
        source: data.eventSource,
        isTask: data.isTask,
        completed: data.isTask ? false : undefined,
      };
      
      newTimeline = [newEvent, ...currentTimeline];
      
      // Sync with main agenda if it's a future event
      const sourceLowerCase = data.eventSource.toLowerCase();
      let eventType: 'prazo' | 'audiencia' | 'consulta' | null = null;
      if (sourceLowerCase === 'prazo') eventType = 'prazo';
      else if (sourceLowerCase === 'audiência') eventType = 'audiencia';
      else if (sourceLowerCase === 'nota manual' || sourceLowerCase === 'outro') eventType = 'consulta';

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
      toast({ title: "Linha do tempo atualizada!" });
    }

    const sortedTimeline = newTimeline.sort((a, b) => parseISO(b.date).getTime() - parseISO(a.date).getTime());
    
    try {
      await onTimelineUpdate(processData.id, sortedTimeline);
      setCurrentTimeline(sortedTimeline);
      resetForm();
    } catch (error) {
      console.error("Failed to update timeline:", error);
      toast({
          title: "Erro ao Salvar",
          description: "Não foi possível salvar a atualização da linha do tempo.",
          variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditTimelineEvent = (event: TimelineEvent) => {
    setEditingEventId(event.id);
    timelineForm.reset({
      eventDate: format(parseISO(event.date + 'T00:00:00'), 'yyyy-MM-dd'),
      eventDescription: event.description,
      eventSource: event.source,
      isTask: event.isTask ?? false,
    });
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

  const handleInternalApensoClick = (apensoNumber: string) => {
    if (onApensoClick) {
        onApensoClick(apensoNumber);
    } else {
        const apensoProcess = allProcesses.find(p => p.processNumber === apensoNumber);
        if (apensoProcess) {
            // Se a função não foi passada, recria a lógica localmente
            // (Isso é um fallback, o ideal é a página pai controlar)
            // Esta parte é complexa de gerenciar sem props drilling,
            // então usamos o onOpenEditDialog como um exemplo de ação.
            onOpenEditDialog(apensoProcess);
        } else {
            toast({
                title: "Processo Apenso Não Encontrado",
                variant: "destructive"
            });
        }
    }
  };

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
                    <div className="flex items-center gap-2 text-foreground col-span-2">
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
                         <Badge variant={getPhaseBadgeVariant(processData.phaseName)}>{processData.phaseName}</Badge>
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

                {/* Seção de Apensos */}
                {processData.apensos && processData.apensos.length > 0 && (
                    <div className="pt-4 border-t">
                        <h4 className="font-semibold mb-2 flex items-center gap-2">
                            <Link2 className="h-4 w-4 text-muted-foreground" />
                            Processos Apensos
                        </h4>
                        <div className="flex flex-wrap gap-2">
                            {processData.apensos.map(apenso => (
                                <Button
                                    key={apenso}
                                    variant="secondary"
                                    size="sm"
                                    className="h-auto px-2 py-0.5"
                                    onClick={() => handleInternalApensoClick(apenso)}
                                >
                                    {apenso}
                                </Button>
                            ))}
                        </div>
                    </div>
                )}


                {/* Adicionar Evento na Timeline */}
                <div className="pt-4 border-t">
                    <h3 className="font-semibold text-foreground mb-3">{editingEventId ? "Editando Evento" : "Adicionar à Linha do Tempo"}</h3>
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
                                <div className="flex gap-2">
                                  {editingEventId && (
                                    <Button variant="ghost" size="sm" onClick={resetForm} disabled={isSaving}>
                                      Cancelar Edição
                                    </Button>
                                  )}
                                  <Button 
                                      type="button" 
                                      size="sm" 
                                      onClick={timelineForm.handleSubmit(handleTimelineSubmit)}
                                      disabled={isSaving}
                                  >
                                      {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : (editingEventId ? <Save className="mr-2 h-4 w-4" /> : <PlusCircle className="mr-2 h-4 w-4" />)}
                                      {editingEventId ? "Salvar" : "Adicionar"}
                                  </Button>
                                </div>
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
                                    <div className="absolute top-1 right-1 flex opacity-0 group-hover:opacity-100 transition-opacity">
                                      <Button variant="ghost" size="icon" className="text-accent-foreground hover:text-accent h-7 w-7" onClick={() => handleEditTimelineEvent(event)} disabled={isSaving}>
                                          <Edit className="h-4 w-4" />
                                      </Button>
                                      <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive/80 h-7 w-7" onClick={() => handleDeleteTimelineEvent(event.id)} disabled={isSaving}>
                                          <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </div>
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

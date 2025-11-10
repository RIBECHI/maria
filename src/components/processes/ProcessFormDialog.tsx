
"use client";

import * as React from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription as FormDescriptionUI,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, PlusCircle, Trash2, Search, UserPlus, X } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardDescription as CardTimelineDescription, CardHeader, CardTitle as CardTimelineTitle } from "@/components/ui/card";
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
import { useToast } from "@/hooks/use-toast";
import { ClientSearchDialog } from "@/components/clients/ClientSearchDialog";
import { ClientFormDialog, type ClientFormValues } from "@/components/clients/ClientFormDialog";
import { addClient } from "@/services/clientService";
import { Checkbox } from "@/components/ui/checkbox";
import type { DocumentData } from "firebase/firestore";
import { Badge } from "@/components/ui/badge";
import { getPhases, type Phase } from "@/services/phaseService";

export interface TimelineEvent {
  id: string;
  date: string; // YYYY-MM-DD
  description: string;
  source: 'Resumo de E-mail PROJUDI' | 'Nota Manual' | 'Prazo' | 'Audiência' | 'Outro';
  isTask?: boolean;
  completed?: boolean;
}

export interface Process extends DocumentData {
  id: string;
  processNumber: string;
  clients: string[];
  type: string;
  status: 'Em Andamento' | 'Concluído' | 'Suspenso';
  phaseId?: string | null;
  comarca?: string;
  nextDeadline: string; // YYYY-MM-DD or '-'
  documents: number;
  expressoGoias?: boolean;
  uhd?: number;
  certidao?: boolean;
  apensos?: string[];
  timeline: TimelineEvent[];
  createdAt?: string;
  client?: string; // Campo legado para compatibilidade
}

const processFormSchema = z.object({
  processNumber: z.string().min(5, { message: "O número do processo é obrigatório e deve ter pelo menos 5 caracteres." }),
  clients: z.array(z.string()).min(1, { message: "O processo deve ter pelo menos um cliente." }),
  type: z.string().min(3, { message: "O tipo do processo deve ter pelo menos 3 caracteres." }),
  comarca: z.string().optional(),
  status: z.enum(['Em Andamento', 'Concluído', 'Suspenso'], { required_error: "Status é obrigatório."}),
  nextDeadline: z.string().refine((val) => val === '-' || !isNaN(Date.parse(val)), { message: "Data inválida ou '-'." }),
  expressoGoias: z.boolean().optional(),
  uhd: z.coerce.number().min(1, "UHD deve ser no mínimo 1").max(10, "UHD deve ser no máximo 10").optional(),
  certidao: z.boolean().optional(),
  apensos: z.array(z.string()).optional(),
  phaseId: z.string().nullable().optional(),
});

export type ProcessFormValues = z.infer<typeof processFormSchema>;

const timelineEventSchema = z.object({
  eventDate: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Data inválida." }),
  eventDescription: z.string().min(5, { message: "A descrição deve ter pelo menos 5 caracteres." }),
  eventSource: z.enum(['Resumo de E-mail PROJUDI', 'Nota Manual', 'Prazo', 'Audiência', 'Outro']),
  isTask: z.boolean().optional(),
});
type TimelineEventFormValues = z.infer<typeof timelineEventSchema>;


interface ProcessFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ProcessFormValues & { timeline?: TimelineEvent[] }) => void;
  processData?: Process;
}

export function ProcessFormDialog({ isOpen, onClose, onSubmit, processData }: ProcessFormDialogProps) {
  const [isLoading, setIsLoading] = React.useState(false);
  const [currentTimeline, setCurrentTimeline] = React.useState<TimelineEvent[]>([]);
  const [timelineEventToDelete, setTimelineEventToDelete] = React.useState<TimelineEvent | null>(null);
  const [isDeleteTimelineAlertOpen, setIsDeleteTimelineAlertOpen] = React.useState(false);
  const [isClientSearchOpen, setIsClientSearchOpen] = React.useState(false);
  const [isNewClientDialogOpen, setIsNewClientDialogOpen] = React.useState(false);
  const [apensoInput, setApensoInput] = React.useState('');
  const [phases, setPhases] = React.useState<Phase[]>([]);
  const { toast } = useToast();

  const form = useForm<ProcessFormValues>({
    resolver: zodResolver(processFormSchema),
    defaultValues: {
      processNumber: "",
      clients: [],
      type: "",
      comarca: "",
      status: "Em Andamento",
      nextDeadline: format(new Date(), 'yyyy-MM-dd'),
      expressoGoias: false,
      uhd: undefined,
      certidao: false,
      apensos: [],
      phaseId: undefined,
    },
  });

  const timelineForm = useForm<TimelineEventFormValues>({
    resolver: zodResolver(timelineEventSchema),
    defaultValues: {
      eventDate: format(new Date(), 'yyyy-MM-dd'),
      eventDescription: "",
      eventSource: "Nota Manual",
      isTask: false,
    },
  });
  
  const apensos = form.watch('apensos') || [];
  const clients = form.watch('clients') || [];
  
  React.useEffect(() => {
    async function loadPhases() {
      if(isOpen) {
        try {
          const phasesData = await getPhases();
          setPhases(phasesData);
        } catch (error) {
            console.error("Failed to load phases", error);
            toast({ title: "Erro ao carregar fases do pipeline", variant: "destructive" });
        }
      }
    }
    loadPhases();
  }, [isOpen, toast]);

  React.useEffect(() => {
     if (isOpen) {
        if (processData) {
            form.reset({
              processNumber: processData.processNumber,
              clients: processData.clients || (processData.client ? [processData.client] : []),
              type: processData.type,
              comarca: processData.comarca || "",
              status: processData.status,
              nextDeadline: processData.nextDeadline === '-' ? '' : format(parseISO(processData.nextDeadline + 'T00:00:00'), 'yyyy-MM-dd'),
              expressoGoias: processData.expressoGoias || false,
              uhd: processData.uhd || undefined,
              certidao: processData.certidao || false,
              apensos: processData.apensos || [],
              phaseId: processData.phaseId || undefined,
            });
            setCurrentTimeline((processData.timeline || []).sort((a, b) => parseISO(b.date).getTime() - parseISO(a.date).getTime()));
        } else {
            form.reset({
              processNumber: "",
              clients: [],
              type: "",
              comarca: "",
              status: "Em Andamento",
              nextDeadline: format(new Date(), 'yyyy-MM-dd'),
              expressoGoias: false,
              uhd: undefined,
              certidao: false,
              apensos: [],
              phaseId: undefined,
            });
            setCurrentTimeline([]);
        }
        timelineForm.reset({
          eventDate: format(new Date(), 'yyyy-MM-dd'),
          eventDescription: "",
          eventSource: "Nota Manual",
          isTask: false,
        });
    }
  }, [processData, form, timelineForm, isOpen]);

  const handleAddTimelineEvent: SubmitHandler<TimelineEventFormValues> = (data) => {
    const newEvent: TimelineEvent = {
      id: `TL-${Date.now()}`,
      date: format(parseISO(data.eventDate + 'T00:00:00'), 'yyyy-MM-dd'),
      description: data.eventDescription,
      source: data.eventSource,
      isTask: data.isTask,
      completed: data.isTask ? false : undefined, // Só é 'false' se for uma tarefa
    };
    setCurrentTimeline(prev => [newEvent, ...prev].sort((a, b) => parseISO(b.date).getTime() - parseISO(a.date).getTime()));
    timelineForm.reset({
      eventDate: format(new Date(), 'yyyy-MM-dd'),
      eventDescription: "",
      eventSource: "Nota Manual",
      isTask: false,
    });
    toast({ title: "Evento adicionado à linha do tempo!" });
  };

  const handleDeleteTimelineEvent = (eventId: string) => {
    const event = currentTimeline.find(e => e.id === eventId);
    if (event) {
      setTimelineEventToDelete(event);
      setIsDeleteTimelineAlertOpen(true);
    }
  };

  const confirmDeleteTimelineEvent = () => {
    if (timelineEventToDelete) {
      setCurrentTimeline(prev => prev.filter(e => e.id !== timelineEventToDelete.id));
      toast({ title: "Evento removido da linha do tempo." });
    }
    setTimelineEventToDelete(null);
    setIsDeleteTimelineAlertOpen(false);
  };

    const handleToggleTask = (eventId: string) => {
        setCurrentTimeline(prev =>
            prev.map(event =>
                event.id === eventId
                    ? { ...event, completed: !event.completed }
                    : event
            )
        );
    };

  const handleFormSubmit: SubmitHandler<ProcessFormValues> = async (data) => {
    setIsLoading(true);
    const deadline = data.nextDeadline === '' || data.nextDeadline === '-' ? '-' : format(parseISO(data.nextDeadline + 'T00:00:00'), 'yyyy-MM-dd');
    onSubmit({ ...data, nextDeadline: deadline, timeline: currentTimeline });
    setIsLoading(false);
  };
  
  const handleDialogClose = () => {
    if (!isLoading) {
      onClose();
    }
  };

  const handleClientSelected = (clientName: string) => {
    if (!clients.includes(clientName)) {
        form.setValue("clients", [...clients, clientName]);
    }
    setIsClientSearchOpen(false);
  };

  const handleAddNewClient = async (data: ClientFormValues) => {
    try {
        const newClient = await addClient({
          ...data,
          caseCount: 0,
          lastActivity: new Date().toISOString().split('T')[0],
        });
        toast({ title: "Cliente adicionado!", description: `O cliente ${newClient.name} foi adicionado com sucesso.` });
        if (!clients.includes(newClient.name)) {
            form.setValue('clients', [...clients, newClient.name]); // Preenche o campo de cliente no formulário do processo
        }
        setIsNewClientDialogOpen(false); // Fecha o dialog de novo cliente
      } catch (error) {
          console.error("Failed to save client: ", error);
          toast({ title: "Erro ao salvar", description: "Não foi possível salvar o cliente.", variant: "destructive" });
      }
  };

  const handleApensoKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const newApenso = apensoInput.trim();
      if (newApenso && !apensos.includes(newApenso)) {
        form.setValue('apensos', [...apensos, newApenso]);
      }
      setApensoInput('');
    }
  };

  const removeApenso = (apensoToRemove: string) => {
    form.setValue('apensos', apensos.filter(apenso => apenso !== apensoToRemove));
  };
  
  const removeClient = (clientToRemove: string) => {
    form.setValue('clients', clients.filter(client => client !== clientToRemove));
  };


  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && handleDialogClose()}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="text-primary">{processData ? "Editar Processo" : "Adicionar Novo Processo"}</DialogTitle>
            <DialogDescription>
              {processData ? "Altere os dados do processo abaixo." : "Preencha os dados para cadastrar um novo processo."}
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="pr-6 -mr-6 max-h-[calc(80vh-150px)]">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4 py-4 pr-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="processNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Número do Processo</FormLabel>
                        <FormControl>
                          <Input placeholder="0000000-00.0000.0.00.0000" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormItem>
                    <FormLabel>Apensos (Opcional)</FormLabel>
                    <FormControl>
                      <div className="flex flex-col">
                        <Input 
                          placeholder="Digite o nº do processo e tecle Enter" 
                          value={apensoInput}
                          onChange={e => setApensoInput(e.target.value)}
                          onKeyDown={handleApensoKeyDown}
                        />
                         <FormDescriptionUI>Adicione múltiplos processos externos.</FormDescriptionUI>
                      </div>
                    </FormControl>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {apensos.map((apenso) => (
                        <Badge key={apenso} variant="secondary" className="flex items-center gap-1">
                          {apenso}
                          <button type="button" onClick={() => removeApenso(apenso)} className="rounded-full hover:bg-destructive/20">
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                     <FormMessage />
                  </FormItem>
              </div>
               <FormField
                  control={form.control}
                  name="clients"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Clientes</FormLabel>
                      <div className="flex items-center gap-2">
                         <div className="flex flex-wrap gap-2 p-2 border rounded-md min-h-10 w-full bg-background">
                              {clients.length > 0 ? (
                                  clients.map((client) => (
                                  <Badge key={client} variant="default" className="flex items-center gap-1">
                                      {client}
                                      <button type="button" onClick={() => removeClient(client)} className="rounded-full hover:bg-primary-foreground/20">
                                      <X className="h-3 w-3" />
                                      </button>
                                  </Badge>
                                  ))
                              ) : (
                                  <span className="text-sm text-muted-foreground px-1">Selecione ou adicione um cliente</span>
                              )}
                         </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => setIsClientSearchOpen(true)}
                          aria-label="Buscar cliente"
                        >
                          <Search className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => setIsNewClientDialogOpen(true)}
                          aria-label="Adicionar novo cliente"
                        >
                          <UserPlus className="h-4 w-4" />
                        </Button>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Processo</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Cível, Trabalhista, Tributário" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="comarca"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Comarca</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Goiânia, Anápolis" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                      <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                          <SelectTrigger>
                              <SelectValue placeholder="Selecione o status" />
                          </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                          <SelectItem value="Em Andamento">Em Andamento</SelectItem>
                          <SelectItem value="Concluído">Concluído</SelectItem>
                          <SelectItem value="Suspenso">Suspenso</SelectItem>
                          </SelectContent>
                      </Select>
                      <FormMessage />
                      </FormItem>
                  )}
                  />
                  <FormField
                  control={form.control}
                  name="nextDeadline"
                  render={({ field }) => (
                      <FormItem>
                      <FormLabel>Próximo Prazo</FormLabel>
                      <FormControl>
                          <Input type="date" {...field} onChange={(e) => field.onChange(e.target.value || '-')} />
                      </FormControl>
                      <FormMessage />
                      </FormItem>
                  )}
                  />
                   <FormField
                    control={form.control}
                    name="phaseId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fase do Pipeline</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ""} defaultValue={field.value || ""}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione uma fase" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="">Não Classificado</SelectItem>
                            {phases.map(phase => (
                              <SelectItem key={phase.id} value={phase.id}>{phase.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
              </div>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                      control={form.control}
                      name="uhd"
                      render={({ field }) => (
                          <FormItem>
                          <FormLabel>UHD</FormLabel>
                          <FormControl>
                              <Input type="number" min="1" max="10" placeholder="1-10" {...field} onChange={e => field.onChange(e.target.valueAsNumber)} />
                          </FormControl>
                          <FormMessage />
                          </FormItem>
                      )}
                  />
                  <FormField
                      control={form.control}
                      name="certidao"
                      render={({ field }) => (
                          <FormItem className="flex flex-row items-end space-x-3 rounded-md border p-3 h-[72px]">
                          <FormControl>
                              <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              id="certidao"
                              />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                              <FormLabel htmlFor="certidao">
                                  Certidão
                              </FormLabel>
                              <FormMessage />
                          </div>
                          </FormItem>
                      )}
                  />
               </div>
               <FormField
                  control={form.control}
                  name="expressoGoias"
                  render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm mt-4">
                      <div className="space-y-0.5">
                          <FormLabel>Pedido pagamento no Expresso Goiás</FormLabel>
                      </div>
                      <FormControl>
                          <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          />
                      </FormControl>
                      </FormItem>
                  )}
                  />
              
              {/* Seção da Linha do Tempo */}
              <Card className="mt-6 pt-2">
                <CardHeader>
                  <CardTimelineTitle className="text-lg font-headline text-foreground">Linha do Tempo do Processo</CardTimelineTitle>
                  <CardTimelineDescription>Adicione e visualize eventos importantes do processo.</CardTimelineDescription>
                </CardHeader>
                <CardContent>
                  <Form {...timelineForm}>
                    <div className="space-y-3 mb-6 p-4 border rounded-md">
                       <FormField
                          control={timelineForm.control}
                          name="eventDescription"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm">Descrição do Evento</FormLabel>
                              <FormControl>
                                <Textarea placeholder="Descreva o evento, atualização ou nota..." {...field} rows={2}/>
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
                              <FormLabel className="text-sm">Data do Evento</FormLabel>
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
                              <FormLabel className="text-sm">Origem</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Selecione a origem" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="Resumo de E-mail PROJUDI">Resumo de E-mail PROJUDI</SelectItem>
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
                                          id="is-task"
                                          />
                                      </FormControl>
                                      <FormLabel htmlFor="is-task" className="text-sm font-normal">
                                          É uma tarefa pendente?
                                      </FormLabel>
                                  </FormItem>
                              )}
                          />
                          <Button 
                            type="button" 
                            size="sm" 
                            onClick={timelineForm.handleSubmit(handleAddTimelineEvent)}
                          >
                            <PlusCircle className="mr-2 h-4 w-4" /> Adicionar
                          </Button>
                      </div>
                    </div>
                  </Form>

                  {currentTimeline.length > 0 ? (
                    <div className="space-y-3 max-h-60 overflow-y-auto">
                      {currentTimeline.map(event => (
                        <div key={event.id} className="p-3 border rounded-md bg-muted/30 shadow-sm">
                          <div className="flex justify-between items-start gap-2">
                            {event.isTask ? (
                              <div className="flex items-start gap-3 flex-1 pt-1">
                                  <Checkbox 
                                      id={`task-${event.id}`} 
                                      checked={event.completed}
                                      onCheckedChange={() => handleToggleTask(event.id)}
                                      aria-label="Marcar tarefa como concluída"
                                  />
                                  <div className="flex-1">
                                      <label 
                                          htmlFor={`task-${event.id}`}
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
                              <div>
                                  <p className="text-xs text-muted-foreground">{format(parseISO(event.date), "dd/MM/yyyy")} - <strong>{event.source}</strong></p>
                                  <p className="text-sm mt-1">{event.description}</p>
                              </div>
                            )}

                            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive/80 h-7 w-7 shrink-0" onClick={() => handleDeleteTimelineEvent(event.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">Nenhum evento na linha do tempo.</p>
                  )}
                </CardContent>
              </Card>
              <DialogFooter className="sticky bottom-0 bg-background py-4 border-t z-10">
                <Button type="button" variant="outline" onClick={handleDialogClose} disabled={isLoading}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    processData ? "Salvar Alterações" : "Adicionar Processo"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <ClientSearchDialog
        isOpen={isClientSearchOpen}
        onClose={() => setIsClientSearchOpen(false)}
        onClientSelected={handleClientSelected}
      />

      <ClientFormDialog
        isOpen={isNewClientDialogOpen}
        onClose={() => setIsNewClientDialogOpen(false)}
        onSubmit={handleAddNewClient}
      />

      {timelineEventToDelete && (
          <AlertDialog open={isDeleteTimelineAlertOpen} onOpenChange={setIsDeleteTimelineAlertOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                <AlertDialogDescription>
                  Tem certeza que deseja excluir este evento da linha do tempo?
                  <br />
                  "{timelineEventToDelete.description.substring(0,50)}..."
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

    

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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, PlusCircle, Trash2 } from "lucide-react";
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

export interface TimelineEvent {
  id: string;
  date: string; // YYYY-MM-DD
  description: string;
  source: 'Resumo de E-mail PROJUDI' | 'Nota Manual' | 'Prazo' | 'Audiência' | 'Outro';
}

export interface Process {
  id: string;
  processNumber: string;
  client: string;
  type: string;
  status: 'Em Andamento' | 'Concluído' | 'Suspenso';
  nextDeadline: string; // YYYY-MM-DD or '-'
  documents: number;
  monitorProjudi?: boolean;
  timeline?: TimelineEvent[];
}

const processFormSchema = z.object({
  processNumber: z.string().min(5, { message: "O número do processo é obrigatório e deve ter pelo menos 5 caracteres." }),
  client: z.string().min(3, { message: "O nome do cliente deve ter pelo menos 3 caracteres." }),
  type: z.string().min(3, { message: "O tipo do processo deve ter pelo menos 3 caracteres." }),
  status: z.enum(['Em Andamento', 'Concluído', 'Suspenso'], { required_error: "Status é obrigatório."}),
  nextDeadline: z.string().refine((val) => val === '-' || !isNaN(Date.parse(val)), { message: "Data inválida ou '-'." }),
  monitorProjudi: z.boolean().optional(),
});

export type ProcessFormValues = z.infer<typeof processFormSchema>;

// Schema para o formulário de evento da timeline
const timelineEventSchema = z.object({
  eventDate: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Data inválida." }),
  eventDescription: z.string().min(5, { message: "A descrição deve ter pelo menos 5 caracteres." }),
  eventSource: z.enum(['Resumo de E-mail PROJUDI', 'Nota Manual', 'Prazo', 'Audiência', 'Outro']),
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
  const { toast } = useToast();

  const form = useForm<ProcessFormValues>({
    resolver: zodResolver(processFormSchema),
    defaultValues: {
      processNumber: "",
      client: "",
      type: "",
      status: "Em Andamento",
      nextDeadline: format(new Date(), 'yyyy-MM-dd'),
      monitorProjudi: false,
    },
  });

  const timelineForm = useForm<TimelineEventFormValues>({
    resolver: zodResolver(timelineEventSchema),
    defaultValues: {
      eventDate: format(new Date(), 'yyyy-MM-dd'),
      eventDescription: "",
      eventSource: "Nota Manual",
    },
  });

  React.useEffect(() => {
     if (isOpen) {
        if (processData) {
            form.reset({
              processNumber: processData.processNumber,
              client: processData.client,
              type: processData.type,
              status: processData.status,
              nextDeadline: processData.nextDeadline === '-' ? '' : format(parseISO(processData.nextDeadline + 'T00:00:00'), 'yyyy-MM-dd'),
              monitorProjudi: processData.monitorProjudi || false,
            });
            setCurrentTimeline(processData.timeline || []);
        } else {
            form.reset({
              processNumber: "",
              client: "",
              type: "",
              status: "Em Andamento",
              nextDeadline: format(new Date(), 'yyyy-MM-dd'),
              monitorProjudi: false,
            });
            setCurrentTimeline([]);
        }
        timelineForm.reset({
          eventDate: format(new Date(), 'yyyy-MM-dd'),
          eventDescription: "",
          eventSource: "Nota Manual",
        });
    }
  }, [processData, form, timelineForm, isOpen]);

  const handleAddTimelineEvent: SubmitHandler<TimelineEventFormValues> = (data) => {
    const newEvent: TimelineEvent = {
      id: `TL-${Date.now()}`,
      date: format(parseISO(data.eventDate + 'T00:00:00'), 'yyyy-MM-dd'),
      description: data.eventDescription,
      source: data.eventSource,
    };
    setCurrentTimeline(prev => [...prev, newEvent].sort((a, b) => parseISO(b.date).getTime() - parseISO(a.date).getTime()));
    timelineForm.reset({
      eventDate: format(new Date(), 'yyyy-MM-dd'),
      eventDescription: "",
      eventSource: "Nota Manual",
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


  const handleFormSubmit: SubmitHandler<ProcessFormValues> = async (data) => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 700));
    const deadline = data.nextDeadline === '' || data.nextDeadline === '-' ? '-' : format(parseISO(data.nextDeadline + 'T00:00:00'), 'yyyy-MM-dd');
    onSubmit({ ...data, nextDeadline: deadline, timeline: currentTimeline });
    setIsLoading(false);
  };
  
  const handleDialogClose = () => {
    if (!isLoading) {
      onClose();
    }
  };

  return (
    <>
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleDialogClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>{processData ? "Editar Processo" : "Adicionar Novo Processo"}</DialogTitle>
          <DialogDescription>
            {processData ? "Altere os dados do processo abaixo." : "Preencha os dados para cadastrar um novo processo."}
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="pr-6 -mr-6 max-h-[calc(80vh-150px)]">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4 py-4 pr-1">
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
            <FormField
              control={form.control}
              name="client"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cliente</FormLabel>
                  <FormControl>
                    <Input placeholder="Nome do cliente ou empresa" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            </div>
             <FormField
              control={form.control}
              name="monitorProjudi"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm mt-4">
                  <div className="space-y-0.5">
                    <FormLabel>Monitorar no PROJUDI?</FormLabel>
                    <DialogDescription className="text-xs">
                      Marque para indicar que este processo deve ser monitorado para atualizações no PROJUDI-GO.
                    </DialogDescription>
                  </div>
                  <FormControl>
                    <Switch
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
                <CardTimelineTitle className="text-lg font-headline">Linha do Tempo do Processo</CardTimelineTitle>
                <CardTimelineDescription>Adicione e visualize eventos importantes do processo.</CardTimelineDescription>
              </CardHeader>
              <CardContent>
                <Form {...timelineForm}>
                  <div className="space-y-3 mb-6 p-4 border rounded-md">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
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
                       <Button 
                          type="button" 
                          size="sm" 
                          className="md:self-end h-10" 
                          onClick={timelineForm.handleSubmit(handleAddTimelineEvent)}
                        >
                          <PlusCircle className="mr-2 h-4 w-4" /> Adicionar
                        </Button>
                    </div>
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
                  </div>
                </Form>

                {currentTimeline.length > 0 ? (
                  <div className="space-y-3 max-h-60 overflow-y-auto">
                    {currentTimeline.map(event => (
                      <div key={event.id} className="p-3 border rounded-md bg-muted/30 shadow-sm">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-xs text-muted-foreground">{format(parseISO(event.date), "dd/MM/yyyy")} - <strong>{event.source}</strong></p>
                            <p className="text-sm mt-1">{event.description}</p>
                          </div>
                          <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive/80 h-7 w-7" onClick={() => handleDeleteTimelineEvent(event.id)}>
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



    
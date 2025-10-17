
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { format, parseISO } from "date-fns";
import type { DocumentData } from 'firebase/firestore';
import { getProcesses } from "@/services/processService";
import { getClients } from "@/services/clientService";
import type { Process } from "@/components/processes/ProcessFormDialog";
import type { Client } from "@/components/clients/ClientFormDialog";
import { useToast } from "@/hooks/use-toast";


export interface CalendarEvent extends DocumentData {
  id: string;
  date: string; // YYYY-MM-DD
  type: 'prazo' | 'audiencia' | 'consulta';
  description: string;
  time?: string; // HH:MM (optional)
  client?: string; // Optional - Client NAME
  process?: string; // Optional, agora será o ID do processo
  createdAt?: string;
}

const eventFormSchema = z.object({
  date: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Data inválida." }),
  type: z.enum(['prazo', 'audiencia', 'consulta'], { required_error: "Tipo de evento é obrigatório." }),
  description: z.string().min(5, { message: "A descrição deve ter pelo menos 5 caracteres." }),
  time: z.string().optional().refine((val) => val === undefined || val === "" || /^([01]\d|2[0-3]):([0-5]\d)$/.test(val), {
    message: "Hora inválida (formato HH:MM)."
  }),
  clientId: z.string().optional(),
  process: z.string().optional(), // Este será o ID do processo
});

export type EventFormValues = z.infer<typeof eventFormSchema>;

interface EventFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<EventFormValues, 'clientId'> & { client?: string }) => void;
  eventData?: Partial<CalendarEvent>;
}

export function EventFormDialog({ isOpen, onClose, onSubmit, eventData }: EventFormDialogProps) {
  const [isLoading, setIsLoading] = React.useState(false);
  const [allProcesses, setAllProcesses] = React.useState<Process[]>([]);
  const [allClients, setAllClients] = React.useState<Client[]>([]);
  const { toast } = useToast();

  const form = useForm<EventFormValues>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: {
      date: eventData?.date ? format(new Date(eventData.date), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
      type: eventData?.type || 'prazo',
      description: "",
      time: "",
      clientId: "",
      process: "",
    },
  });
  
  const selectedClientId = form.watch("clientId");

  const filteredProcesses = React.useMemo(() => {
    if (!selectedClientId) return [];
    const selectedClient = allClients.find(c => c.id === selectedClientId);
    if (!selectedClient) return [];
    return allProcesses.filter(p => p.client === selectedClient.name);
  }, [selectedClientId, allClients, allProcesses]);


  // Busca todos os processos e clientes quando o diálogo é aberto
  React.useEffect(() => {
    if (isOpen) {
      async function fetchData() {
        try {
          const [processesFromDb, clientsFromDb] = await Promise.all([getProcesses(), getClients()]);
          setAllProcesses(processesFromDb);
          setAllClients(clientsFromDb);
        } catch (error) {
          console.error("Failed to fetch data:", error);
          toast({ title: "Erro", description: "Não foi possível carregar a lista de processos e clientes.", variant: "destructive" });
        }
      }
      fetchData();
    }
  }, [isOpen, toast]);
  
  const parseISOAdjusted = (dateString: string | undefined) => {
    if (dateString && dateString.length === 10) { 
        return new Date(dateString + 'T00:00:00'); 
    }
    return dateString ? new Date(dateString) : new Date();
  };

  React.useEffect(() => {
    if (isOpen && allClients.length > 0) { 
      if (eventData) {
        const client = allClients.find(c => c.name === eventData.client);
        const clientId = client ? client.id : "";

        form.reset({
          date: format(parseISOAdjusted(eventData.date), 'yyyy-MM-dd'), 
          type: eventData.type || 'prazo',
          description: eventData.description || "",
          time: eventData.time || "",
          clientId: clientId,
          process: eventData.process || "", // O valor já deve ser o ID
        });
      } else {
        form.reset({
          date: format(new Date(), 'yyyy-MM-dd'),
          type: 'prazo',
          description: "",
          time: "",
          clientId: "",
          process: "",
        });
      }
    }
  }, [eventData, form, isOpen, allClients]);

  React.useEffect(() => {
      // Limpa o processo selecionado se o cliente mudar
      form.setValue('process', '');
  }, [selectedClientId, form]);
  
  const handleFormSubmit: SubmitHandler<EventFormValues> = async (data) => {
    setIsLoading(true);
    const selectedClient = allClients.find(c => c.id === data.clientId);
    const clientName = selectedClient ? selectedClient.name : undefined;

    const submittedData = {
      date: format(new Date(data.date + 'T00:00:00'), 'yyyy-MM-dd'),
      type: data.type,
      description: data.description,
      time: data.time,
      process: data.process,
      client: clientName,
    };
    await onSubmit(submittedData);
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
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{eventData?.id ? "Editar Evento" : "Adicionar Novo Evento"}</DialogTitle>
            <DialogDescription>
              {eventData?.id ? "Altere os dados do evento abaixo." : "Preencha os dados para cadastrar um novo evento."}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4 py-4">
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Ex: Audiência de conciliação sobre o caso X" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
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
                      <FormLabel>Tipo de Evento</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o tipo" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="prazo">Prazo</SelectItem>
                          <SelectItem value="audiencia">Audiência</SelectItem>
                          <SelectItem value="consulta">Consulta</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hora (Opcional)</FormLabel>
                    <FormControl>
                      <Input type="time" placeholder="HH:MM" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="clientId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cliente (Opcional)</FormLabel>
                     <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um cliente" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                         {allClients.map(client => (
                            <SelectItem key={client.id} value={client.id}>
                              {client.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="process"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Processo (Opcional)</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      value={field.value} 
                      disabled={!selectedClientId || filteredProcesses.length === 0}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={!selectedClientId ? "Selecione um cliente primeiro" : (filteredProcesses.length === 0 ? "Nenhum processo para este cliente" : "Selecione o processo")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {filteredProcesses.map(option => (
                          <SelectItem key={option.id} value={option.id}>
                            {option.processNumber} - {option.type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
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
                    eventData?.id ? "Salvar Alterações" : "Adicionar Evento"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}

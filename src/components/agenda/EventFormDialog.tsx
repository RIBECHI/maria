
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
import { Loader2, Search } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ClientSearchDialog } from "@/components/clients/ClientSearchDialog";
import type { DocumentData } from 'firebase/firestore';


export interface CalendarEvent extends DocumentData {
  id: string;
  date: string; // YYYY-MM-DD
  type: 'prazo' | 'audiencia' | 'consulta';
  description: string;
  time?: string; // HH:MM (optional)
  client?: string; // Optional
  process?: string; // Optional, agora será o ID do processo
}

const eventFormSchema = z.object({
  date: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Data inválida." }),
  type: z.enum(['prazo', 'audiencia', 'consulta'], { required_error: "Tipo de evento é obrigatório." }),
  description: z.string().min(5, { message: "A descrição deve ter pelo menos 5 caracteres." }),
  time: z.string().optional().refine((val) => val === undefined || val === "" || /^([01]\d|2[0-3]):([0-5]\d)$/.test(val), {
    message: "Hora inválida (formato HH:MM)."
  }),
  client: z.string().optional(),
  process: z.string().optional(), // Este será o ID do processo
});

export type EventFormValues = z.infer<typeof eventFormSchema>;

interface EventFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: EventFormValues) => void;
  eventData?: CalendarEvent;
}

// Mock de processos com associação de cliente para o diálogo
const MOCK_LINKABLE_PROCESSES = [
  { id: "PROC001", description: "Petição Inicial - Alpha", clientName: "Empresa Alpha Ltda." },
  { id: "PROC00A", description: "Contestação - Alpha", clientName: "Empresa Alpha Ltda." },
  { id: "PROC002", description: "Audiência - Silva", clientName: "João Silva" },
  { id: "PROC00B", description: "Recurso - Silva", clientName: "João Silva" },
  { id: "PROC003", description: "Parecer - Oliveira", clientName: "Maria Oliveira" },
  { id: "PROC004", description: "Consultoria - Beta", clientName: "Construtora Beta S.A." },
  // Adicione mais processos mockados conforme necessário
];


export function EventFormDialog({ isOpen, onClose, onSubmit, eventData }: EventFormDialogProps) {
  const [isLoading, setIsLoading] = React.useState(false);
  const [isClientSearchOpen, setIsClientSearchOpen] = React.useState(false);
  const [processOptions, setProcessOptions] = React.useState<{ value: string; label: string }[]>([]);

  const form = useForm<EventFormValues>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: {
      date: eventData?.date ? format(new Date(eventData.date), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
      type: eventData?.type || 'prazo',
      description: "",
      time: "",
      client: "",
      process: "",
    },
  });

  const selectedClient = form.watch("client");

  React.useEffect(() => {
    if (selectedClient) {
      const filtered = MOCK_LINKABLE_PROCESSES.filter(p => p.clientName === selectedClient);
      const options = filtered.map(p => ({ value: p.id, label: `${p.id} - ${p.description}` }));
      setProcessOptions(options);

      // Resetar o campo processo se o processo atual não for válido para o novo cliente
      const currentProcessValue = form.getValues("process");
      if (currentProcessValue && !options.find(opt => opt.value === currentProcessValue)) {
        form.setValue("process", "");
      }
    } else {
      setProcessOptions([]);
      form.setValue("process", ""); // Limpa o processo se nenhum cliente estiver selecionado
    }
  }, [selectedClient, form]);


  React.useEffect(() => {
    if (isOpen) { 
      if (eventData) {
        form.reset({
          date: format(parseISOAdjusted(eventData.date), 'yyyy-MM-dd'), 
          type: eventData.type,
          description: eventData.description,
          time: eventData.time || "",
          client: eventData.client || "",
          process: eventData.process || "",
        });
        // Disparar a lógica de filtro de processo para o cliente inicial, se houver
        if (eventData.client) {
             const filtered = MOCK_LINKABLE_PROCESSES.filter(p => p.clientName === eventData.client);
             const options = filtered.map(p => ({ value: p.id, label: `${p.id} - ${p.description}` }));
             setProcessOptions(options);
        } else {
            setProcessOptions([]);
        }

      } else {
        form.reset({
          date: format(new Date(), 'yyyy-MM-dd'),
          type: 'prazo',
          description: "",
          time: "",
          client: "",
          process: "",
        });
        setProcessOptions([]);
      }
    }
  }, [eventData, form, isOpen]);
  
  const parseISOAdjusted = (dateString: string) => {
    if (dateString.length === 10) { 
        return new Date(dateString + 'T00:00:00'); 
    }
    return new Date(dateString); 
  };

  const handleFormSubmit: SubmitHandler<EventFormValues> = async (data) => {
    setIsLoading(true);
    // await new Promise(resolve => setTimeout(resolve, 700));
    const submittedData = {
      ...data,
      date: format(new Date(data.date + 'T00:00:00'), 'yyyy-MM-dd') 
    };
    await onSubmit(submittedData);
    setIsLoading(false);
  };
  
  const handleDialogClose = () => {
    if (!isLoading) {
      onClose();
    }
  };

  const handleClientSelected = (clientName: string) => {
    form.setValue("client", clientName);
    // O useEffect [selectedClient] cuidará de atualizar as opções de processo
    setIsClientSearchOpen(false);
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && handleDialogClose()}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{eventData ? "Editar Evento" : "Adicionar Novo Evento"}</DialogTitle>
            <DialogDescription>
              {eventData ? "Altere os dados do evento abaixo." : "Preencha os dados para cadastrar um novo evento."}
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
                name="client"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cliente (Opcional)</FormLabel>
                    <div className="flex items-center gap-2">
                      <FormControl>
                        <Input placeholder="Nome do cliente" {...field} className="flex-grow" />
                      </FormControl>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => setIsClientSearchOpen(true)}
                        aria-label="Buscar cliente"
                      >
                        <Search className="h-4 w-4" />
                      </Button>
                    </div>
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
                      disabled={!selectedClient || processOptions.length === 0}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={!selectedClient ? "Selecione um cliente primeiro" : (processOptions.length === 0 ? "Nenhum processo para este cliente" : "Selecione o processo")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {processOptions.length > 0 ? (
                          processOptions.map(option => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))
                        ) : (
                           <SelectItem value="no-process" disabled>
                             {selectedClient ? "Nenhum processo encontrado" : "Selecione um cliente"}
                           </SelectItem>
                        )}
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
                    eventData ? "Salvar Alterações" : "Adicionar Evento"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <ClientSearchDialog
        isOpen={isClientSearchOpen}
        onClose={() => setIsClientSearchOpen(false)}
        onClientSelected={handleClientSelected}
      />
    </>
  );
}

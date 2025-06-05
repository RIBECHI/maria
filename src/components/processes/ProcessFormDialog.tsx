
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
import { Loader2 } from "lucide-react";
import { format } from "date-fns";

export interface Process {
  id: string;
  client: string;
  type: string;
  status: 'Em Andamento' | 'Concluído' | 'Suspenso';
  nextDeadline: string; // YYYY-MM-DD or '-'
  documents: number;
}

const processFormSchema = z.object({
  client: z.string().min(3, { message: "O nome do cliente deve ter pelo menos 3 caracteres." }),
  type: z.string().min(3, { message: "O tipo do processo deve ter pelo menos 3 caracteres." }),
  status: z.enum(['Em Andamento', 'Concluído', 'Suspenso'], { required_error: "Status é obrigatório."}),
  nextDeadline: z.string().refine((val) => val === '-' || !isNaN(Date.parse(val)), { message: "Data inválida ou '-'." }),
});

export type ProcessFormValues = z.infer<typeof processFormSchema>;

interface ProcessFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ProcessFormValues) => void;
  processData?: Process;
}

export function ProcessFormDialog({ isOpen, onClose, onSubmit, processData }: ProcessFormDialogProps) {
  const [isLoading, setIsLoading] = React.useState(false);

  const form = useForm<ProcessFormValues>({
    resolver: zodResolver(processFormSchema),
    defaultValues: {
      client: "",
      type: "",
      status: "Em Andamento",
      nextDeadline: format(new Date(), 'yyyy-MM-dd'),
    },
  });

  React.useEffect(() => {
     if (isOpen) {
        if (processData) {
            form.reset({
            client: processData.client,
            type: processData.type,
            status: processData.status,
            nextDeadline: processData.nextDeadline === '-' ? '' : format(new Date(processData.nextDeadline + 'T00:00:00'), 'yyyy-MM-dd'),
            });
        } else {
            form.reset({
            client: "",
            type: "",
            status: "Em Andamento",
            nextDeadline: format(new Date(), 'yyyy-MM-dd'),
            });
        }
    }
  }, [processData, form, isOpen]);

  const handleFormSubmit: SubmitHandler<ProcessFormValues> = async (data) => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 700));
    const deadline = data.nextDeadline === '' || data.nextDeadline === '-' ? '-' : format(new Date(data.nextDeadline + 'T00:00:00'), 'yyyy-MM-dd');
    onSubmit({ ...data, nextDeadline: deadline });
    setIsLoading(false);
    // onClose(); // Closing is handled by the parent
  };
  
  const handleDialogClose = () => {
    if (!isLoading) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleDialogClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{processData ? "Editar Processo" : "Adicionar Novo Processo"}</DialogTitle>
          <DialogDescription>
            {processData ? "Altere os dados do processo abaixo." : "Preencha os dados para cadastrar um novo processo."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4 py-4">
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
                  processData ? "Salvar Alterações" : "Adicionar Processo"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

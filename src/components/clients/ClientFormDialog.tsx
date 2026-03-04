
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
import { Loader2 } from "lucide-react";
import type { DocumentData } from "firebase/firestore";

export interface Client extends DocumentData {
  id: string;
  name: string;
  contact: string;
  cpf?: string;
  caseCount: number;
  lastActivity: string;
  address?: string;
  notes?: string;
  maritalStatus?: string;
  occupation?: string;
  createdAt?: string; // Can be a string (ISO date) or undefined
}

const clientFormSchema = z.object({
  name: z.string().min(3, { message: "O nome deve ter pelo menos 3 caracteres." }),
  contact: z.string().min(10, { message: "O contato deve ter pelo menos 10 caracteres (email ou telefone)." }),
  cpf: z.string().optional(),
  maritalStatus: z.string().optional(),
  occupation: z.string().optional(),
  address: z.string().optional(),
  notes: z.string().optional(),
});

export type ClientFormValues = z.infer<typeof clientFormSchema>;

interface ClientFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ClientFormValues) => void;
  clientData?: Client; // Para preencher o formulário em modo de edição
}

export function ClientFormDialog({ isOpen, onClose, onSubmit, clientData }: ClientFormDialogProps) {
  const [isLoading, setIsLoading] = React.useState(false);

  const form = useForm<ClientFormValues>({
    resolver: zodResolver(clientFormSchema),
    defaultValues: {
      name: "",
      contact: "",
      cpf: "",
      maritalStatus: "",
      occupation: "",
      address: "",
      notes: "",
    },
  });

  React.useEffect(() => {
    if (clientData) {
      form.reset({
        name: clientData.name,
        contact: clientData.contact,
        cpf: clientData.cpf || "",
        maritalStatus: clientData.maritalStatus || "",
        occupation: clientData.occupation || "",
        address: clientData.address || "",
        notes: clientData.notes || "",
      });
    } else {
      form.reset({
        name: "",
        contact: "",
        cpf: "",
        maritalStatus: "",
        occupation: "",
        address: "",
        notes: "",
      });
    }
  }, [clientData, form, isOpen]); // Adicionado isOpen para resetar quando o dialog reabre

  const handleFormSubmit: SubmitHandler<ClientFormValues> = (data) => {
    setIsLoading(true);
    onSubmit(data); 
    setIsLoading(false);
  };
  
  const handleDialogClose = () => {
    if (!isLoading) {
      onClose();
    }
  };


  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleDialogClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{clientData ? "Editar Cliente" : "Adicionar Novo Cliente"}</DialogTitle>
          <DialogDescription>
            {clientData ? "Altere os dados do cliente abaixo." : "Preencha os dados para cadastrar um novo cliente."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-3 py-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome Completo / Razão Social</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: João da Silva ou Empresa X Ltda." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
               <FormField
                control={form.control}
                name="cpf"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CPF/CNPJ</FormLabel>
                    <FormControl>
                      <Input placeholder="000.000.000-00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="contact"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contato (Email / Telefone)</FormLabel>
                    <FormControl>
                      <Input placeholder="(11) 99999-9999" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
               <FormField
                control={form.control}
                name="maritalStatus"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estado Civil</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Solteiro(a), Casado(a)" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="occupation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ocupação</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Advogado, Engenheiro" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
             <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Endereço</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Rua, Número, Bairro, Cidade - UF" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Anotações</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Informações adicionais sobre o cliente..." {...field} />
                  </FormControl>
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
                  clientData ? "Salvar Alterações" : "Salvar Cliente"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

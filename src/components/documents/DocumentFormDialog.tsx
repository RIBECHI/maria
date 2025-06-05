
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

export interface Document {
  id: string;
  name: string;
  process: string;
  tags: string[];
  uploadDate: string;
}

const documentFormSchema = z.object({
  name: z.string().min(3, { message: "O nome do arquivo deve ter pelo menos 3 caracteres." }),
  process: z.string().min(3, { message: "O processo vinculado deve ter pelo menos 3 caracteres." }),
  tagsString: z.string().optional(), // Tags como string separada por vírgulas
});

export type DocumentFormValues = z.infer<typeof documentFormSchema>;

interface DocumentFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: DocumentFormValues) => void;
  documentData?: Document;
}

export function DocumentFormDialog({ isOpen, onClose, onSubmit, documentData }: DocumentFormDialogProps) {
  const [isLoading, setIsLoading] = React.useState(false);

  const form = useForm<DocumentFormValues>({
    resolver: zodResolver(documentFormSchema),
    defaultValues: {
      name: "",
      process: "",
      tagsString: "",
    },
  });

  React.useEffect(() => {
    if (isOpen) {
      if (documentData) {
        form.reset({
          name: documentData.name,
          process: documentData.process,
          tagsString: documentData.tags.join(", "),
        });
      } else {
        form.reset({
          name: "",
          process: "",
          tagsString: "",
        });
      }
    }
  }, [documentData, form, isOpen]);

  const handleFormSubmit: SubmitHandler<DocumentFormValues> = async (data) => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 700));
    onSubmit(data);
    setIsLoading(false);
    // onClose(); // Closing is handled by the parent or useEffect
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
          <DialogTitle>{documentData ? "Editar Documento" : "Carregar Novo Documento"}</DialogTitle>
          <DialogDescription>
            {documentData ? "Altere os metadados do documento abaixo." : "Preencha os metadados do novo documento."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do Arquivo</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Peticao_Inicial_Caso_XYZ.pdf" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="process"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Processo Vinculado</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: PROC001 ou Caso Silva" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="tagsString"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tags (separadas por vírgula)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Ex: Contrato, Petição, Importante" {...field} />
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
                  documentData ? "Salvar Alterações" : "Adicionar Documento"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

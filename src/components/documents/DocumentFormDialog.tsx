
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
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Search, FileUp } from "lucide-react";
import { ProcessSearchDialog } from "@/components/processes/ProcessSearchDialog";
import type { DocumentData } from "firebase/firestore";

export interface Document extends DocumentData {
  id: string;
  name: string;
  process: string; // ID do processo
  tags: string[];
  uploadDate: string;
  createdAt?: string;
  fileUrl: string;
  filePath: string;
}

const documentFormSchemaBase = z.object({
  name: z.string().optional(),
  process: z.string().min(3, { message: "O processo vinculado é obrigatório." }),
  tagsString: z.string().optional(),
});

const documentFormSchemaCreate = documentFormSchemaBase.extend({
  file: z.any()
    .refine((files) => files?.length === 1, "O arquivo é obrigatório.")
    .refine((files) => files?.[0]?.size <= 5000000, `Tamanho máximo do arquivo é 5MB.`)
});

const documentFormSchemaEdit = documentFormSchemaBase.extend({
    file: z.any().optional(),
});


export type DocumentFormValues = z.infer<typeof documentFormSchemaCreate>;

interface DocumentFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<DocumentFormValues>, file?: File) => Promise<void>;
  documentData?: Document;
}

export function DocumentFormDialog({ isOpen, onClose, onSubmit, documentData }: DocumentFormDialogProps) {
  const [isLoading, setIsLoading] = React.useState(false);
  const [isProcessSearchOpen, setIsProcessSearchOpen] = React.useState(false);

  const form = useForm<DocumentFormValues>({
    resolver: zodResolver(documentData ? documentFormSchemaEdit : documentFormSchemaCreate),
    defaultValues: {
      process: "",
      tagsString: "",
      file: undefined,
    },
  });

  const fileRef = form.register("file");

  React.useEffect(() => {
    if (isOpen) {
      form.reset({
        process: documentData?.process ?? "",
        tagsString: documentData?.tags.join(", ") ?? "",
        file: undefined,
      });
    }
  }, [documentData, form, isOpen]);

  const handleFormSubmit: SubmitHandler<DocumentFormValues> = async (data) => {
    setIsLoading(true);
    const file = data.file?.[0];
    await onSubmit({ ...data, name: file?.name }, file);
    setIsLoading(false);
  };

  const handleDialogClose = () => {
    if (!isLoading) {
      onClose();
    }
  };

  const handleProcessSelected = (processId: string) => {
    form.setValue("process", processId);
    setIsProcessSearchOpen(false);
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && handleDialogClose()}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{documentData ? "Editar Metadados do Documento" : "Carregar Novo Documento"}</DialogTitle>
            <DialogDescription>
              {documentData ? "Altere os metadados do documento abaixo. A substituição do arquivo não é permitida." : "Preencha os metadados e selecione o arquivo para upload."}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4 py-4">
               <FormField
                control={form.control}
                name="file"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Arquivo</FormLabel>
                    <FormControl>
                       <Input type="file" {...fileRef} disabled={!!documentData} />
                    </FormControl>
                    <FormDescriptionUI>
                      {documentData ? `Arquivo carregado: ${documentData.name}` : 'Tamanho máximo: 5MB.'}
                    </FormDescriptionUI>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="process"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Processo Vinculado (ID)</FormLabel>
                    <div className="flex items-center gap-2">
                      <FormControl>
                        <Input placeholder="Ex: PROC001" {...field} />
                      </FormControl>
                       <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => setIsProcessSearchOpen(true)}
                        aria-label="Buscar processo"
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
                    <>
                     {documentData ? null : <FileUp className="mr-2 h-4 w-4" /> }
                     {documentData ? "Salvar Alterações" : "Carregar e Salvar"}
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <ProcessSearchDialog
        isOpen={isProcessSearchOpen}
        onClose={() => setIsProcessSearchOpen(false)}
        onProcessSelected={handleProcessSelected}
      />
    </>
  );
}

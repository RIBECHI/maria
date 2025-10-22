
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
import { useToast } from "@/hooks/use-toast";
import { addDocument } from "@/services/documentService";

export interface Document extends DocumentData {
  id: string;
  name: string;
  process: string; // ID do processo
  tags: string[];
  uploadDate: string;
  createdAt?: string;
  fileUrl: string; // Pode ser vazia agora
  filePath: string;
}

// Esquema para o formulário principal que agora inclui o arquivo
const documentFormSchema = z.object({
  process: z.string().min(3, { message: "O processo vinculado é obrigatório." }),
  tagsString: z.string().optional(),
  file: z.any().optional(), // O arquivo é opcional aqui porque o Zod no cliente não o validará
});

export type DocumentFormValues = z.infer<typeof documentFormSchema>;

interface DocumentFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  // A submissão agora é tratada internamente para lidar com o upload
  onSubmit: (data: any) => Promise<void>; 
  documentData?: Document;
}

export function DocumentFormDialog({ isOpen, onClose, onSubmit, documentData }: DocumentFormDialogProps) {
  const [isLoading, setIsLoading] = React.useState(false);
  const [isProcessSearchOpen, setIsProcessSearchOpen] = React.useState(false);
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const { toast } = useToast();

  const form = useForm<DocumentFormValues>({
    resolver: zodResolver(documentFormSchema),
    defaultValues: {
      process: "",
      tagsString: "",
      file: undefined,
    },
  });

  const fileRef = form.register("file");

  React.useEffect(() => {
    if (isOpen) {
      if (documentData) {
        form.reset({
          process: documentData.process,
          tagsString: documentData.tags.join(", "),
        });
        setSelectedFile(null);
      } else {
        form.reset({
          process: "",
          tagsString: "",
        });
        setSelectedFile(null);
      }
    }
  }, [documentData, form, isOpen]);

  const handleFormSubmit: SubmitHandler<DocumentFormValues> = async (data) => {
    setIsLoading(true);

    if (documentData) {
      // Modo de Edição (só metadados)
      await onSubmit(data);
    } else {
      // Modo de Criação (com upload)
      if (!selectedFile) {
        toast({ title: "Arquivo Faltando", description: "Por favor, selecione um arquivo para carregar.", variant: "destructive"});
        setIsLoading(false);
        return;
      }

      try {
        // 1. Fazer o upload para a nossa API
        const formData = new FormData();
        formData.append('file', selectedFile);
        const uploadResponse = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (!uploadResponse.ok) {
          // Se a resposta não for OK, lemos como texto para ver o erro (geralmente HTML)
          const errorText = await uploadResponse.text();
          console.error("Server returned an error:", errorText);
          throw new Error(`Falha na API de upload. Status: ${uploadResponse.status}`);
        }

        // Se a resposta for OK, aí sim tentamos o .json()
        const { filePath } = await uploadResponse.json();

        // 2. Salvar os metadados no Firestore usando o filePath retornado
        const metadata = {
          ...data,
          name: selectedFile.name,
        };
        await addDocument(metadata, filePath);
        
        // Chamada ao onSubmit original para revalidar os dados na página
        await onSubmit(metadata);
        
      } catch (error: any) {
        console.error("Falha ao processar documento:", error);
        toast({ title: "Erro ao Salvar", description: error.message || "Não foi possível salvar o documento.", variant: "destructive" });
      }
    }

    setIsLoading(false);
  };
  
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    setSelectedFile(file);
  }

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
               <FormItem>
                 <FormLabel>Arquivo</FormLabel>
                 <FormControl>
                    <Input type="file" onChange={handleFileChange} disabled={!!documentData} />
                 </FormControl>
                 <FormDescriptionUI>
                   {documentData ? `Arquivo carregado: ${documentData.name}` : 'Tamanho máximo: 5MB.'}
                 </FormDescriptionUI>
                 <FormMessage />
               </FormItem>

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

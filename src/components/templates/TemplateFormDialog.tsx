
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
import { Loader2, Copy } from "lucide-react";
import type { DocumentTemplate, TemplateFormValues } from "@/services/templateService";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";

const formSchema = z.object({
  name: z.string().min(3, { message: "O nome do modelo deve ter pelo menos 3 caracteres." }),
  content: z.string().min(20, { message: "O conteúdo do modelo deve ter pelo menos 20 caracteres." }),
});

interface TemplateFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: TemplateFormValues) => Promise<void>;
  templateData?: DocumentTemplate;
}

const availableVariables = [
    { variable: "{{cliente.nome}}", description: "Nome completo do cliente" },
    { variable: "{{cliente.cpf}}", description: "CPF/CNPJ do cliente" },
    { variable: "{{cliente.contato}}", description: "Contato (email/telefone) do cliente" },
    { variable: "{{cliente.cidade}}", description: "Cidade do cliente" },
    { variable: "{{processo.numero}}", description: "Número do processo" },
    { variable: "{{processo.tipo}}", description: "Tipo do processo" },
    { variable: "{{processo.status}}", description: "Status atual do processo" },
];

export function TemplateFormDialog({ isOpen, onClose, onSubmit, templateData }: TemplateFormDialogProps) {
  const [isLoading, setIsLoading] = React.useState(false);
  const { toast } = useToast();

  const form = useForm<TemplateFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      content: "",
    },
  });

  React.useEffect(() => {
    if (isOpen) {
      if (templateData) {
        form.reset(templateData);
      } else {
        form.reset({ name: "", content: "" });
      }
    }
  }, [templateData, form, isOpen]);

  const handleFormSubmit: SubmitHandler<TemplateFormValues> = async (data) => {
    setIsLoading(true);
    await onSubmit(data);
    setIsLoading(false);
  };

  const handleDialogClose = () => {
    if (!isLoading) {
      onClose();
    }
  };
  
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Variável Copiada!",
      description: `"${text}" foi copiado para a área de transferência.`,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if(!open) handleDialogClose(); }}>
      <DialogContent className="sm:max-w-3xl flex flex-col max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>{templateData ? "Editar Modelo" : "Criar Novo Modelo"}</DialogTitle>
          <DialogDescription>
            {templateData ? "Altere o nome e o conteúdo do seu modelo." : "Crie um novo modelo de texto para usar no gerador de documentos."}
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="flex-1 pr-6 -mr-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4 py-4 pr-2">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome do Modelo</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Petição Inicial Cível" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Conteúdo do Modelo</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Cole ou digite o texto do seu documento aqui, usando as variáveis disponíveis..." {...field} className="min-h-[250px] font-mono"/>
                    </FormControl>
                    <FormDescriptionUI>
                      Use as variáveis abaixo para inserir dados dinâmicos. Elas serão substituídas automaticamente.
                    </FormDescriptionUI>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div>
                  <h4 className="text-sm font-medium mb-2">Variáveis Disponíveis</h4>
                  <div className="space-y-2 p-3 border rounded-md bg-muted/30">
                      {availableVariables.map(v => (
                          <div key={v.variable} className="flex items-center justify-between p-1.5 rounded-md hover:bg-muted">
                            <div className="flex items-baseline gap-2">
                              <code className="font-semibold text-foreground text-sm">{v.variable}</code>
                              <span className="text-xs text-muted-foreground">- {v.description}</span>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-muted-foreground hover:text-primary"
                              onClick={() => copyToClipboard(v.variable)}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          </div>
                      ))}
                  </div>
              </div>
            </form>
          </Form>
        </ScrollArea>
        <DialogFooter className="mt-auto pt-4 border-t">
          <Button type="button" variant="outline" onClick={handleDialogClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button type="button" onClick={form.handleSubmit(handleFormSubmit)} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              "Salvar Modelo"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


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
import { Loader2 } from "lucide-react";
import type { Phase } from "@/services/phaseService";

const formSchema = z.object({
  name: z
    .string()
    .min(3, { message: "O nome da fase deve ter pelo menos 3 caracteres." }),
});

export type PhaseFormValues = z.infer<typeof formSchema>;

interface PhaseFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: PhaseFormValues) => Promise<void>;
  phaseData?: Phase;
}

export function PhaseFormDialog({
  isOpen,
  onClose,
  onSubmit,
  phaseData,
}: PhaseFormDialogProps) {
  const [isLoading, setIsLoading] = React.useState(false);

  const form = useForm<PhaseFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
    },
  });

  React.useEffect(() => {
    if (isOpen) {
      if (phaseData) {
        form.reset(phaseData);
      } else {
        form.reset({ name: "" });
      }
    }
  }, [phaseData, form, isOpen]);

  const handleFormSubmit: SubmitHandler<PhaseFormValues> = async (data) => {
    setIsLoading(true);
    await onSubmit(data);
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
          <DialogTitle>
            {phaseData ? "Editar Fase" : "Criar Nova Fase"}
          </DialogTitle>
          <DialogDescription>
            {phaseData
              ? "Altere o nome da sua fase do pipeline."
              : "Crie uma nova coluna para o seu pipeline de processos."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleFormSubmit)}
            className="space-y-4 py-4"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome da Fase</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Análise Inicial" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleDialogClose}
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  "Salvar Fase"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

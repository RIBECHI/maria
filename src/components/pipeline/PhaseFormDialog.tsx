
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
import type { Phase } from "@/services/phaseService";

const formSchema = z.object({
  name: z
    .string()
    .min(3, { message: "O nome da fase deve ter pelo menos 3 caracteres." }),
  order: z.coerce.number().min(1, "A posição deve ser pelo menos 1."),
});

export type PhaseFormValues = z.infer<typeof formSchema>;

interface PhaseFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: PhaseFormValues) => Promise<void>;
  phaseData?: Phase;
  existingPhases?: Phase[];
}

export function PhaseFormDialog({
  isOpen,
  onClose,
  onSubmit,
  phaseData,
  existingPhases = [],
}: PhaseFormDialogProps) {
  const [isLoading, setIsLoading] = React.useState(false);
  
  const isEditing = !!phaseData;

  const form = useForm<PhaseFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      order: 1,
    },
  });

  React.useEffect(() => {
    if (isOpen) {
      if (phaseData) {
        form.reset({
          name: phaseData.name,
          order: phaseData.order,
        });
      } else {
        form.reset({ name: "", order: existingPhases.length + 1 });
      }
    }
  }, [phaseData, form, isOpen, existingPhases]);

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

  const maxOrder = existingPhases.length + (isEditing ? 0 : 1);
  const positionOptions = Array.from({ length: maxOrder }, (_, i) => i + 1);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleDialogClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {phaseData ? "Editar Fase" : "Criar Nova Fase"}
          </DialogTitle>
          <DialogDescription>
            {phaseData
              ? "Altere o nome ou a ordem da sua fase do pipeline."
              : "Crie uma nova coluna e escolha sua posição no pipeline."}
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
            <FormField
              control={form.control}
              name="order"
              render={({ field }) => (
                <FormItem>
                    <FormLabel>Posição</FormLabel>
                    <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value.toString()}>
                        <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder="Selecione a posição" />
                            </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            {positionOptions.map(pos => (
                                <SelectItem key={pos} value={pos.toString()}>
                                    Posição {pos}
                                    {isEditing && phaseData?.order === pos && " (Atual)"}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
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

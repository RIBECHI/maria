
"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PlusCircle, Edit, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  getPhases,
  addPhase,
  updatePhase,
  deletePhase,
  type Phase,
} from "@/services/phaseService";
import { Skeleton } from "@/components/ui/skeleton";
import { PhaseFormDialog, type PhaseFormValues } from "@/components/pipeline/PhaseFormDialog";

export default function PipelinePhasesPage() {
  const [phases, setPhases] = React.useState<Phase[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [editingPhase, setEditingPhase] = React.useState<Phase | undefined>(
    undefined
  );
  const [isAlertOpen, setIsAlertOpen] = React.useState(false);
  const [phaseToDelete, setPhaseToDelete] = React.useState<Phase | null>(
    null
  );
  const { toast } = useToast();

  const fetchPhases = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getPhases();
      setPhases(data.sort((a, b) => a.order - b.order));
    } catch (error) {
      console.error("Error fetching phases:", error);
      toast({
        title: "Erro ao buscar fases",
        description: "Não foi possível carregar a lista.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  React.useEffect(() => {
    fetchPhases();
  }, [fetchPhases]);

  const handleOpenForm = (phase?: Phase) => {
    setEditingPhase(phase);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setEditingPhase(undefined);
    setIsFormOpen(false);
  };

  const handleSubmit = async (data: PhaseFormValues) => {
    try {
      if (editingPhase) {
        // Edit logic
        const originalOrder = editingPhase.order;
        const newOrder = data.order;
        if (originalOrder !== newOrder) {
            const phasesToUpdate: { id: string; order: number }[] = [];
            
            // Find the phase that currently has the newOrder
            const phaseAtNewOrder = phases.find(p => p.order === newOrder && p.id !== editingPhase.id);
            if (phaseAtNewOrder) {
                phasesToUpdate.push({ id: phaseAtNewOrder.id, order: originalOrder });
            }

            // Update the editing phase
            await updatePhase(editingPhase.id, data);
            
            // Update the other phase
            for (const p of phasesToUpdate) {
                await updatePhase(p.id, { order: p.order });
            }

        } else {
             await updatePhase(editingPhase.id, data);
        }

        toast({
          title: "Fase atualizada!",
          description: "Suas alterações foram salvas.",
        });

      } else {
        // Create logic
        const newOrder = data.order;
        const phasesToShift = phases.filter(p => p.order >= newOrder);

        // Shift existing phases
        for (const phase of phasesToShift) {
            await updatePhase(phase.id, { order: phase.order + 1 });
        }

        // Add the new phase
        await addPhase(data);
        toast({
          title: "Fase criada!",
          description: "A nova fase já está disponível no pipeline.",
        });
      }
      fetchPhases(); // Re-fetch to update list
      handleCloseForm();
    } catch (error) {
      console.error("Failed to save phase:", error);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar a fase.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = (phase: Phase) => {
    setPhaseToDelete(phase);
    setIsAlertOpen(true);
  };

  const confirmDelete = async () => {
    if (phaseToDelete) {
      try {
        await deletePhase(phaseToDelete.id);
        
        // Re-order phases that were after the deleted one
        const phasesToShift = phases.filter(p => p.order > phaseToDelete.order);
        for(const phase of phasesToShift) {
            await updatePhase(phase.id, { order: phase.order - 1 });
        }

        toast({
          title: "Fase excluída!",
          description: `A fase "${phaseToDelete.name}" foi removida.`,
        });
        fetchPhases(); // Re-fetch to see updated order
      } catch (error) {
        console.error("Failed to delete phase:", error);
        toast({
          title: "Erro ao excluir",
          description: "Não foi possível remover a fase. Verifique se não há processos nela.",
          variant: "destructive",
        });
      } finally {
        setPhaseToDelete(null);
        setIsAlertOpen(false);
      }
    }
  };

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-4xl font-headline font-extrabold text-primary">
          Fases do Pipeline
        </h1>
        <Button onClick={() => handleOpenForm()}>
          <PlusCircle className="mr-2 h-5 w-5" /> Criar Nova Fase
        </Button>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Gerenciar Fases</CardTitle>
          <CardDescription>
            Crie, edite e reordene as fases (colunas) do seu pipeline.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ordem</TableHead>
                <TableHead>Nome da Fase</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-48" />
                    </TableCell>
                    <TableCell className="text-right">
                      <Skeleton className="h-8 w-20 ml-auto" />
                    </TableCell>
                  </TableRow>
                ))
              ) : phases.length > 0 ? (
                phases.map((phase) => (
                  <TableRow key={phase.id}>
                    <TableCell className="font-medium">{phase.order}</TableCell>
                    <TableCell>{phase.name}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="hover:text-accent"
                        onClick={() => handleOpenForm(phase)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="hover:text-destructive"
                        onClick={() => handleDelete(phase)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={3} className="text-center h-24">
                    Nenhuma fase encontrada. Crie uma para começar!
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <PhaseFormDialog
        isOpen={isFormOpen}
        onClose={handleCloseForm}
        onSubmit={handleSubmit}
        phaseData={editingPhase}
        existingPhases={phases}
      />

      {phaseToDelete && (
        <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir a fase "{phaseToDelete.name}"?
                Esta ação não poderá ser desfeita. Processos nesta fase ficarão como "Não Classificados".
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDelete}
                className="bg-destructive hover:bg-destructive/90"
              >
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}

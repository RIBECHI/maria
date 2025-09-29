
"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { PlusCircle, Edit, FolderOpen, Trash2, Search, CheckCircle, XCircle, Eye } from "lucide-react";
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
import { ProcessFormDialog, type ProcessFormValues, type Process, type TimelineEvent } from "@/components/processes/ProcessFormDialog";
import { getProcesses, addProcess, updateProcess, deleteProcess } from "@/services/processService";
import { Skeleton } from "@/components/ui/skeleton";

const getStatusBadgeVariant = (status: string) => {
  switch (status) {
    case "Em Andamento": return "default";
    case "Concluído": return "secondary"; 
    case "Suspenso": return "outline";
    default: return "outline";
  }
}

export default function ProcessesPage() {
  const [processes, setProcesses] = React.useState<Process[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isFormDialogOpen, setIsFormDialogOpen] = React.useState(false);
  const [editingProcess, setEditingProcess] = React.useState<Process | undefined>(undefined);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [processToDelete, setProcessToDelete] = React.useState<Process | null>(null);
  const [searchTerm, setSearchTerm] = React.useState("");
  const { toast } = useToast();

  const fetchProcesses = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const processesFromDb = await getProcesses();
      setProcesses(processesFromDb);
    } catch (error) {
      console.error("Error fetching processes:", error);
      toast({
        title: "Erro ao buscar processos",
        description: "Não foi possível carregar a lista de processos. Tente novamente mais tarde.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  React.useEffect(() => {
    fetchProcesses();
  }, [fetchProcesses]);

  const handleOpenFormDialog = (proc?: Process) => {
    setEditingProcess(proc);
    setIsFormDialogOpen(true);
  };

  const handleCloseFormDialog = () => {
    setEditingProcess(undefined);
    setIsFormDialogOpen(false);
  };

  const handleSubmitProcessForm = async (data: ProcessFormValues & { timeline?: TimelineEvent[] }) => {
    try {
      if (editingProcess) {
        const updatedData = { ...data, timeline: data.timeline || editingProcess.timeline };
        const updatedProcess = await updateProcess(editingProcess.id, updatedData);
        setProcesses(processes.map(p => (p.id === editingProcess.id ? updatedProcess : p)));
        toast({ title: "Processo atualizado!", description: `O processo ${data.client} - ${data.type} foi atualizado.` });
      } else {
        const newProcessData = {
          ...data,
          documents: 0,
          timeline: data.timeline || []
        };
        const newProcess = await addProcess(newProcessData);
        setProcesses(prev => [...prev, newProcess]);
        toast({ title: "Processo adicionado!", description: `Novo processo para ${newProcess.client} foi adicionado.` });
      }
      handleCloseFormDialog();
      fetchProcesses(); // Re-fetch to ensure data is consistent, especially with sub-collections
    } catch (error) {
      console.error("Failed to save process:", error);
      toast({ title: "Erro ao salvar", description: "Não foi possível salvar o processo.", variant: "destructive" });
    }
  };

  const handleDeleteConfirmation = (proc: Process) => {
    setProcessToDelete(proc);
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteProcess = async () => {
    if (processToDelete) {
      try {
        await deleteProcess(processToDelete.id);
        setProcesses(processes.filter(p => p.id !== processToDelete.id));
        toast({ title: "Processo excluído!", description: `O processo ${processToDelete.id} foi excluído.`});
      } catch (error) {
        console.error("Failed to delete process:", error);
        toast({ title: "Erro ao excluir", description: "Não foi possível excluir o processo.", variant: "destructive" });
      } finally {
        setProcessToDelete(null);
        setIsDeleteDialogOpen(false);
      }
    }
  };
  
  const handleOpenFolder = (proc: Process) => {
    console.log("Abrir pasta do processo:", proc);
    toast({ title: "Ação: Abrir Pasta", description: `Simulando abertura da pasta do processo: ${proc.id}` });
  };
  
  const handleViewDetails = (proc: Process) => {
    handleOpenFormDialog(proc);
  };

  const filteredProcesses = processes.filter(proc =>
    (proc.processNumber && proc.processNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (proc.client && proc.client.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (proc.type && proc.type.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (proc.apenso && proc.apenso.toLowerCase().includes(searchTerm.toLowerCase()))
  );


  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-headline font-bold text-primary">Acompanhamento de Processos</h1>
        <Button onClick={() => handleOpenFormDialog()}>
          <PlusCircle className="mr-2 h-5 w-5" /> Adicionar Processo
        </Button>
      </div>

      <div className="mb-6 flex items-center gap-2">
        <Search className="h-5 w-5 text-muted-foreground" />
        <Input
          placeholder="Buscar processos por Nº, apenso, cliente ou tipo..."
          className="max-w-sm"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl font-headline">Lista de Processos</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nº Processo</TableHead>
                <TableHead>Apenso</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Próximo Prazo</TableHead>
                <TableHead className="text-center">UHD</TableHead>
                <TableHead className="text-center">Certidão</TableHead>
                <TableHead className="text-center">PROJUDI</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-28 rounded-full" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell className="text-center"><Skeleton className="h-4 w-8 mx-auto" /></TableCell>
                    <TableCell className="text-center"><Skeleton className="h-5 w-5 rounded-full mx-auto" /></TableCell>
                    <TableCell className="text-center"><Skeleton className="h-5 w-5 rounded-full mx-auto" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-8 w-24" /></TableCell>
                  </TableRow>
                ))
              ) : filteredProcesses.length > 0 ? (
                filteredProcesses.map((process) => (
                  <TableRow key={process.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium" onClick={() => handleViewDetails(process)}>{process.processNumber}</TableCell>
                    <TableCell onClick={() => handleViewDetails(process)}>{process.apenso}</TableCell>
                    <TableCell onClick={() => handleViewDetails(process)}>{process.client}</TableCell>
                    <TableCell onClick={() => handleViewDetails(process)}>{process.type}</TableCell>
                    <TableCell onClick={() => handleViewDetails(process)}>
                      <Badge variant={getStatusBadgeVariant(process.status) as any}>{process.status}</Badge>
                    </TableCell>
                    <TableCell onClick={() => handleViewDetails(process)}>{process.nextDeadline}</TableCell>
                    <TableCell className="text-center" onClick={() => handleViewDetails(process)}>{process.uhd}</TableCell>
                    <TableCell className="text-center" onClick={() => handleViewDetails(process)}>
                      {process.certidao ? (
                        <CheckCircle className="h-5 w-5 text-green-600 mx-auto" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500 mx-auto" />
                      )}
                    </TableCell>
                    <TableCell className="text-center" onClick={() => handleViewDetails(process)}>
                      {process.monitorProjudi ? (
                        <CheckCircle className="h-5 w-5 text-green-600 mx-auto" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500 mx-auto" />
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" className="hover:text-accent" onClick={() => handleViewDetails(process)} title="Ver Detalhes/Timeline">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="hover:text-accent" onClick={() => handleOpenFormDialog(process)} title="Editar Processo">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="hover:text-accent" onClick={() => handleOpenFolder(process)} title="Abrir Pasta (Simulado)">
                        <FolderOpen className="h-4 w-4" />
                      </Button>
                       <Button variant="ghost" size="icon" className="hover:text-destructive" onClick={() => handleDeleteConfirmation(process)} title="Excluir Processo">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={10} className="text-center h-24">
                    Nenhum processo encontrado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <ProcessFormDialog
        isOpen={isFormDialogOpen}
        onClose={handleCloseFormDialog}
        onSubmit={handleSubmitProcessForm}
        processData={editingProcess}
      />

      {processToDelete && (
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir o processo "{processToDelete.processNumber} - {processToDelete.client}"? Esta ação não poderá ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setIsDeleteDialogOpen(false)}>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDeleteProcess} className="bg-destructive hover:bg-destructive/90">Excluir</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}

    
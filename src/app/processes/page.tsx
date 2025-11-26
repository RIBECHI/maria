

"use client";

import * as React from "react";
import { useSearchParams } from 'next/navigation'
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { PlusCircle, Edit, FolderOpen, Trash2, Search, CheckCircle, XCircle, Eye, X } from "lucide-react";
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
import { ProcessFormDialog, type ProcessFormValues, type TimelineEvent, type Process } from "@/components/processes/ProcessFormDialog";
import { getProcesses, addProcess, updateProcess, deleteProcess } from "@/services/processService";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { parseISO } from "date-fns";
import { ProcessDetailsSheet } from "@/components/processes/ProcessDetailsSheet";
import { getPhases, type Phase } from "@/services/phaseService";


const getPhaseBadgeVariant = (phaseName?: string) => {
  if (!phaseName) return "outline";
  const lowerCaseName = phaseName.toLowerCase();
  if (lowerCaseName.includes('concluído')) return 'secondary';
  if (lowerCaseName.includes('suspenso') || lowerCaseName.includes('aguardando')) return 'outline';
  return 'default';
};

type SortOrder = "createdAt" | "clientName" | "updatedAt";

function ProcessesPageComponent() {
  const searchParams = useSearchParams()
  const initialPhase = searchParams.get('phase') as string | null;

  const [processes, setProcesses] = React.useState<Process[]>([]);
  const [phases, setPhases] = React.useState<Phase[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isFormDialogOpen, setIsFormDialogOpen] = React.useState(false);
  const [editingProcess, setEditingProcess] = React.useState<Process | undefined>(undefined);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [processToDelete, setProcessToDelete] = React.useState<Process | null>(null);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [sortOrder, setSortOrder] = React.useState<SortOrder>("createdAt");
  const [phaseFilter, setPhaseFilter] = React.useState(initialPhase || "all");
  const [isDetailsSheetOpen, setIsDetailsSheetOpen] = React.useState(false);
  const [selectedProcessForDetails, setSelectedProcessForDetails] = React.useState<Process | null>(null);
  const { toast } = useToast();

  const fetchData = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const [processesFromDb, phasesFromDb] = await Promise.all([
          getProcesses(),
          getPhases()
      ]);
      setProcesses(processesFromDb);
      setPhases(phasesFromDb);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({
        title: "Erro ao buscar dados",
        description: "Não foi possível carregar a lista de processos e fases. Tente novamente mais tarde.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleOpenFormDialog = (proc?: Process) => {
    setEditingProcess(proc);
    setIsFormDialogOpen(true);
  };

  const handleCloseFormDialog = () => {
    setEditingProcess(undefined);
    setIsFormDialogOpen(false);
  };
  
  const handleOpenDetailsSheet = (proc: Process) => {
    setSelectedProcessForDetails(proc);
    setIsDetailsSheetOpen(true);
  };

  const handleCloseDetailsSheet = () => {
    setSelectedProcessForDetails(null);
    setIsDetailsSheetOpen(false);
  };

  const handleSubmitProcessForm = async (data: ProcessFormValues & { timeline?: TimelineEvent[] }) => {
    try {
      if (editingProcess) {
        const updatedData = { ...data, timeline: data.timeline || editingProcess.timeline };
        const updatedProcess = await updateProcess(editingProcess.id, updatedData);
        setProcesses(processes.map(p => (p.id === editingProcess.id ? updatedProcess : p)));
        toast({ title: "Processo atualizado!", description: `O processo para ${data.clients.join(', ')} foi atualizado.` });
      } else {
        const newProcessData = {
          ...data,
          documents: 0,
          timeline: data.timeline || []
        };
        await addProcess(newProcessData);
        toast({ title: "Processo adicionado!", description: `Novo processo para ${data.clients.join(', ')} foi adicionado.` });
      }
      handleCloseFormDialog();
      fetchData();
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
        toast({ title: "Processo excluído!", description: `O processo ${processToDelete.processNumber} foi excluído.`});
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
  
  const handleTimelineUpdate = async (processId: string, newTimeline: TimelineEvent[]) => {
    const processToUpdate = processes.find(p => p.id === processId);
    if (processToUpdate) {
        try {
            const updatedProcess = await updateProcess(processId, { timeline: newTimeline });
            
            // Atualiza o estado local para refletir a mudança imediatamente
            const updatedProcesses = processes.map(p => p.id === processId ? updatedProcess : p);
            setProcesses(updatedProcesses);
            
            // Atualiza também o processo que está no painel de detalhes
            if (selectedProcessForDetails && selectedProcessForDetails.id === processId) {
                setSelectedProcessForDetails(updatedProcess);
            }

            toast({ title: "Linha do Tempo Atualizada!" });
        } catch (error) {
            console.error("Failed to update timeline:", error);
            toast({ title: "Erro ao atualizar", description: "Não foi possível salvar a atualização da linha do tempo.", variant: "destructive" });
        }
    }
};

  const sortedAndFilteredProcesses = React.useMemo(() => {
    let filtered = processes;
    
    if (phaseFilter && phaseFilter !== 'all') {
        filtered = filtered.filter(proc => (proc.phaseName || 'Não Classificado') === phaseFilter);
    }
    
    if (searchTerm) {
        filtered = filtered.filter(proc =>
            (proc.processNumber && proc.processNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (proc.clients && proc.clients.some(c => c.toLowerCase().includes(searchTerm.toLowerCase()))) ||
            (proc.type && proc.type.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (proc.apensos && proc.apensos.some(a => a.toLowerCase().includes(searchTerm.toLowerCase()))) ||
            (proc.phaseName && proc.phaseName.toLowerCase().includes(searchTerm.toLowerCase()))
        );
    }

    switch (sortOrder) {
      case 'clientName':
        return filtered.sort((a, b) => (a.clients?.[0] || '').localeCompare(b.clients?.[0] || ''));
      case 'updatedAt':
        return filtered.sort((a, b) => {
          const lastUpdateA = a.timeline && a.timeline.length > 0 ? parseISO(a.timeline[0].date).getTime() : 0;
          const lastUpdateB = b.timeline && b.timeline.length > 0 ? parseISO(b.timeline[0].date).getTime() : 0;
          return lastUpdateB - lastUpdateA;
        });
      case 'createdAt':
      default:
        return filtered.sort((a, b) => {
            const dateA = a.createdAt ? parseISO(a.createdAt).getTime() : 0;
            const dateB = b.createdAt ? parseISO(b.createdAt).getTime() : 0;
            return dateB - dateA;
        });
    }
  }, [processes, searchTerm, sortOrder, phaseFilter]);


  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-4xl font-headline font-extrabold text-primary">Acompanhamento de Processos</h1>
        <Button onClick={() => handleOpenFormDialog()}>
          <PlusCircle className="mr-2 h-5 w-5" /> Adicionar Processo
        </Button>
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2 flex-1 min-w-[250px] max-w-sm">
          <Search className="h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Buscar por Nº, cliente, tipo, fase..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-4">
         <Select onValueChange={(value) => setPhaseFilter(value)} value={phaseFilter}>
            <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filtrar por fase..." />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="all">Todas as Fases</SelectItem>
                <SelectItem value="Não Classificado">Não Classificado</SelectItem>
                {phases.map(phase => (
                    <SelectItem key={phase.id} value={phase.name}>{phase.name}</SelectItem>
                ))}
            </SelectContent>
         </Select>
         <Select onValueChange={(value: SortOrder) => setSortOrder(value)} defaultValue={sortOrder}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Ordenar por..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="createdAt">Data de Criação</SelectItem>
            <SelectItem value="clientName">Nome do Cliente</SelectItem>
            <SelectItem value="updatedAt">Última Atualização</SelectItem>
          </SelectContent>
        </Select>
        </div>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Lista de Processos</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nº Processo</TableHead>
                <TableHead>Apenso</TableHead>
                <TableHead>Cliente(s)</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Fase do Pipeline</TableHead>
                <TableHead>Próximo Prazo</TableHead>
                <TableHead className="text-center">UHD</TableHead>
                <TableHead className="text-center">Certidão</TableHead>
                <TableHead className="text-center">Expresso Goiás</TableHead>
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
              ) : sortedAndFilteredProcesses.length > 0 ? (
                sortedAndFilteredProcesses.map((process) => (
                  <TableRow key={process.id} className="hover:bg-muted/50 cursor-pointer" onClick={() => handleOpenDetailsSheet(process)}>
                    <TableCell className="font-medium text-lime-500">{process.processNumber}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {process.apensos?.map(apenso => <Badge key={apenso} variant="secondary">{apenso}</Badge>)}
                      </div>
                    </TableCell>
                    <TableCell>{(process.clients || []).join(', ')}</TableCell>
                    <TableCell>{process.type}</TableCell>
                    <TableCell>
                      <Badge variant={getPhaseBadgeVariant(process.phaseName)}>{process.phaseName}</Badge>
                    </TableCell>
                    <TableCell>{process.nextDeadline}</TableCell>
                    <TableCell className="text-center">{process.uhd}</TableCell>
                    <TableCell className="text-center">
                      {process.certidao ? (
                        <CheckCircle className="h-5 w-5 text-green-600 mx-auto" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500 mx-auto" />
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {process.expressoGoias ? (
                        <CheckCircle className="h-5 w-5 text-green-600 mx-auto" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500 mx-auto" />
                      )}
                    </TableCell>
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" className="hover:text-accent" onClick={() => handleOpenDetailsSheet(process)} title="Ver Detalhes/Timeline">
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
                    Nenhum processo encontrado com os filtros atuais.
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
      
       <ProcessDetailsSheet
        isOpen={isDetailsSheetOpen}
        onClose={handleCloseDetailsSheet}
        processData={selectedProcessForDetails}
        onTimelineUpdate={handleTimelineUpdate}
        onOpenEditDialog={handleOpenFormDialog}
      />

      {processToDelete && (
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir o processo "{processToDelete.processNumber} - {(processToDelete.clients || []).join(', ')}"? Esta ação não poderá ser desfeita.
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

// React.Suspense é necessário para usar o useSearchParams no lado do cliente em App Router
export default function ProcessesPage() {
  return (
    <React.Suspense fallback={<div>Carregando...</div>}>
      <ProcessesPageComponent />
    </React.Suspense>
  );
}


"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { PlusCircle, Edit, FolderOpen, Trash2, Search } from "lucide-react";
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
import { ProcessFormDialog, type ProcessFormValues, type Process } from "@/components/processes/ProcessFormDialog";

const initialProcesses: Process[] = [
  { id: "PROC001", client: "Empresa Alpha Ltda.", type: "Cível", status: "Em Andamento", nextDeadline: "2024-08-15", documents: 5 },
  { id: "PROC002", client: "João Silva", type: "Trabalhista", status: "Concluído", nextDeadline: "-", documents: 3 },
  { id: "PROC003", client: "Maria Oliveira", type: "Tributário", status: "Suspenso", nextDeadline: "2024-09-01", documents: 8 },
  { id: "PROC004", client: "Construtora Beta S.A.", type: "Administrativo", status: "Em Andamento", nextDeadline: "2024-07-30", documents: 2 },
];

const getStatusBadgeVariant = (status: string) => {
  switch (status) {
    case "Em Andamento": return "default";
    case "Concluído": return "secondary"; 
    case "Suspenso": return "outline"; // Changed to outline for better contrast with destructive actions
    default: return "outline";
  }
}

export default function ProcessesPage() {
  const [processes, setProcesses] = React.useState<Process[]>(initialProcesses);
  const [isFormDialogOpen, setIsFormDialogOpen] = React.useState(false);
  const [editingProcess, setEditingProcess] = React.useState<Process | undefined>(undefined);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [processToDelete, setProcessToDelete] = React.useState<Process | null>(null);
  const { toast } = useToast();

  const handleOpenFormDialog = (proc?: Process) => {
    setEditingProcess(proc);
    setIsFormDialogOpen(true);
  };

  const handleCloseFormDialog = () => {
    setEditingProcess(undefined);
    setIsFormDialogOpen(false);
  };

  const handleSubmitProcessForm = (data: ProcessFormValues) => {
    if (editingProcess) {
      setProcesses(processes.map(p => 
        p.id === editingProcess.id ? { ...editingProcess, ...data, documents: editingProcess.documents } : p
      ));
      toast({ title: "Processo atualizado!", description: `O processo ${data.client} - ${data.type} foi atualizado.` });
    } else {
      const newProcess: Process = {
        id: `PROC${String(processes.length + 1).padStart(3, '0')}`,
        ...data,
        documents: 0, // Default for new process
      };
      setProcesses([...processes, newProcess]);
      toast({ title: "Processo adicionado!", description: `Novo processo para ${newProcess.client} foi adicionado.` });
    }
    handleCloseFormDialog();
  };

  const handleDeleteConfirmation = (proc: Process) => {
    setProcessToDelete(proc);
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteProcess = () => {
    if (processToDelete) {
      setProcesses(processes.filter(p => p.id !== processToDelete.id));
      toast({ title: "Processo excluído!", description: `O processo ${processToDelete.id} foi excluído.`});
      setProcessToDelete(null);
    }
    setIsDeleteDialogOpen(false);
  };
  
  const handleOpenFolder = (proc: Process) => {
    console.log("Abrir pasta do processo:", proc);
    toast({ title: "Ação: Abrir Pasta", description: `Simulando abertura da pasta do processo: ${proc.id}` });
  };

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
          placeholder="Buscar processos por Nº, cliente ou tipo..."
          className="max-w-sm"
          // onChange={(e) => setSearchTerm(e.target.value)} // Lógica de filtro a ser implementada
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
                <TableHead>Cliente</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Próximo Prazo</TableHead>
                <TableHead className="text-center">Docs</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {processes.map((process) => (
                <TableRow key={process.id}>
                  <TableCell className="font-medium">{process.id}</TableCell>
                  <TableCell>{process.client}</TableCell>
                  <TableCell>{process.type}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(process.status) as any}>{process.status}</Badge>
                  </TableCell>
                  <TableCell>{process.nextDeadline}</TableCell>
                  <TableCell className="text-center">{process.documents}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" className="hover:text-accent" onClick={() => handleOpenFormDialog(process)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="hover:text-accent" onClick={() => handleOpenFolder(process)}>
                      <FolderOpen className="h-4 w-4" />
                    </Button>
                     <Button variant="ghost" size="icon" className="hover:text-destructive" onClick={() => handleDeleteConfirmation(process)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
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
                Tem certeza que deseja excluir o processo "{processToDelete.id} - {processToDelete.client}"? Esta ação não poderá ser desfeita.
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


"use client";

import * as React from "react";
import { PlusCircle, Edit, Trash2, Search, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
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
import { ClientFormDialog, type ClientFormValues, type Client } from "@/components/clients/ClientFormDialog";
import { ClientDetailsDialog } from "@/components/clients/ClientDetailsDialog";
import { useToast } from "@/hooks/use-toast";
import { addClient, deleteClient, getClients, updateClient } from "@/services/clientService";
import { Skeleton } from "@/components/ui/skeleton";
import { getProcesses } from "@/services/processService";
import type { Process } from "@/components/processes/ProcessFormDialog";

export default function ClientsPage() {
  const [clients, setClients] = React.useState<Client[]>([]);
  const [processes, setProcesses] = React.useState<Process[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isFormDialogOpen, setIsFormDialogOpen] = React.useState(false);
  const [editingClient, setEditingClient] = React.useState<Client | undefined>(undefined);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [clientToDelete, setClientToDelete] = React.useState<Client | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = React.useState(false);
  const [selectedClientForDetails, setSelectedClientForDetails] = React.useState<Client | null>(null);
  const [searchTerm, setSearchTerm] = React.useState("");
  const { toast } = useToast();

  const fetchData = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const [clientsFromDb, processesFromDb] = await Promise.all([
        getClients(),
        getProcesses()
      ]);
      setClients(clientsFromDb);
      setProcesses(processesFromDb);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({
        title: "Erro ao buscar dados",
        description: "Não foi possível carregar a lista de clientes e processos. Tente novamente mais tarde.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleOpenFormDialog = (client?: Client) => {
    setEditingClient(client);
    setIsFormDialogOpen(true);
  };

  const handleCloseFormDialog = () => {
    setEditingClient(undefined);
    setIsFormDialogOpen(false);
  };

  const handleSubmitClientForm = async (data: ClientFormValues) => {
    try {
      if (editingClient) {
        const updatedClient = await updateClient(editingClient.id, data);
        setClients(clients.map(c => (c.id === editingClient.id ? { ...c, ...updatedClient } : c)));
        toast({ title: "Cliente atualizado!", description: `O cliente ${data.name} foi atualizado com sucesso.` });
      } else {
        await addClient({
          ...data,
          caseCount: 0,
          lastActivity: new Date().toISOString().split('T')[0],
        });
        toast({ title: "Cliente adicionado!", description: `O cliente ${data.name} foi adicionado com sucesso.` });
        fetchData(); // Re-fetch para garantir que a lista está atualizada.
      }
      handleCloseFormDialog();
    } catch (error) {
        console.error("Failed to save client: ", error);
        toast({ title: "Erro ao salvar", description: "Não foi possível salvar o cliente.", variant: "destructive" });
    }
  };

  const handleDeleteConfirmation = (client: Client) => {
    setClientToDelete(client);
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteClient = async () => {
    if (clientToDelete) {
      try {
        await deleteClient(clientToDelete.id);
        setClients(clients.filter(c => c.id !== clientToDelete.id));
        toast({ title: "Cliente excluído!", description: `O cliente ${clientToDelete.name} foi excluído.` });
      } catch (error) {
        console.error("Failed to delete client:", error);
        toast({ title: "Erro ao excluir", description: "Não foi possível excluir o cliente.", variant: "destructive" });
      } finally {
        setClientToDelete(null);
        setIsDeleteDialogOpen(false);
      }
    }
  };

  const handleOpenDetailsDialog = (client: Client) => {
    setSelectedClientForDetails(client);
    setIsDetailsDialogOpen(true);
  };

  const handleCloseDetailsDialog = () => {
    setSelectedClientForDetails(null);
    setIsDetailsDialogOpen(false);
  };
  
  const filteredClients = clients.filter(client =>
    (client.name && client.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (client.contact && client.contact.toLowerCase().includes(searchTerm.toLowerCase()))
  );


  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
        <h1 className="text-3xl md:text-4xl font-headline font-extrabold text-primary">Gestão de Clientes</h1>
        <Button onClick={() => handleOpenFormDialog()} className="w-full md:w-auto">
          <PlusCircle className="mr-2 h-5 w-5" /> Adicionar Cliente
        </Button>
      </div>

      <div className="mb-6 flex items-center gap-2">
        <Search className="h-5 w-5 text-muted-foreground" />
        <Input
          placeholder="Buscar clientes por nome ou contato..."
          className="max-w-sm"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Tabela para Desktop */}
      <Card className="shadow-lg hidden md:block">
        <CardHeader>
          <CardTitle>Lista de Clientes</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Contato</TableHead>
                <TableHead className="text-center">Nº Casos</TableHead>
                <TableHead>Última Atividade</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                    <TableCell className="text-center"><Skeleton className="h-4 w-8 mx-auto" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-8 w-20" /></TableCell>
                  </TableRow>
                ))
              ) : filteredClients.length > 0 ? (
                filteredClients.map((client) => (
                  <TableRow
                    key={client.id}
                    onClick={() => handleOpenDetailsDialog(client)}
                    className="cursor-pointer hover:bg-muted/60"
                  >
                    <TableCell className="font-medium">{client.name}</TableCell>
                    <TableCell>{client.contact}</TableCell>
                    <TableCell className="text-center">{processes.filter(p => p.clients?.includes(client.name)).length}</TableCell>
                    <TableCell>{client.lastActivity}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="hover:text-accent"
                        onClick={(e) => { e.stopPropagation(); handleOpenFormDialog(client); }}
                        aria-label="Editar cliente"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="hover:text-destructive"
                        onClick={(e) => { e.stopPropagation(); handleDeleteConfirmation(client); }}
                        aria-label="Excluir cliente"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center h-24">
                    Nenhum cliente encontrado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      {/* Lista de Cartões para Mobile */}
      <div className="md:hidden space-y-4">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="shadow-lg"><CardContent className="p-4"><Skeleton className="h-24 w-full" /></CardContent></Card>
          ))
        ) : filteredClients.length > 0 ? (
          filteredClients.map((client) => (
             <Card
              key={client.id}
              onClick={() => handleOpenDetailsDialog(client)}
              className="shadow-md active:bg-muted/50"
            >
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <p className="font-bold text-primary">{client.name}</p>
                    <p className="text-sm text-muted-foreground">{client.contact}</p>
                    <p className="text-xs text-muted-foreground">
                      Casos: {processes.filter(p => p.clients?.includes(client.name)).length}
                    </p>
                  </div>
                   <div className="flex flex-col items-end -mr-2 -mt-2">
                     <Button
                        variant="ghost"
                        size="icon"
                        className="hover:text-accent"
                        onClick={(e) => { e.stopPropagation(); handleOpenFormDialog(client); }}
                        aria-label="Editar cliente"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="hover:text-destructive"
                        onClick={(e) => { e.stopPropagation(); handleDeleteConfirmation(client); }}
                        aria-label="Excluir cliente"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                   </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
           <Card className="text-center py-10">
              <CardContent>
                <p className="text-muted-foreground">Nenhum cliente encontrado.</p>
              </CardContent>
            </Card>
        )}
      </div>

      <ClientFormDialog
        isOpen={isFormDialogOpen}
        onClose={handleCloseFormDialog}
        onSubmit={handleSubmitClientForm}
        clientData={editingClient}
      />

      <ClientDetailsDialog
        isOpen={isDetailsDialogOpen}
        onClose={handleCloseDetailsDialog}
        clientData={selectedClientForDetails}
        allProcesses={processes}
      />

      {clientToDelete && (
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir o cliente "{clientToDelete.name}"? Esta ação não poderá ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setIsDeleteDialogOpen(false)}>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDeleteClient} className="bg-destructive hover:bg-destructive/90">Excluir</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}

    

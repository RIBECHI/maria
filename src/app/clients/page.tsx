
"use client";

import * as React from "react";
import { PlusCircle, Edit, Trash2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { useToast } from "@/hooks/use-toast";

const initialClients: Client[] = [
  { id: "CLI001", name: "Empresa Alpha Ltda.", contact: "contato@alpha.com / (11) 98765-4321", caseCount: 3, lastActivity: "2024-07-20" },
  { id: "CLI002", name: "João Silva", contact: "joao.silva@email.com / (21) 91234-5678", caseCount: 1, lastActivity: "2024-07-15" },
  { id: "CLI003", name: "Maria Oliveira", contact: "maria.o@server.com / (31) 99999-8888", caseCount: 5, lastActivity: "2024-07-22" },
  { id: "CLI004", name: "Construtora Beta S.A.", contact: "juridico@beta.com / (41) 98888-7777", caseCount: 2, lastActivity: "2024-06-30" },
];

export default function ClientsPage() {
  const [clients, setClients] = React.useState<Client[]>(initialClients);
  const [isFormDialogOpen, setIsFormDialogOpen] = React.useState(false);
  const [editingClient, setEditingClient] = React.useState<Client | undefined>(undefined);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [clientToDelete, setClientToDelete] = React.useState<Client | null>(null);
  const { toast } = useToast();

  const handleOpenFormDialog = (client?: Client) => {
    setEditingClient(client);
    setIsFormDialogOpen(true);
  };

  const handleCloseFormDialog = () => {
    setEditingClient(undefined);
    setIsFormDialogOpen(false);
  };

  const handleSubmitClientForm = (data: ClientFormValues) => {
    if (editingClient) {
      // Editar cliente
      setClients(clients.map(c => 
        c.id === editingClient.id ? { ...editingClient, ...data } : c
      ));
      toast({ title: "Cliente atualizado!", description: `O cliente ${data.name} foi atualizado com sucesso.` });
    } else {
      // Adicionar novo cliente
      const newClient: Client = {
        id: `CLI${String(clients.length + 1).padStart(3, '0')}`, // Simple ID generation
        ...data,
        caseCount: 0, // Default para novo cliente
        lastActivity: new Date().toISOString().split('T')[0], // Data atual
      };
      setClients([...clients, newClient]);
      toast({ title: "Cliente adicionado!", description: `O cliente ${newClient.name} foi adicionado com sucesso.` });
    }
    handleCloseFormDialog();
  };

  const handleDeleteConfirmation = (client: Client) => {
    setClientToDelete(client);
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteClient = () => {
    if (clientToDelete) {
      setClients(clients.filter(c => c.id !== clientToDelete.id));
      toast({ title: "Cliente excluído!", description: `O cliente ${clientToDelete.name} foi excluído.`});
      setClientToDelete(null);
    }
    setIsDeleteDialogOpen(false);
  };

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-headline font-bold text-primary">Gestão de Clientes</h1>
        <Button onClick={() => handleOpenFormDialog()}>
          <PlusCircle className="mr-2 h-5 w-5" /> Adicionar Cliente
        </Button>
      </div>

      <div className="mb-6 flex items-center gap-2">
        <Search className="h-5 w-5 text-muted-foreground" />
        <Input
          placeholder="Buscar clientes por nome, ID ou contato..."
          className="max-w-sm"
          // onChange={(e) => setSearchTerm(e.target.value)} // Lógica de filtro a ser implementada
        />
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl font-headline">Lista de Clientes</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Contato</TableHead>
                <TableHead className="text-center">Nº Casos</TableHead>
                <TableHead>Última Atividade</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clients.map((client) => (
                <TableRow key={client.id}>
                  <TableCell>{client.id}</TableCell>
                  <TableCell className="font-medium">{client.name}</TableCell>
                  <TableCell>{client.contact}</TableCell>
                  <TableCell className="text-center">{client.caseCount}</TableCell>
                  <TableCell>{client.lastActivity}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" className="hover:text-accent" onClick={() => handleOpenFormDialog(client)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="hover:text-destructive" onClick={() => handleDeleteConfirmation(client)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <ClientFormDialog
        isOpen={isFormDialogOpen}
        onClose={handleCloseFormDialog}
        onSubmit={handleSubmitClientForm}
        clientData={editingClient}
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


"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { List, ListItem } from "@/components/ui/list";
import type { Client } from "./ClientFormDialog"; // Reutilizando a tipagem

// Lista de clientes de exemplo para prototipagem.
// Em um aplicativo real, isso viria de um estado global, API, etc.
const initialClients: Client[] = [
  { id: "CLI001", name: "Empresa Alpha Ltda.", contact: "contato@alpha.com / (11) 98765-4321", caseCount: 3, lastActivity: "2024-07-20" },
  { id: "CLI002", name: "João Silva", contact: "joao.silva@email.com / (21) 91234-5678", caseCount: 1, lastActivity: "2024-07-15" },
  { id: "CLI003", name: "Maria Oliveira", contact: "maria.o@server.com / (31) 99999-8888", caseCount: 5, lastActivity: "2024-07-22" },
  { id: "CLI004", name: "Construtora Beta S.A.", contact: "juridico@beta.com / (41) 98888-7777", caseCount: 2, lastActivity: "2024-06-30" },
  { id: "CLI005", name: "Pedro Almeida", contact: "pedro.almeida@mail.com / (51) 97777-6666", caseCount: 0, lastActivity: "2024-07-25"},
];

interface ClientSearchDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onClientSelected: (clientName: string) => void;
}

export function ClientSearchDialog({ isOpen, onClose, onClientSelected }: ClientSearchDialogProps) {
  const [searchTerm, setSearchTerm] = React.useState("");

  const filteredClients = initialClients.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelectClient = (clientName: string) => {
    onClientSelected(clientName);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Buscar Cliente</DialogTitle>
          <DialogDescription>
            Digite para buscar um cliente ou selecione um da lista.
          </DialogDescription>
        </DialogHeader>
        <Input
          type="text"
          placeholder="Buscar cliente por nome..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="my-4"
        />
        <ScrollArea className="h-[300px] w-full">
          <List>
            {filteredClients.length > 0 ? (
              filteredClients.map((client) => (
                <ListItem key={client.id} className="p-0">
                  <Button
                    variant="ghost"
                    className="w-full justify-start p-2 h-auto"
                    onClick={() => handleSelectClient(client.name)}
                  >
                    <div className="flex flex-col items-start">
                       <span className="font-medium">{client.name}</span>
                       <span className="text-xs text-muted-foreground">{client.contact}</span>
                    </div>
                  </Button>
                </ListItem>
              ))
            ) : (
              <ListItem className="text-center text-muted-foreground">Nenhum cliente encontrado.</ListItem>
            )}
          </List>
        </ScrollArea>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

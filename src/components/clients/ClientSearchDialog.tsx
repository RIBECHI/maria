
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
import { getClients } from "@/services/clientService";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

interface ClientSearchDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onClientSelected: (clientName: string) => void;
}

export function ClientSearchDialog({ isOpen, onClose, onClientSelected }: ClientSearchDialogProps) {
  const [searchTerm, setSearchTerm] = React.useState("");
  const [clients, setClients] = React.useState<Client[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const { toast } = useToast();

  React.useEffect(() => {
    if (isOpen) {
      const fetchClients = async () => {
        setIsLoading(true);
        try {
          const clientsFromDb = await getClients();
          setClients(clientsFromDb);
        } catch (error) {
          console.error("Error fetching clients for search:", error);
          toast({
            title: "Erro ao buscar clientes",
            description: "Não foi possível carregar a lista para busca.",
            variant: "destructive",
          });
        } finally {
          setIsLoading(false);
        }
      };
      fetchClients();
    }
  }, [isOpen, toast]);

  const filteredClients = clients.filter(client =>
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
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <ListItem key={i} className="p-2">
                    <div className="flex flex-col gap-2">
                        <Skeleton className="h-4 w-40" />
                        <Skeleton className="h-3 w-60" />
                    </div>
                </ListItem>
              ))
            ) : filteredClients.length > 0 ? (
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

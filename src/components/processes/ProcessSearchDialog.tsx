
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
import type { Process } from "./ProcessFormDialog"; // Reutilizando a tipagem

// Lista de processos de exemplo para prototipagem.
// Em um aplicativo real, isso viria de um estado global, API, etc.
const initialProcesses: Process[] = [
  { id: "PROC001", client: "Empresa Alpha Ltda.", type: "Cível", status: "Em Andamento", nextDeadline: "2024-08-15", documents: 5 },
  { id: "PROC002", client: "João Silva", type: "Trabalhista", status: "Concluído", nextDeadline: "-", documents: 3 },
  { id: "PROC003", client: "Maria Oliveira", type: "Tributário", status: "Suspenso", nextDeadline: "2024-09-01", documents: 8 },
  { id: "PROC004", client: "Construtora Beta S.A.", type: "Administrativo", status: "Em Andamento", nextDeadline: "2024-07-30", documents: 2 },
  { id: "PROC005", client: "Empresa Alpha Ltda.", type: "Contratual", status: "Em Andamento", nextDeadline: "2024-10-10", documents: 1 },
];


interface ProcessSearchDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onProcessSelected: (processId: string) => void;
}

export function ProcessSearchDialog({ isOpen, onClose, onProcessSelected }: ProcessSearchDialogProps) {
  const [searchTerm, setSearchTerm] = React.useState("");

  const filteredProcesses = initialProcesses.filter(proc =>
    proc.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    proc.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
    proc.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelectProcess = (processId: string) => {
    onProcessSelected(processId);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Buscar Processo</DialogTitle>
          <DialogDescription>
            Digite para buscar um processo por ID, cliente ou tipo, ou selecione um da lista.
          </DialogDescription>
        </DialogHeader>
        <Input
          type="text"
          placeholder="Buscar processo..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="my-4"
        />
        <ScrollArea className="h-[300px] w-full">
          <List>
            {filteredProcesses.length > 0 ? (
              filteredProcesses.map((proc) => (
                <ListItem key={proc.id} className="p-0">
                  <Button
                    variant="ghost"
                    className="w-full justify-start p-2 h-auto"
                    onClick={() => handleSelectProcess(proc.id)}
                  >
                    <div className="flex flex-col items-start">
                       <span className="font-medium">{proc.id} - {proc.type}</span>
                       <span className="text-xs text-muted-foreground">Cliente: {proc.client}</span>
                       <span className="text-xs text-muted-foreground">Status: {proc.status}</span>
                    </div>
                  </Button>
                </ListItem>
              ))
            ) : (
              <ListItem className="text-center text-muted-foreground">Nenhum processo encontrado.</ListItem>
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

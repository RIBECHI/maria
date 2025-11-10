
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
import type { Process } from "./ProcessFormDialog";
import { getProcesses } from "@/services/processService";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

interface ProcessSearchDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onProcessSelected: (processId: string) => void;
}

export function ProcessSearchDialog({ isOpen, onClose, onProcessSelected }: ProcessSearchDialogProps) {
  const [searchTerm, setSearchTerm] = React.useState("");
  const [processes, setProcesses] = React.useState<Process[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const { toast } = useToast();

  React.useEffect(() => {
    if (isOpen) {
      const fetchProcesses = async () => {
        setIsLoading(true);
        try {
          const procsFromDb = await getProcesses();
          setProcesses(procsFromDb);
        } catch (error) {
          console.error("Error fetching processes for search:", error);
          toast({
            title: "Erro ao buscar processos",
            description: "Não foi possível carregar a lista para busca.",
            variant: "destructive",
          });
        } finally {
          setIsLoading(false);
        }
      };
      fetchProcesses();
    }
  }, [isOpen, toast]);

  const filteredProcesses = processes.filter(proc =>
    (proc.processNumber && proc.processNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (proc.client && proc.client.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (proc.type && proc.type.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleSelectProcess = (processNumber: string) => {
    onProcessSelected(processNumber);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Buscar Processo</DialogTitle>
          <DialogDescription>
            Digite para buscar um processo por Nº, cliente ou tipo, ou selecione um da lista.
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
            {isLoading ? (
               Array.from({ length: 3 }).map((_, i) => (
                <ListItem key={i} className="p-2">
                    <div className="flex flex-col gap-2">
                        <Skeleton className="h-4 w-48" />
                        <Skeleton className="h-3 w-64" />
                    </div>
                </ListItem>
              ))
            ) : filteredProcesses.length > 0 ? (
              filteredProcesses.map((proc) => (
                <ListItem key={proc.id} className="p-0">
                  <Button
                    variant="ghost"
                    className="w-full justify-start p-2 h-auto"
                    onClick={() => handleSelectProcess(proc.processNumber)}
                  >
                    <div className="flex flex-col items-start text-left">
                       <span className="font-medium">{proc.processNumber}</span>
                       <span className="text-xs text-muted-foreground">Cliente: {proc.client}</span>
                       <span className="text-xs text-muted-foreground">Tipo: {proc.type} | Status: {proc.status}</span>
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

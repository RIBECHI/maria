
"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import type { Client } from "./ClientFormDialog";
import { List, ListItem } from "@/components/ui/list";
import { Briefcase } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

interface ClientDetailsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  clientData?: Client | null;
}

// Mock de dados de processos para simular a relação cliente-processo
// Em um app real, isso viria do estado da aplicação ou de uma API.
const MOCK_PROCESSES = [
  { id: "PROC001", client: "Empresa Alpha Ltda.", type: "Cível", status: "Em Andamento" as const },
  { id: "PROC002", client: "João Silva", type: "Trabalhista", status: "Concluído" as const },
  { id: "PROC003", client: "Maria Oliveira", type: "Tributário", status: "Suspenso" as const },
  { id: "PROC004", client: "Construtora Beta S.A.", type: "Administrativo", status: "Em Andamento" as const },
  { id: "PROC005", client: "Maria Oliveira", type: "Consumidor", status: "Em Andamento" as const },
];

const getStatusBadgeVariant = (status: string) => {
  switch (status) {
    case "Em Andamento": return "default";
    case "Concluído": return "secondary"; 
    case "Suspenso": return "outline";
    default: return "outline";
  }
}

export function ClientDetailsDialog({ isOpen, onClose, clientData }: ClientDetailsDialogProps) {
  if (!clientData) {
    return null;
  }

  const detailItemClass = "flex py-2.5 border-b border-border/50 last:border-b-0";
  const labelClass = "font-semibold text-muted-foreground w-[140px] shrink-0"; 
  const valueClass = "text-foreground break-words";

  const clientProcesses = MOCK_PROCESSES.filter(
    (process) => process.client === clientData.name
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Detalhes do Cliente: {clientData.name}</DialogTitle>
          <DialogDescription>
            Informações completas e processos vinculados ao cliente.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-1 max-h-[60vh] overflow-y-auto pr-2">
          {/* Informações do Cliente */}
          <div className={detailItemClass}>
            <span className={labelClass}>ID do Cliente:</span>
            <span className={valueClass}>{clientData.id}</span>
          </div>
          <div className={detailItemClass}>
            <span className={labelClass}>Nome / Razão Social:</span>
            <span className={valueClass}>{clientData.name}</span>
          </div>
           <div className={detailItemClass}>
            <span className={labelClass}>CPF/CNPJ:</span>
            <span className={valueClass}>{clientData.cpf || "Não informado"}</span>
          </div>
           <div className={detailItemClass}>
            <span className={labelClass}>Cidade:</span>
            <span className={valueClass}>{clientData.city || "Não informado"}</span>
          </div>
          <div className={detailItemClass}>
            <span className={labelClass}>Informações de Contato:</span>
            <span className={valueClass}>{clientData.contact}</span>
          </div>
          <div className={detailItemClass}>
            <span className={labelClass}>Nº de Casos Ativos:</span>
            <span className={valueClass}>{clientData.caseCount}</span>
          </div>
          <div className={detailItemClass}>
            <span className="font-semibold text-muted-foreground w-[140px] shrink-0">Última Atividade:</span>
            <span className={valueClass}>{clientData.lastActivity}</span>
          </div>
           {clientData.notes && (
            <div className={detailItemClass}>
              <span className={labelClass}>Anotações:</span>
              <span className="text-foreground break-words whitespace-pre-wrap">{clientData.notes}</span>
            </div>
           )}
          
          {/* Seção de Processos Vinculados */}
          <div className="pt-4">
             <h3 className="font-semibold text-foreground mb-2 flex items-center">
                <Briefcase className="mr-2 h-4 w-4" />
                Processos Vinculados
             </h3>
             {clientProcesses.length > 0 ? (
                <List>
                    {clientProcesses.map((proc) => (
                        <ListItem key={proc.id} className="p-0 border-none">
                            <Link href="/processes" className="block w-full">
                                <div className="p-2 rounded-md hover:bg-muted/60 transition-colors cursor-pointer w-full">
                                    <div className="flex justify-between items-center">
                                        <span className="font-medium">{proc.id} - {proc.type}</span>
                                        <Badge variant={getStatusBadgeVariant(proc.status)}>{proc.status}</Badge>
                                    </div>
                                </div>
                            </Link>
                        </ListItem>
                    ))}
                </List>
             ) : (
                <p className="text-sm text-muted-foreground p-2">Nenhum processo vinculado a este cliente.</p>
             )}
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

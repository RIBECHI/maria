

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
import type { Process } from "@/components/processes/ProcessFormDialog";
import { List, ListItem } from "@/components/ui/list";
import { Briefcase } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

interface ClientDetailsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  clientData: Client | null;
  allProcesses: Process[];
}

const getPhaseBadgeVariant = (phaseName?: string) => {
  if (!phaseName) return "outline";
  const lowerCaseName = phaseName.toLowerCase();
  if (lowerCaseName.includes('concluído')) return 'secondary';
  if (lowerCaseName.includes('suspenso') || lowerCaseName.includes('aguardando')) return 'outline';
  return 'default';
};

export function ClientDetailsDialog({ isOpen, onClose, clientData, allProcesses }: ClientDetailsDialogProps) {
  if (!clientData) {
    return null;
  }

  const detailItemClass = "flex py-2.5 border-b border-border/50 last:border-b-0";
  const labelClass = "font-semibold text-muted-foreground w-[140px] shrink-0"; 
  const valueClass = "text-foreground break-words";

  const clientProcesses = allProcesses.filter(
    (process) => process.clients && process.clients.includes(clientData.name)
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
            <span className={labelClass}>Estado Civil:</span>
            <span className={valueClass}>{clientData.maritalStatus || "Não informado"}</span>
          </div>
           <div className={detailItemClass}>
            <span className={labelClass}>Ocupação:</span>
            <span className={valueClass}>{clientData.occupation || "Não informado"}</span>
          </div>
           <div className={detailItemClass}>
            <span className={labelClass}>Endereço:</span>
            <span className={valueClass}>{clientData.address || "Não informado"}</span>
          </div>
          <div className={detailItemClass}>
            <span className={labelClass}>Informações de Contato:</span>
            <span className={valueClass}>{clientData.contact}</span>
          </div>
          <div className={detailItemClass}>
            <span className={labelClass}>Nº de Casos Ativos:</span>
            <span className={valueClass}>{clientProcesses.length}</span>
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
                                        <span className="font-medium">{proc.processNumber} - {proc.type}</span>
                                        <Badge variant={getPhaseBadgeVariant(proc.phaseName)}>{proc.phaseName}</Badge>
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

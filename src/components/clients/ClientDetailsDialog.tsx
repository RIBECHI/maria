
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

interface ClientDetailsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  clientData?: Client | null;
}

export function ClientDetailsDialog({ isOpen, onClose, clientData }: ClientDetailsDialogProps) {
  if (!clientData) {
    return null;
  }

  const detailItemClass = "flex py-2.5 border-b border-border/50 last:border-b-0";
  const labelClass = "font-semibold text-muted-foreground w-[140px] shrink-0"; 
  const valueClass = "text-foreground break-words";

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Detalhes do Cliente: {clientData.name}</DialogTitle>
          <DialogDescription>
            Informações completas sobre o cliente selecionado.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-1 max-h-[60vh] overflow-y-auto pr-2">
          <div className={detailItemClass}>
            <span className={labelClass}>ID do Cliente:</span>
            <span className={valueClass}>{clientData.id}</span>
          </div>
          <div className={detailItemClass}>
            <span className={labelClass}>Nome / Razão Social:</span>
            <span className={valueClass}>{clientData.name}</span>
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
            <span className={labelClass}>Data da Última Atividade:</span>
            <span className={valueClass}>{clientData.lastActivity}</span>
          </div>
          {/* Você pode adicionar mais campos aqui, se necessário. Ex:
          <div className={detailItemClass}>
            <span className={labelClass}>Endereço:</span>
            <span className={valueClass}>{clientData.address || "Não informado"}</span>
          </div>
          <div className={detailItemClass}>
            <span className={labelClass}>Observações:</span>
            <span className={valueClass}>{clientData.notes || "Nenhuma observação"}</span>
          </div>
          */}
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


"use client";

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Process } from '@/components/processes/ProcessFormDialog';
import type { Phase } from '@/services/phaseService';
import { Calendar, MoreVertical, User } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from '../ui/button';

interface ProcessCardProps {
    process: Process;
    allPhases: Phase[];
    onCardClick: () => void;
    onMoveProcess: (processId: string, newPhaseId: string | null) => void;
}

const getStatusBadgeVariant = (status: string) => {
  switch (status) {
    case "Em Andamento": return "default";
    case "Concluído": return "secondary"; 
    case "Suspenso": return "outline";
    default: return "outline";
  }
}

const ProcessCard: React.FC<ProcessCardProps> = ({ process, allPhases, onCardClick, onMoveProcess }) => {
    
    const handleMoveClick = (e: React.MouseEvent, newPhaseId: string | null) => {
        e.stopPropagation(); // Evita que o onCardClick seja disparado
        onMoveProcess(process.id, newPhaseId);
    };
    
    return (
        <Card
            className="shadow-sm hover:shadow-md hover:border-primary/50 transition-all cursor-pointer bg-card group"
            onClick={onCardClick}
        >
            <CardHeader className="p-3 pb-2">
                <div className="flex justify-between items-start">
                    <CardTitle className="text-base font-bold text-primary truncate pr-2">
                        {process.processNumber}
                    </CardTitle>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-6 w-6 opacity-50 group-hover:opacity-100 transition-opacity -mr-1 -mt-1"
                                onClick={(e) => e.stopPropagation()} // Impede o clique no card
                            >
                                <MoreVertical className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                            <DropdownMenuLabel>Mover Para</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {allPhases.map(phase => (
                                <DropdownMenuItem 
                                    key={phase.id} 
                                    onClick={(e) => handleMoveClick(e, phase.id)}
                                    disabled={process.phaseId === phase.id}
                                >
                                    {phase.name}
                                </DropdownMenuItem>
                            ))}
                             <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={(e) => handleMoveClick(e, null)} disabled={!process.phaseId}>
                                Não Classificado
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
                <CardDescription className="text-xs truncate">{process.type}</CardDescription>
            </CardHeader>
            <CardContent className="p-3 pt-0">
                <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <User className="h-4 w-4" />
                        <span className="truncate">{process.clients.join(', ')}</span>
                    </div>
                    {process.nextDeadline && process.nextDeadline !== '-' && (
                         <div className="flex items-center gap-2 text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            <span>
                                Prazo: {format(parseISO(process.nextDeadline), 'dd/MM/yyyy', { locale: ptBR })}
                            </span>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

export default ProcessCard;

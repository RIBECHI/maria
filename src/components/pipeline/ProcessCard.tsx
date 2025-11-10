
"use client";

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Process } from '@/components/processes/ProcessFormDialog';
import { Calendar, User } from 'lucide-react';
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
import { Button } from '@/components/ui/button';
import type { Phase } from '@/services/phaseService';

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
    onClick: () => void;
}

const getStatusBadgeVariant = (status: string) => {
  switch (status) {
    case "Em Andamento": return "default";
    case "Concluído": return "secondary"; 
    case "Suspenso": return "outline";
    default: return "outline";
  }
}

const ProcessCard: React.FC<ProcessCardProps> = ({ process, onClick }) => {
    return (
        <Card
            className="shadow-sm hover:shadow-md hover:border-primary/50 transition-all cursor-pointer bg-card"
            onClick={onClick}
        >
            <CardHeader className="p-3 pb-2">
                <div className="flex justify-between items-start">
                    <CardTitle className="text-base font-bold text-primary truncate">
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
            <CardFooter className="p-2 pt-0 justify-end">
                 <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 focus:opacity-100">
                           <MoreHorizontal className="h-5 w-5"/>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenuLabel className="flex items-center gap-2"><MoveRight className="h-4 w-4"/> Mover Para</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {phases.map(phase => (
                            <DropdownMenuItem
                                key={phase.id}
                                onSelect={(e) => handleMenuSelect(e, phase.id === 'unclassified' ? null : phase.id)}
                                disabled={(process.phaseId || null) === (phase.id === 'unclassified' ? null : phase.id)}
                            >
                                {phase.name}
                            </DropdownMenuItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>
            </CardFooter>
        </Card>
    );
}

export default ProcessCard;

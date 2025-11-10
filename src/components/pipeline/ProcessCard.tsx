
"use client";

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Process } from '@/components/processes/ProcessFormDialog';
import { Calendar, User } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

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
                    <Badge variant={getStatusBadgeVariant(process.status) as any}>{process.status}</Badge>
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

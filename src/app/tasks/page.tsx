
"use client";

import * as React from "react";
import { ListChecks, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { getProcesses } from "@/services/processService";
import type { Process } from "@/components/processes/ProcessFormDialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";


export default function TasksPage() {
    const [processesWithTasks, setProcessesWithTasks] = React.useState<Process[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);

    React.useEffect(() => {
        async function fetchTasks() {
            setIsLoading(true);
            try {
                const allProcesses = await getProcesses();
                const filteredProcesses = allProcesses.filter(p => p.timeline && p.timeline.some(t => t.isTask));
                
                // Para cada processo, filtramos para manter apenas as tarefas e as ordenamos
                const processesWithSortedTasks = filteredProcesses.map(p => {
                    const sortedTasks = (p.timeline || [])
                        .filter(t => t.isTask)
                        .sort((a, b) => (a.completed ? 1 : -1) - (b.completed ? 1 : -1) || new Date(a.date).getTime() - new Date(b.date).getTime());
                    return { ...p, timeline: sortedTasks };
                });

                setProcessesWithTasks(processesWithSortedTasks);

            } catch (error) {
                console.error("Failed to fetch tasks:", error);
                // Adicionar toast de erro aqui se necessário
            } finally {
                setIsLoading(false);
            }
        }

        fetchTasks();
    }, []);

    return (
        <div className="container mx-auto p-4 md:p-6 lg:p-8">
            <div className="flex items-center gap-4 mb-8">
                <ListChecks className="h-10 w-10 text-primary" />
                <h1 className="text-4xl font-headline font-extrabold text-primary">Tarefas Pendentes</h1>
            </div>

            {isLoading ? (
                <div className="space-y-4">
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-20 w-full" />
                </div>
            ) : processesWithTasks.length > 0 ? (
                 <Accordion type="multiple" defaultValue={processesWithTasks.map(p => p.id)} className="w-full space-y-4">
                    {processesWithTasks.map(process => (
                        <AccordionItem value={process.id} key={process.id} className="border-none">
                             <Card className="shadow-md">
                                <AccordionTrigger className="p-4 hover:no-underline">
                                    <div className="flex flex-col items-start text-left">
                                        <CardTitle className="text-lg">{process.processNumber}</CardTitle>
                                        <CardDescription>{process.client}</CardDescription>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="p-4 pt-0">
                                    <div className="space-y-2">
                                        {/* Futuramente, aqui ficará a lista de tarefas */}
                                        <p className="text-sm text-muted-foreground">Carregando tarefas...</p>
                                    </div>
                                </AccordionContent>
                             </Card>
                        </AccordionItem>
                    ))}
                 </Accordion>
            ) : (
                <Card className="text-center py-20">
                    <CardContent>
                        <h2 className="text-2xl font-semibold">Tudo em ordem!</h2>
                        <p className="text-muted-foreground mt-2">Nenhuma tarefa pendente encontrada em seus processos.</p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}

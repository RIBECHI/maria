
"use client";

import * as React from "react";
import { ListChecks, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { getProcesses, updateProcess } from "@/services/processService";
import type { Process, TimelineEvent } from "@/components/processes/ProcessFormDialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { format, parseISO } from "date-fns";


export default function TasksPage() {
    const [processesWithTasks, setProcessesWithTasks] = React.useState<Process[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const { toast } = useToast();

    const fetchTasks = React.useCallback(async () => {
        setIsLoading(true);
        try {
            const allProcesses = await getProcesses();
            
            const filteredProcesses = allProcesses
                .map(p => {
                    const tasks = (p.timeline || []).filter(t => t.isTask);
                    if (tasks.length === 0) return null;

                    const sortedTasks = tasks.sort((a, b) => {
                        if (a.completed !== b.completed) {
                            return a.completed ? 1 : -1;
                        }
                        return new Date(a.date).getTime() - new Date(b.date).getTime();
                    });
                    
                    return { ...p, timeline: sortedTasks };
                })
                .filter((p): p is Process => p !== null);

            setProcessesWithTasks(filteredProcesses);

        } catch (error) {
            console.error("Failed to fetch tasks:", error);
            toast({ title: "Erro ao buscar tarefas", description: "Não foi possível carregar as tarefas dos processos.", variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    }, [toast]);

    React.useEffect(() => {
        fetchTasks();
    }, [fetchTasks]);

    const handleToggleTask = async (processId: string, taskId: string) => {
        const process = processesWithTasks.find(p => p.id === processId);
        if (!process) return;

        const updatedTimeline = process.timeline!.map(task =>
            task.id === taskId ? { ...task, completed: !task.completed } : task
        );
        
        const updatedProcess = { ...process, timeline: updatedTimeline };

        try {
            await updateProcess(processId, updatedProcess);
            setProcessesWithTasks(prev => 
                prev.map(p => p.id === processId ? updatedProcess : p)
                  .map(p => { // Re-sort tasks within the updated process
                      const sortedTasks = (p.timeline || []).sort((a, b) => {
                          if (a.completed !== b.completed) {
                              return a.completed ? 1 : -1;
                          }
                          return new Date(a.date).getTime() - new Date(b.date).getTime();
                      });
                      return { ...p, timeline: sortedTasks };
                  })
            );

        } catch (error) {
            console.error("Failed to update task status:", error);
            toast({ title: "Erro ao atualizar tarefa", variant: "destructive" });
        }
    };

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
                                <AccordionTrigger className="p-4 hover:no-underline rounded-lg data-[state=open]:rounded-b-none">
                                    <div className="flex flex-col items-start text-left w-full">
                                        <div className="flex justify-between w-full">
                                            <CardTitle className="text-lg">{process.processNumber}</CardTitle>
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-medium text-muted-foreground">{process.timeline?.filter(t => !t.completed).length} pendente(s)</span>
                                            </div>
                                        </div>
                                        <CardDescription>{process.client}</CardDescription>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="p-4 pt-0">
                                    <div className="space-y-3 border-t pt-4">
                                        {process.timeline && process.timeline.map(task => (
                                            <div key={task.id} className="flex items-start gap-3">
                                                <Checkbox 
                                                    id={`task-${process.id}-${task.id}`}
                                                    checked={task.completed}
                                                    onCheckedChange={() => handleToggleTask(process.id, task.id)}
                                                    className="mt-1"
                                                />
                                                <label htmlFor={`task-${process.id}-${task.id}`} className="flex-1">
                                                    <span className={`block text-sm ${task.completed ? 'line-through text-muted-foreground' : ''}`}>
                                                        {task.description}
                                                    </span>
                                                     <span className={`block text-xs text-muted-foreground ${task.completed ? 'line-through' : ''}`}>
                                                        {format(parseISO(task.date), "dd/MM/yyyy")}
                                                    </span>
                                                </label>
                                            </div>
                                        ))}
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

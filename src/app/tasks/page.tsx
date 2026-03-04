
"use client";

import * as React from "react";
import { ListChecks, NotebookText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { getProcesses, updateProcess } from "@/services/processService";
import type { Process, TimelineEvent } from "@/components/processes/ProcessFormDialog";
import { getNotepadTasks, getNotes, saveNotes, type Note } from "@/services/notepadService";
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";


export default function TasksPage() {
    const [processesWithTasks, setProcessesWithTasks] = React.useState<Process[]>([]);
    const [notepadTasks, setNotepadTasks] = React.useState<Note[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const [filter, setFilter] = React.useState<'pending' | 'completed' | 'all'>('pending');
    const { toast } = useToast();

    const fetchTasks = React.useCallback(async () => {
        setIsLoading(true);
        try {
            const [allProcesses, allNotepadTasks] = await Promise.all([
                getProcesses(),
                getNotepadTasks()
            ]);
            setProcessesWithTasks(allProcesses);
            setNotepadTasks(allNotepadTasks);

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

    const handleToggleProcessTask = async (processId: string, taskId: string) => {
        const process = processesWithTasks.find(p => p.id === processId);
        if (!process) return;

        const updatedTimeline = process.timeline!.map(task =>
            task.id === taskId ? { ...task, completed: !task.completed } : task
        );
        
        const updatedProcess = { ...process, timeline: updatedTimeline };

        setProcessesWithTasks(prev => 
            prev.map(p => p.id === processId ? updatedProcess : p)
        );

        try {
            await updateProcess(processId, { ...updatedProcess });
        } catch (error) {
            console.error("Failed to update task status:", error);
            toast({ title: "Erro ao atualizar tarefa", variant: "destructive" });
            setProcessesWithTasks(prev => 
                prev.map(p => p.id === processId ? process : p)
            );
        }
    };

    const handleToggleNotepadTask = async (taskId: string) => {
        const originalNotes = [...notepadTasks];
        const noteToUpdate = notepadTasks.find(task => task.id === taskId);
        if (!noteToUpdate) return;
        
        const newStatus: Note['status'] = noteToUpdate.status === 'concluido' ? 'aberto' : 'concluido';

        const updatedNotes = notepadTasks.map(task =>
            task.id === taskId ? { ...task, status: newStatus } : task
        );
        setNotepadTasks(updatedNotes);
    
        try {
            const allNotes = await getNotes(); 
            const notesToSave = allNotes.map(n => n.id === taskId ? updatedNotes.find(un => un.id === taskId)! : n);
            await saveNotes(notesToSave);
        } catch (error) {
            console.error("Failed to update notepad task status:", error);
            toast({ title: "Erro ao atualizar tarefa do bloco de notas", variant: "destructive" });
            setNotepadTasks(originalNotes); // Revert on error
        }
    };
    
    const filteredProcessTasks = React.useMemo(() => {
        return processesWithTasks
            .map(p => {
                let tasks = (p.timeline || []).filter(t => t.isTask);

                if (filter === 'pending') tasks = tasks.filter(t => !t.completed);
                else if (filter === 'completed') tasks = tasks.filter(t => t.completed);
                
                if (tasks.length === 0) return null;

                const sortedTasks = tasks.sort((a, b) => {
                    if (a.completed !== b.completed) return a.completed ? 1 : -1;
                    return new Date(a.date).getTime() - new Date(b.date).getTime();
                });
                
                return { ...p, timeline: sortedTasks };
            })
            .filter((p): p is Process => p !== null);
    }, [processesWithTasks, filter]);

    const filteredNotepadTasks = React.useMemo(() => {
        let tasks = [...notepadTasks];
        if (filter === 'pending') tasks = tasks.filter(t => t.status === 'aberto' || t.status === 'urgente');
        else if (filter === 'completed') tasks = tasks.filter(t => t.status === 'concluido');

        return tasks.sort((a,b) => {
             if (a.status === b.status) return b.createdAt.toMillis() - a.createdAt.toMillis();
             if (a.status === 'concluido') return 1;
             if (b.status === 'concluido') return -1;
             return 0;
        });
    }, [notepadTasks, filter]);

    const hasAnyTasks = filteredProcessTasks.length > 0 || filteredNotepadTasks.length > 0;

    return (
        <div className="container mx-auto p-4 md:p-6 lg:p-8">
            <div className="flex items-center gap-4 mb-8">
                <ListChecks className="h-10 w-10 text-primary" />
                <div>
                    <h1 className="text-4xl font-headline font-extrabold text-primary">Tarefas</h1>
                    <p className="text-muted-foreground">Sua central de tarefas de todos os processos e anotações.</p>
                </div>
            </div>

            <Tabs defaultValue="pending" onValueChange={(value) => setFilter(value as any)} className="mb-6 w-full md:w-auto">
                <TabsList>
                    <TabsTrigger value="pending">Pendentes</TabsTrigger>
                    <TabsTrigger value="completed">Concluídas</TabsTrigger>
                    <TabsTrigger value="all">Todas</TabsTrigger>
                </TabsList>
            </Tabs>

            {isLoading ? (
                <div className="space-y-4">
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-20 w-full" />
                </div>
            ) : hasAnyTasks ? (
                 <Accordion type="multiple" defaultValue={['notepad-tasks', ...filteredProcessTasks.map(p => p.id)]} className="w-full space-y-4">
                    
                    {/* Tarefas do Bloco de Notas */}
                    {filteredNotepadTasks.length > 0 && (
                        <AccordionItem value="notepad-tasks" className="border-none">
                             <Card className="shadow-md">
                                <AccordionTrigger className="p-4 hover:no-underline rounded-lg data-[state=open]:rounded-b-none">
                                    <div className="flex flex-col items-start text-left w-full">
                                        <div className="flex justify-between items-center w-full">
                                            <CardTitle className="text-lg flex items-center gap-2"><NotebookText className="h-5 w-5"/>Tarefas Rápidas (do Bloco de Notas)</CardTitle>
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-medium text-muted-foreground">{filteredNotepadTasks.length} tarefa(s)</span>
                                            </div>
                                        </div>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="p-4 pt-0">
                                    <div className="space-y-3 border-t pt-4">
                                        {filteredNotepadTasks.map(task => (
                                            <div key={task.id} className="flex items-start gap-3">
                                                <Checkbox 
                                                    id={`task-note-${task.id}`}
                                                    checked={task.status === 'concluido'}
                                                    onCheckedChange={() => handleToggleNotepadTask(task.id)}
                                                    className="mt-1"
                                                />
                                                <label htmlFor={`task-note-${task.id}`} className="flex-1 cursor-pointer">
                                                    <span className={`block text-sm ${task.status === 'concluido' ? 'line-through text-muted-foreground' : ''}`}>
                                                        {task.content}
                                                    </span>
                                                     <span className={`block text-xs text-muted-foreground ${task.status === 'concluido' ? 'line-through' : ''}`}>
                                                        Criada por {task.author} em {format(task.createdAt.toDate(), "dd/MM/yyyy")}
                                                    </span>
                                                </label>
                                            </div>
                                        ))}
                                    </div>
                                </AccordionContent>
                             </Card>
                        </AccordionItem>
                    )}

                    {/* Tarefas dos Processos */}
                    {filteredProcessTasks.map(process => (
                        <AccordionItem value={process.id} key={process.id} className="border-none">
                             <Card className="shadow-md">
                                <AccordionTrigger className="p-4 hover:no-underline rounded-lg data-[state=open]:rounded-b-none">
                                    <div className="flex flex-col items-start text-left w-full">
                                        <div className="flex justify-between w-full">
                                            <CardTitle className="text-lg">{process.processNumber}</CardTitle>
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-medium text-muted-foreground">{process.timeline?.length} tarefa(s)</span>
                                            </div>
                                        </div>
                                        <CardDescription>{(process.clients || []).join(', ')}</CardDescription>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="p-4 pt-0">
                                    <div className="space-y-3 border-t pt-4">
                                        {process.timeline && process.timeline.map(task => (
                                            <div key={task.id} className="flex items-start gap-3">
                                                <Checkbox 
                                                    id={`task-${process.id}-${task.id}`}
                                                    checked={task.completed}
                                                    onCheckedChange={() => handleToggleProcessTask(process.id, task.id)}
                                                    className="mt-1"
                                                />
                                                <label htmlFor={`task-${process.id}-${task.id}`} className="flex-1 cursor-pointer">
                                                    <span className={`block text-sm ${task.completed ? 'line-through text-muted-foreground' : ''}`}>
                                                        {task.description}
                                                    </span>
                                                     <span className={`block text-xs text-muted-foreground ${task.completed ? 'line-through' : ''}`}>
                                                        Data: {format(parseISO(task.date), "dd/MM/yyyy")}
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
                        <h2 className="text-2xl font-semibold">Nenhuma tarefa encontrada</h2>
                        <p className="text-muted-foreground mt-2">
                           {filter === 'pending' && 'Você não tem tarefas pendentes. Tudo em ordem!'}
                           {filter === 'completed' && 'Nenhuma tarefa foi concluída ainda.'}
                           {filter === 'all' && 'Nenhuma tarefa foi criada para os seus processos.'}
                        </p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}

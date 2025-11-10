
"use client";

import * as React from "react";
import { getProcesses, updateProcess } from "@/services/processService";
import { getPhases, type Phase } from "@/services/phaseService";
import type { Process } from "@/components/processes/ProcessFormDialog";
import { Button } from "@/components/ui/button";
import { PlusCircle, KanbanSquare } from "lucide-react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import ProcessCard from "@/components/pipeline/ProcessCard";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { ProcessDetailsSheet } from "@/components/processes/ProcessDetailsSheet";
import Link from "next/link";


export default function PipelinePage() {
    const [phases, setPhases] = React.useState<Phase[]>([]);
    const [processes, setProcesses] = React.useState<Process[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const [isSheetOpen, setIsSheetOpen] = React.useState(false);
    const [selectedProcess, setSelectedProcess] = React.useState<Process | null>(null);
    const { toast } = useToast();

    const fetchData = React.useCallback(async () => {
        setIsLoading(true);
        try {
            const [phasesData, processesData] = await Promise.all([
                getPhases(),
                getProcesses(),
            ]);
            setPhases(phasesData.sort((a, b) => a.order - b.order));
            setProcesses(processesData);
        } catch (error) {
            console.error("Failed to fetch pipeline data:", error);
            toast({ title: "Erro ao carregar pipeline", description: "Não foi possível buscar as fases e processos.", variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    }, [toast]);

    React.useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleOpenDetails = (process: Process) => {
        setSelectedProcess(process);
        setIsSheetOpen(true);
    };

    const handleCloseDetails = () => {
        setIsSheetOpen(false);
        setSelectedProcess(null);
    };

    const handleTimelineUpdate = async (processId: string, newTimeline: any[]) => {
        const processToUpdate = processes.find(p => p.id === processId);
        if (processToUpdate) {
            try {
                const updatedProcess = await updateProcess(processId, { timeline: newTimeline });
                const updatedProcesses = processes.map(p => p.id === processId ? updatedProcess : p);
                setProcesses(updatedProcesses);
                if (selectedProcess && selectedProcess.id === processId) {
                    setSelectedProcess(updatedProcess);
                }
                toast({ title: "Linha do Tempo Atualizada!" });
            } catch (error) {
                console.error("Failed to update timeline:", error);
                toast({ title: "Erro ao atualizar", variant: "destructive" });
            }
        }
    };
    
    const handleMoveProcess = async (processId: string, newPhaseId: string | null) => {
        const originalProcesses = [...processes];
        const processToMove = processes.find(p => p.id === processId);
        
        if (!processToMove || processToMove.phaseId === newPhaseId) return;
    
        // Optimistic UI update
        const updatedProcesses = processes.map(p => 
            p.id === processId ? { ...p, phaseId: newPhaseId ?? undefined } : p
        );
        setProcesses(updatedProcesses);
        
        try {
            // Firestore update: pass null to clear the field.
            await updateProcess(processId, { phaseId: newPhaseId });
            toast({
                title: "Processo movido!",
                description: `O processo foi movido para a nova fase.`,
            });
        } catch (error) {
            console.error("Failed to move process:", error);
            // Revert on error
            setProcesses(originalProcesses);
            toast({ title: "Erro ao mover processo", description: "Não foi possível atualizar a fase do processo.", variant: "destructive" });
        }
    };


    const getProcessesInPhase = (phaseId: string | null) => {
        if (phaseId === 'unclassified') {
             // Correctly filter for processes with null or undefined phaseId
            return processes.filter(p => p.phaseId === null || p.phaseId === undefined);
        }
        return processes.filter(p => p.phaseId === phaseId);
    };

    const allDisplayPhases: (Phase | {id: string, name: string})[] = [{id: 'unclassified', name: 'Não Classificado'}, ...phases];

    return (
        <>
            <div className="h-full flex flex-col p-4 md:p-6 lg:p-8">
                <div className="flex items-center justify-between mb-6 flex-shrink-0">
                    <div className="flex items-center gap-3">
                         <KanbanSquare className="h-9 w-9 text-primary"/>
                         <div>
                            <h1 className="text-4xl font-headline font-extrabold text-primary">Pipeline de Processos</h1>
                            <p className="text-muted-foreground">Visualize o fluxo de trabalho dos seus processos.</p>
                         </div>
                    </div>
                    <Button asChild>
                        <Link href="/settings/tools/pipeline-phases">
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Gerenciar Fases
                        </Link>
                    </Button>
                </div>

                <ScrollArea className="flex-1 -mx-4">
                    <div className="flex gap-6 px-4 pb-4">
                        {isLoading ? (
                            Array.from({ length: 4 }).map((_, i) => (
                                <div key={i} className="w-80 flex-shrink-0 space-y-4">
                                    <Skeleton className="h-8 w-1/2" />
                                    <Skeleton className="h-28 w-full" />
                                    <Skeleton className="h-28 w-full" />
                                </div>
                            ))
                        ) : (
                            allDisplayPhases.map(phase => {
                                const processesInPhase = getProcessesInPhase(phase.id);
                                return (
                                    <div key={phase.id} className="w-80 flex-shrink-0">
                                        <div className="flex justify-between items-center mb-4">
                                            <h2 className="font-semibold text-lg text-foreground">{phase.name}</h2>
                                            <span className="text-sm font-bold text-muted-foreground bg-muted/50 px-2 py-1 rounded-md">
                                                {processesInPhase.length}
                                            </span>
                                        </div>
                                        <div className="space-y-4 bg-muted/30 rounded-lg p-2 min-h-[100px]">
                                            {processesInPhase.length > 0 ? (
                                                processesInPhase.map(process => (
                                                    <ProcessCard
                                                        key={process.id}
                                                        process={process}
                                                        phases={allDisplayPhases.map(p => ({ id: p.id, name: p.name }))}
                                                        onMove={handleMoveProcess}
                                                        onClick={() => handleOpenDetails(process)}
                                                    />
                                                ))
                                            ) : (
                                                <div className="text-center text-sm text-muted-foreground py-10">
                                                    Nenhum processo nesta fase.
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                    <ScrollBar orientation="horizontal" />
                </ScrollArea>
            </div>
            <ProcessDetailsSheet 
                isOpen={isSheetOpen}
                onClose={handleCloseDetails}
                processData={selectedProcess}
                onTimelineUpdate={handleTimelineUpdate}
                onOpenEditDialog={() => { /* Placeholder */}}
            />
        </>
    );
}

    
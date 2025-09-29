
"use client";

import Link from 'next/link';
import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { List, ListItem } from "@/components/ui/list";
import { CalendarDays, Activity, Briefcase, FilePlus2, UserPlus, CheckSquare, Hourglass } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { getEventsForDashboard } from "@/services/eventService";
import { getRecentProcesses } from "@/services/processService";
import { getRecentClients } from "@/services/clientService";
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import type { CalendarEvent } from '@/components/agenda/EventFormDialog';
import type { Process } from '@/components/processes/ProcessFormDialog';
import type { Client } from '@/components/clients/ClientFormDialog';

interface RecentActivityItem {
    id: string;
    type: 'process' | 'client';
    text: string;
    time: string;
    icon: React.ReactNode;
}

export default function DashboardPage() {
    const [upcomingEvents, setUpcomingEvents] = React.useState<CalendarEvent[]>([]);
    const [recentActivities, setRecentActivities] = React.useState<RecentActivityItem[]>([]);
    const [processStats, setProcessStats] = React.useState<{ emAndamento: number; concluido: number; suspenso: number } | null>(null);
    const [isLoading, setIsLoading] = React.useState(true);

    React.useEffect(() => {
        async function fetchData() {
            setIsLoading(true);
            try {
                const [events, processes, clients, allProcessesForStats] = await Promise.all([
                    getEventsForDashboard(5),
                    getRecentProcesses(3),
                    getRecentClients(2),
                    getRecentProcesses(), // Busca todos para estatísticas
                ]);

                setUpcomingEvents(events);

                // Montar Atividades Recentes
                const combinedActivities = [
                    ...processes.map(p => ({
                        id: p.id,
                        type: 'process' as const,
                        text: `Novo processo para ${p.client}`,
                        time: p.createdAt ? format(p.createdAt.toDate(), 'dd/MM/yyyy') : '',
                        icon: <FilePlus2 className="h-5 w-5 text-accent" />
                    })),
                    ...clients.map(c => ({
                        id: c.id,
                        type: 'client' as const,
                        text: `Cliente ${c.name} adicionado`,
                        time: c.createdAt ? format(c.createdAt.toDate(), 'dd/MM/yyyy') : '',
                        icon: <UserPlus className="h-5 w-5 text-accent" />
                    }))
                ];
                // @ts-ignore
                combinedActivities.sort((a, b) => new Date(b.time) - new Date(a.time));
                // @ts-ignore
                setRecentActivities(combinedActivities.slice(0, 5));

                // Calcular Estatísticas de Processos
                const stats = allProcessesForStats.reduce((acc, p) => {
                    if (p.status === 'Em Andamento') acc.emAndamento++;
                    else if (p.status === 'Concluído') acc.concluido++;
                    else if (p.status === 'Suspenso') acc.suspenso++;
                    return acc;
                }, { emAndamento: 0, concluido: 0, suspenso: 0 });
                setProcessStats(stats);

            } catch (error) {
                console.error("Erro ao carregar dados do dashboard:", error);
            } finally {
                setIsLoading(false);
            }
        }
        fetchData();
    }, []);

    return (
        <div className="container mx-auto p-4 md:p-6 lg:p-8">
            <h1 className="text-4xl font-headline font-extrabold mb-8 text-primary">Painel</h1>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {/* Próximos Prazos */}
                <Card className="shadow-lg h-full">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle>Próximos Compromissos</CardTitle>
                        <CalendarDays className="h-6 w-6 text-accent" />
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="space-y-3 pt-2">
                                <Skeleton className="h-5 w-full" />
                                <Skeleton className="h-5 w-5/6" />
                                <Skeleton className="h-5 w-full" />
                            </div>
                        ) : upcomingEvents.length > 0 ? (
                            <List>
                                {upcomingEvents.map((item) => (
                                    <ListItem key={item.id} className="flex justify-between items-center">
                                        <Link href="/agenda" className="hover:underline flex-1 truncate pr-2">
                                            {item.description}
                                        </Link>
                                        <Badge variant="outline">{format(parseISO(item.date), 'dd/MM', { locale: ptBR })}</Badge>
                                    </ListItem>
                                ))}
                            </List>
                        ) : (
                            <p className="text-sm text-muted-foreground pt-2">Nenhum compromisso futuro na agenda.</p>
                        )}
                    </CardContent>
                </Card>

                {/* Atividade Recente */}
                <Card className="shadow-lg h-full">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle>Atividade Recente</CardTitle>
                        <Activity className="h-6 w-6 text-accent" />
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="space-y-3 pt-2">
                                <Skeleton className="h-5 w-full" />
                                <Skeleton className="h-5 w-4/5" />
                                <Skeleton className="h-5 w-full" />
                            </div>
                        ) : recentActivities.length > 0 ? (
                            <List>
                                {recentActivities.map((item) => (
                                    <ListItem key={item.id} className="flex items-center gap-3">
                                        {item.icon}
                                        <div className="flex-1">
                                            <p className="truncate">{item.text}</p>
                                            <p className="text-xs text-muted-foreground">{item.time}</p>
                                        </div>
                                    </ListItem>
                                ))}
                            </List>
                        ) : (
                            <p className="text-sm text-muted-foreground pt-2">Nenhuma atividade recente.</p>
                        )}
                    </CardContent>
                </Card>

                {/* Estatísticas de Processos */}
                <Card className="shadow-lg h-full md:col-span-2 lg:col-span-1">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle>Status dos Processos</CardTitle>
                        <Briefcase className="h-6 w-6 text-accent" />
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                           <div className="space-y-3 pt-2">
                                <Skeleton className="h-6 w-3/4" />
                                <Skeleton className="h-6 w-2/4" />
                                <Skeleton className="h-6 w-1/4" />
                            </div>
                        ) : processStats ? (
                             <List>
                                <ListItem className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Hourglass className="h-4 w-4 text-blue-500" />
                                        <span>Em Andamento</span>
                                    </div>
                                    <span className="font-bold text-lg">{processStats.emAndamento}</span>
                                </ListItem>
                                 <ListItem className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <CheckSquare className="h-4 w-4 text-green-600" />
                                        <span>Concluídos</span>
                                    </div>
                                    <span className="font-bold text-lg">{processStats.concluido}</span>
                                </ListItem>
                                 <ListItem className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Briefcase className="h-4 w-4 text-yellow-500" />
                                        <span>Suspensos</span>
                                    </div>
                                    <span className="font-bold text-lg">{processStats.suspenso}</span>
                                </ListItem>
                            </List>
                        ) : (
                            <p className="text-sm text-muted-foreground pt-2">Não foi possível carregar as estatísticas.</p>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

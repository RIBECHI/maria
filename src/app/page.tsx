
"use client";

import Link from 'next/link';
import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { List, ListItem } from "@/components/ui/list";
import { CalendarDays, Activity, Briefcase, FilePlus2, UserPlus, CheckSquare, Hourglass } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { getEventsForDashboard } from "@/services/eventService";
import { getProcesses, getRecentProcesses } from "@/services/processService";
import { getRecentClients } from "@/services/clientService";
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import type { CalendarEvent } from '@/components/agenda/EventFormDialog';
import type { Process } from '@/components/processes/ProcessFormDialog';
import type { Client } from '@/components/clients/ClientFormDialog';
import { getPhases } from '@/services/phaseService';
import { Calendar } from '@/components/ui/calendar';
import { useRouter } from 'next/navigation';

interface RecentActivityItem {
    id: string;
    type: 'process' | 'client';
    text: string;
    time: string;
    icon: React.ReactNode;
    createdAt: Date;
}

export default function DashboardPage() {
    const [upcomingEvents, setUpcomingEvents] = React.useState<CalendarEvent[]>([]);
    const [recentActivities, setRecentActivities] = React.useState<RecentActivityItem[]>([]);
    const [processStats, setProcessStats] = React.useState<Record<string, number>>({});
    const [phases, setPhases] = React.useState<{id: string, name: string}[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const router = useRouter();

    React.useEffect(() => {
        async function fetchData() {
            setIsLoading(true);
            try {
                const [events, recentProcs, recentClients, allProcesses, allPhases] = await Promise.all([
                    getEventsForDashboard(30), // Fetch more for calendar view
                    getRecentProcesses(3),
                    getRecentClients(2),
                    getProcesses(),
                    getPhases(),
                ]);

                setUpcomingEvents(events);
                setPhases(allPhases);

                // Montar Atividades Recentes
                const processActivities = (recentProcs || []).map(p => ({
                    id: p.id,
                    type: 'process' as const,
                    text: `Novo processo para ${p.clients.join(', ')}`,
                    createdAt: p.createdAt ? parseISO(p.createdAt) : new Date(0),
                    icon: <FilePlus2 className="h-5 w-5 text-muted-foreground" />
                }));

                const clientActivities = (recentClients || []).map(c => ({
                    id: c.id,
                    type: 'client' as const,
                    text: `Cliente ${c.name} adicionado`,
                    createdAt: c.createdAt ? parseISO(c.createdAt) : new Date(0),
                    icon: <UserPlus className="h-5 w-5 text-muted-foreground" />
                }));
                
                const combinedActivities = [...processActivities, ...clientActivities];

                combinedActivities.sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
                
                const formattedActivities = combinedActivities.slice(0, 5).map(activity => ({
                    ...activity,
                    time: activity.createdAt ? format(activity.createdAt, 'dd/MM/yyyy', { locale: ptBR }) : 'Data indisponível',
                }));
                
                setRecentActivities(formattedActivities);

                // Calcular Estatísticas de Processos por Fase
                const stats = (allProcesses || []).reduce((acc, p) => {
                    const phaseName = p.phaseName || 'Não Classificado';
                    if (!acc[phaseName]) {
                        acc[phaseName] = 0;
                    }
                    acc[phaseName]++;
                    return acc;
                }, {} as Record<string, number>);
                setProcessStats(stats);

            } catch (error) {
                console.error("Erro ao carregar dados do dashboard:", error);
            } finally {
                setIsLoading(false);
            }
        }
        fetchData();
    }, []);

    const getActivityLink = (item: RecentActivityItem | null) => {
        if (!item) return '#';
        switch (item.type) {
            case 'process':
                return '/processes';
            case 'client':
                return '/clients';
            default:
                return '#';
        }
    };
    
    const getPhaseIcon = (phaseName: string) => {
        const lowerCaseName = phaseName.toLowerCase();
        if (lowerCaseName.includes('concluído')) return <CheckSquare className="h-4 w-4 text-green-600" />;
        if (lowerCaseName.includes('suspenso') || lowerCaseName.includes('aguardando')) return <Hourglass className="h-4 w-4 text-yellow-500" />;
        return <Briefcase className="h-4 w-4 text-blue-500" />;
    };

    const eventDays = upcomingEvents.map(event => parseISO(event.date));

    return (
        <div className="container mx-auto p-4 md:p-6 lg:p-8">
            <h1 className="text-4xl font-headline font-extrabold mb-8 text-primary">Painel</h1>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {/* Próximos Prazos agora como Calendário */}
                <Card className="shadow-lg h-full flex flex-col">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle>Próximos Compromissos</CardTitle>
                        <CalendarDays className="h-6 w-6 text-muted-foreground" />
                    </CardHeader>
                    <CardContent className="flex-1 flex items-center justify-center">
                        {isLoading ? (
                            <div className="space-y-3 pt-2 w-full">
                                <Skeleton className="h-48 w-full" />
                            </div>
                        ) : (
                           <div className="origin-center scale-[0.8]">
                                <Calendar
                                    mode="single"
                                    onSelect={() => router.push('/agenda')}
                                    className="rounded-md p-0"
                                    locale={ptBR}
                                    modifiers={{ events: eventDays }}
                                    modifiersClassNames={{
                                        events: 'bg-primary/20 text-primary-foreground font-bold',
                                    }}
                                />
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Atividade Recente */}
                <Card className="shadow-lg h-full">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle>Atividade Recente</CardTitle>
                        <Activity className="h-6 w-6 text-muted-foreground" />
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
                                    <ListItem key={item.id} className="p-0 border-b-0">
                                         <Link href={getActivityLink(item)} className="flex items-center gap-3 w-full p-2 rounded-md hover:bg-muted/50 transition-colors">
                                            {item.icon}
                                            <div className="flex-1 min-w-0">
                                                <p className="truncate">{item.text}</p>
                                                <p className="text-xs text-muted-foreground">{item.time}</p>
                                            </div>
                                        </Link>
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
                        <Briefcase className="h-6 w-6 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                           <div className="space-y-3 pt-2">
                                <Skeleton className="h-6 w-3/4" />
                                <Skeleton className="h-6 w-2/4" />
                                <Skeleton className="h-6 w-1/4" />
                            </div>
                        ) : Object.keys(processStats).length > 0 ? (
                            <List>
                                {phases.map(phase => (
                                    processStats[phase.name] > 0 && (
                                        <ListItem key={phase.id} className="p-0 border-b-0">
                                            <Link href={`/processes?phase=${phase.name}`} className="flex items-center justify-between w-full p-2 rounded-md hover:bg-muted/50 transition-colors">
                                                <div className="flex items-center gap-2">
                                                    {getPhaseIcon(phase.name)}
                                                    <span>{phase.name}</span>
                                                </div>
                                                <span className="font-bold text-lg">{processStats[phase.name]}</span>
                                            </Link>
                                        </ListItem>
                                    )
                                ))}
                                {processStats['Não Classificado'] > 0 && (
                                     <ListItem className="p-0 border-b-0">
                                        <Link href="/processes?phase=Não Classificado" className="flex items-center justify-between w-full p-2 rounded-md hover:bg-muted/50 transition-colors">
                                            <div className="flex items-center gap-2">
                                                <Briefcase className="h-4 w-4 text-gray-500" />
                                                <span>Não Classificado</span>
                                            </div>
                                            <span className="font-bold text-lg">{processStats['Não Classificado']}</span>
                                        </Link>
                                    </ListItem>
                                )}
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

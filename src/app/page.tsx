
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { List, ListItem } from "@/components/ui/list";
import { CalendarDays, Activity, AlertTriangle } from "lucide-react";

export default function DashboardPage() {
  const upcomingDeadlines = [
    { id: 1, text: "Processo Alpha - Petição inicial", date: "2024-08-15" },
    { id: 2, text: "Caso Beta - Audiência de conciliação", date: "2024-08-22" },
    { id: 3, text: "Recurso Gamma - Prazo final", date: "2024-09-01" },
  ];

  const recentActivities = [
    { id: 1, text: "Cliente Silva adicionado", time: "Há 2 horas" },
    { id: 2, text: "Documento 'Contrato Social.pdf' carregado para Processo Delta", time: "Ontem" },
    { id: 3, text: "Lembrete para Processo Epsilon enviado", time: "Há 3 dias" },
  ];

  const importantUpdates = [
    { id: 1, text: "Nova súmula do STJ impacta Processo Zeta.", type: "warning" },
    { id: 2, text: "Reforma tributária: possíveis alterações em casos fiscais.", type: "info" },
  ];

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8">
      <h1 className="text-4xl font-headline font-extrabold mb-8 text-primary">Painel</h1>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Link href="/agenda" className="block">
          <Card className="shadow-lg h-full cursor-pointer transition-all duration-200 ease-in-out hover:shadow-xl hover:ring-1 hover:ring-primary/30">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle>Próximos Prazos</CardTitle>
              <CalendarDays className="h-6 w-6 text-accent" />
            </CardHeader>
            <CardContent>
              <List>
                {upcomingDeadlines.map((item) => (
                  <ListItem key={item.id} className="flex justify-between">
                    <span>{item.text}</span>
                    <span className="text-sm text-muted-foreground">{item.date}</span>
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Link>

        <Link href="/agenda" className="block">
          <Card className="shadow-lg h-full cursor-pointer transition-all duration-200 ease-in-out hover:shadow-xl hover:ring-1 hover:ring-primary/30">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle>Atividade Recente</CardTitle>
              <Activity className="h-6 w-6 text-accent" />
            </CardHeader>
            <CardContent>
              <List>
                {recentActivities.map((item) => (
                  <ListItem key={item.id} className="flex justify-between">
                    <span>{item.text}</span>
                    <span className="text-sm text-muted-foreground">{item.time}</span>
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Link>

        <Link href="/legal-reminder" className="block md:col-span-2 lg:col-span-1">
          <Card className="shadow-lg h-full cursor-pointer transition-all duration-200 ease-in-out hover:shadow-xl hover:ring-1 hover:ring-primary/30">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle>Atualizações Importantes</CardTitle>
              <AlertTriangle className="h-6 w-6 text-destructive" />
            </CardHeader>
            <CardContent>
              <List>
                {importantUpdates.map((item) => (
                  <ListItem key={item.id}>
                    <p className={`${item.type === 'warning' ? 'text-destructive' : 'text-foreground'}`}>
                      {item.text}
                    </p>
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}

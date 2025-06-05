import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { PlusCircle, Edit, FolderOpen } from "lucide-react";

// Mock data for processes
const processes = [
  { id: "PROC001", client: "Empresa Alpha Ltda.", type: "Cível", status: "Em Andamento", nextDeadline: "2024-08-15", documents: 5 },
  { id: "PROC002", client: "João Silva", type: "Trabalhista", status: "Concluído", nextDeadline: "-", documents: 3 },
  { id: "PROC003", client: "Maria Oliveira", type: "Tributário", status: "Suspenso", nextDeadline: "2024-09-01", documents: 8 },
  { id: "PROC004", client: "Construtora Beta S.A.", type: "Administrativo", status: "Em Andamento", nextDeadline: "2024-07-30", documents: 2 },
];

const getStatusBadgeVariant = (status: string) => {
  switch (status) {
    case "Em Andamento": return "default";
    case "Concluído": return "secondary"; // Using secondary as a placeholder for "success"
    case "Suspenso": return "destructive"; // Using destructive as a placeholder for "warning"
    default: return "outline";
  }
}

export default function ProcessesPage() {
  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-headline font-bold text-primary">Acompanhamento de Processos</h1>
        <Button>
          <PlusCircle className="mr-2 h-5 w-5" /> Adicionar Processo
        </Button>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl font-headline">Lista de Processos</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nº Processo</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Próximo Prazo</TableHead>
                <TableHead className="text-center">Docs</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {processes.map((process) => (
                <TableRow key={process.id}>
                  <TableCell className="font-medium">{process.id}</TableCell>
                  <TableCell>{process.client}</TableCell>
                  <TableCell>{process.type}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(process.status) as any}>{process.status}</Badge>
                  </TableCell>
                  <TableCell>{process.nextDeadline}</TableCell>
                  <TableCell className="text-center">{process.documents}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" className="hover:text-accent">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="hover:text-accent">
                      <FolderOpen className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PlusCircle, Edit, Trash2 } from "lucide-react";

// Mock data for clients
const clients = [
  { id: "CLI001", name: "Empresa Alpha Ltda.", contact: "contato@alpha.com / (11) 98765-4321", caseCount: 3, lastActivity: "2024-07-20" },
  { id: "CLI002", name: "João Silva", contact: "joao.silva@email.com / (21) 91234-5678", caseCount: 1, lastActivity: "2024-07-15" },
  { id: "CLI003", name: "Maria Oliveira", contact: "maria.o@server.com / (31) 99999-8888", caseCount: 5, lastActivity: "2024-07-22" },
  { id: "CLI004", name: "Construtora Beta S.A.", contact: "juridico@beta.com / (41) 98888-7777", caseCount: 2, lastActivity: "2024-06-30" },
];

export default function ClientsPage() {
  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-headline font-bold text-primary">Gestão de Clientes</h1>
        <Button>
          <PlusCircle className="mr-2 h-5 w-5" /> Adicionar Cliente
        </Button>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl font-headline">Lista de Clientes</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Contato</TableHead>
                <TableHead className="text-center">Nº Casos</TableHead>
                <TableHead>Última Atividade</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clients.map((client) => (
                <TableRow key={client.id}>
                  <TableCell>{client.id}</TableCell>
                  <TableCell className="font-medium">{client.name}</TableCell>
                  <TableCell>{client.contact}</TableCell>
                  <TableCell className="text-center">{client.caseCount}</TableCell>
                  <TableCell>{client.lastActivity}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" className="hover:text-accent">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
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

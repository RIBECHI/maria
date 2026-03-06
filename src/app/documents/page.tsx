
"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { getClients } from "@/services/clientService";
import { getProcesses } from "@/services/processService";
import type { Client } from "@/components/clients/ClientFormDialog";
import type { Process } from "@/components/processes/ProcessFormDialog";
import { FileText, Search, ExternalLink } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

interface DocumentLink {
  parentType: 'Cliente' | 'Processo';
  parentName: string;
  link: string;
}

export default function DocumentsPage() {
  const [documentLinks, setDocumentLinks] = React.useState<DocumentLink[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [searchTerm, setSearchTerm] = React.useState("");
  const { toast } = useToast();

  React.useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        const [clients, processes] = await Promise.all([
          getClients(),
          getProcesses(),
        ]);

        const clientLinks = clients.flatMap((client: Client) => 
          (client.driveLinks || []).map(link => ({
            parentType: 'Cliente' as const,
            parentName: client.name,
            link,
          }))
        );

        const processLinks = processes.flatMap((process: Process) => 
          (process.driveLinks || []).map(link => ({
            parentType: 'Processo' as const,
            parentName: process.processNumber,
            link,
          }))
        );

        setDocumentLinks([...clientLinks, ...processLinks]);

      } catch (error) {
        console.error("Error fetching document links:", error);
        toast({
          title: "Erro ao carregar documentos",
          description: "Não foi possível buscar os links de clientes e processos.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [toast]);

  const filteredLinks = documentLinks.filter(doc =>
    doc.link.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.parentName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getLinkName = (url: string) => {
    try {
        const urlObject = new URL(url);
        // Tenta pegar a última parte do caminho, que geralmente é o nome do arquivo ou pasta
        const pathParts = urlObject.pathname.split('/').filter(p => p);
        if (pathParts.length > 0) {
            return decodeURIComponent(pathParts[pathParts.length - 1]);
        }
        // Se não houver caminho, usa o hostname
        return urlObject.hostname;
    } catch (e) {
        // Se for um link inválido, apenas retorna o link
        return url;
    }
  };

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8">
      <div className="flex items-center gap-4 mb-8">
        <FileText className="h-10 w-10 text-primary" />
        <div>
            <h1 className="text-4xl font-headline font-extrabold text-primary">Repositório de Documentos</h1>
            <p className="text-muted-foreground">Todos os links de documentos e pastas do Google Drive em um só lugar.</p>
        </div>
      </div>
      
      <div className="mb-6 flex items-center gap-2">
        <Search className="h-5 w-5 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome, cliente ou processo..."
          className="max-w-sm"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Links Salvos</CardTitle>
          <CardDescription>
            Esta é uma lista de todos os links do Google Drive associados aos seus clientes e processos.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome do Documento / Pasta</TableHead>
                <TableHead>Vinculado a</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead className="text-right">Ação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-64" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-8 w-24" /></TableCell>
                  </TableRow>
                ))
              ) : filteredLinks.length > 0 ? (
                filteredLinks.map((doc, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium truncate max-w-xs" title={doc.link}>
                      {getLinkName(doc.link)}
                    </TableCell>
                    <TableCell>{doc.parentName}</TableCell>
                    <TableCell>
                      <Badge variant={doc.parentType === 'Cliente' ? 'outline' : 'secondary'}>
                        {doc.parentType}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button asChild variant="outline" size="sm">
                        <Link href={doc.link} target="_blank" rel="noopener noreferrer">
                           <ExternalLink className="mr-2 h-4 w-4" />
                           Abrir
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                 <TableRow>
                  <TableCell colSpan={4} className="text-center h-24">
                    Nenhum link de documento encontrado. Adicione links aos seus clientes e processos.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

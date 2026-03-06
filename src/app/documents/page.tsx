
"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { getClients, updateClient } from "@/services/clientService";
import { getProcesses, updateProcess } from "@/services/processService";
import type { Client } from "@/components/clients/ClientFormDialog";
import type { Process } from "@/components/processes/ProcessFormDialog";
import { FileText, Search, ExternalLink, Link as LinkIcon, Loader2 } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";


interface DocumentLink {
  parentType: 'Cliente' | 'Processo';
  parentName: string;
  parentObject: Client | Process;
  link: string;
}

export default function DocumentsPage() {
  const [documentLinks, setDocumentLinks] = React.useState<DocumentLink[]>([]);
  const [clients, setClients] = React.useState<Client[]>([]);
  const [processes, setProcesses] = React.useState<Process[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [searchTerm, setSearchTerm] = React.useState("");
  const { toast } = useToast();

  // State for the new link form
  const [selectedParentType, setSelectedParentType] = React.useState<'client' | 'process'>('client');
  const [selectedParentId, setSelectedParentId] = React.useState<string | undefined>();
  const [newLink, setNewLink] = React.useState('');
  const [isSaving, setIsSaving] = React.useState(false);


  const fetchData = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const [clientsData, processesData] = await Promise.all([
        getClients(),
        getProcesses(),
      ]);

      setClients(clientsData);
      setProcesses(processesData);

      const clientLinks: DocumentLink[] = clientsData.flatMap((client: Client) =>
        (client.driveLinks || []).map(link => ({
          parentType: 'Cliente' as const,
          parentName: client.name,
          parentObject: client,
          link,
        }))
      );

      const processLinks: DocumentLink[] = processesData.flatMap((process: Process) =>
        (process.driveLinks || []).map(link => ({
          parentType: 'Processo' as const,
          parentName: process.processNumber,
          parentObject: process,
          link,
        }))
      );

      setDocumentLinks([...clientLinks, ...processLinks].sort((a,b) => a.parentName.localeCompare(b.parentName)));

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
  }, [toast]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAddLink = async () => {
    if (!selectedParentId || !newLink) {
        toast({ title: "Informação incompleta", description: "Por favor, selecione um cliente/processo e insira um link.", variant: "destructive" });
        return;
    }
    
    setIsSaving(true);
    try {
        if (selectedParentType === 'client') {
            const client = clients.find(c => c.id === selectedParentId);
            if (!client) throw new Error("Cliente não encontrado.");
            const updatedLinks = [...(client.driveLinks || []), newLink];
            await updateClient(client.id, { driveLinks: updatedLinks });
        } else {
            const process = processes.find(p => p.id === selectedParentId);
            if (!process) throw new Error("Processo não encontrado.");
            const updatedLinks = [...(process.driveLinks || []), newLink];
            await updateProcess(process.id, { driveLinks: updatedLinks });
        }
        
        toast({ title: "Link Adicionado!", description: "O novo documento foi vinculado com sucesso." });
        setNewLink('');
        setSelectedParentId(undefined);
        fetchData(); // Refresh the list
    } catch (error: any) {
        toast({ title: "Erro ao salvar", description: error.message, variant: "destructive"});
    } finally {
        setIsSaving(false);
    }
  };


  const filteredLinks = documentLinks.filter(doc =>
    doc.link.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.parentName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getLinkName = (url: string) => {
    try {
        const urlObject = new URL(url);
        const pathParts = urlObject.pathname.split('/').filter(p => p);
        if (pathParts.length > 0) {
            return decodeURIComponent(pathParts[pathParts.length - 1]);
        }
        return urlObject.hostname;
    } catch (e) {
        return url;
    }
  };

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8">
      <div className="flex items-center gap-4 mb-8">
        <FileText className="h-10 w-10 text-primary" />
        <div>
            <h1 className="text-4xl font-headline font-extrabold text-primary">Repositório de Documentos</h1>
            <p className="text-muted-foreground">Adicione e gerencie os links de documentos e pastas do Google Drive.</p>
        </div>
      </div>
      
       {/* Add New Link Card */}
      <Card className="shadow-lg mb-8">
        <CardHeader>
          <CardTitle>Adicionar Documento por Link</CardTitle>
          <CardDescription>
            Selecione um cliente ou processo e cole o link do Google Drive para vinculá-lo.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="space-y-2">
                <Label>1. Vincular a:</Label>
                <RadioGroup 
                    defaultValue="client" 
                    onValueChange={(value) => {
                        setSelectedParentType(value as any);
                        setSelectedParentId(undefined);
                    }}
                    className="flex gap-4"
                >
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="client" id="r-client" />
                        <Label htmlFor="r-client">Cliente</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="process" id="r-process" />
                        <Label htmlFor="r-process">Processo</Label>
                    </div>
                </RadioGroup>
            </div>
            
            <div className="space-y-2">
              <Label>2. Selecione o item específico:</Label>
                <Select onValueChange={setSelectedParentId} value={selectedParentId}>
                  <SelectTrigger>
                    <SelectValue placeholder={`Selecione um ${selectedParentType === 'client' ? 'cliente' : 'processo'}`} />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedParentType === 'client' ? (
                        clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)
                    ) : (
                        processes.map(p => <SelectItem key={p.id} value={p.id}>{p.processNumber} - {p.clients.join(', ')}</SelectItem>)
                    )}
                  </SelectContent>
                </Select>
            </div>
             <div className="space-y-2">
                <Label htmlFor="new-link">3. Cole o link do documento:</Label>
                <Input
                    id="new-link"
                    placeholder="https://docs.google.com/document/d/..."
                    value={newLink}
                    onChange={(e) => setNewLink(e.target.value)}
                />
            </div>
        </CardContent>
        <CardFooter>
            <Button onClick={handleAddLink} disabled={isSaving}>
                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LinkIcon className="mr-2 h-4 w-4" />}
                Adicionar Link
            </Button>
        </CardFooter>
      </Card>

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

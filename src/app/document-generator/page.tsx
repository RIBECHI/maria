
"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Copy, FileDown, Loader2, Wand2 } from "lucide-react";
import { getProcesses } from "@/services/processService";
import { getClients } from "@/services/clientService";
import { getTemplates } from "@/services/templateService";
import type { Process } from "@/components/processes/ProcessFormDialog";
import type { Client } from "@/components/clients/ClientFormDialog";
import type { DocumentTemplate } from "@/services/templateService";
import { Skeleton } from "@/components/ui/skeleton";
import jsPDF from 'jspdf';


export default function DocumentGeneratorPage() {
  const { toast } = useToast();
  const [processes, setProcesses] = React.useState<Process[]>([]);
  const [clients, setClients] = React.useState<Client[]>([]);
  const [templates, setTemplates] = React.useState<DocumentTemplate[]>([]);
  
  const [selectedClientId, setSelectedClientId] = React.useState<string | null>(null);
  const [selectedProcessId, setSelectedProcessId] = React.useState<string | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = React.useState<string | null>(null);
  const [generatedContent, setGeneratedContent] = React.useState<string>("");
  const [isLoadingData, setIsLoadingData] = React.useState(true);
  const [isGenerating, setIsGenerating] = React.useState(false);

  React.useEffect(() => {
    async function fetchData() {
      setIsLoadingData(true);
      try {
        const [procs, clis, tpls] = await Promise.all([
          getProcesses(),
          getClients(),
          getTemplates(),
        ]);
        setProcesses(procs);
        setClients(clis);
        setTemplates(tpls);
      } catch (error) {
        console.error("Error fetching data for generator:", error);
        toast({ title: "Erro ao carregar dados", description: "Não foi possível carregar processos, clientes e modelos.", variant: "destructive" });
      } finally {
        setIsLoadingData(false);
      }
    }
    fetchData();
  }, [toast]);
  
  const handleClientChange = (clientId: string) => {
    setSelectedClientId(clientId);
    setSelectedProcessId(null); // Reseta o processo quando o cliente muda
  };

  const filteredProcesses = React.useMemo(() => {
    if (!selectedClientId) return [];
    const selectedClient = clients.find(c => c.id === selectedClientId);
    if (!selectedClient) return [];
    // Corrected logic: Check if the client's name is included in the process's clients array.
    return processes.filter(p => p.clients && p.clients.includes(selectedClient.name));
  }, [selectedClientId, clients, processes]);

  const handleGenerate = () => {
    if (!selectedClientId || !selectedProcessId || !selectedTemplateId) {
      toast({ title: "Seleção incompleta", description: "Por favor, selecione um cliente, um processo e um modelo.", variant: "destructive" });
      return;
    }
    
    setIsGenerating(true);
    setGeneratedContent("");

    try {
      const process = processes.find(p => p.id === selectedProcessId);
      const template = templates.find(t => t.id === selectedTemplateId);
      // BUG FIX: Find the client based on the selectedClientId from the form, not the first in the process.
      const client = clients.find(c => c.id === selectedClientId);

      if (!process || !template || !client) {
          throw new Error("Processo, modelo ou cliente selecionado não foi encontrado.");
      }

      let content = template.content;

      // Replace client variables
      content = content.replace(/\{\{cliente\.nome\}\}/g, client.name || "");
      content = content.replace(/\{\{cliente\.cpf\}\}/g, client.cpf || "");
      content = content.replace(/\{\{cliente\.contato\}\}/g, client.contact || "");
      content = content.replace(/\{\{cliente\.endereco\}\}/g, client.address || "");
      
      // Replace process variables
      content = content.replace(/\{\{processo\.numero\}\}/g, process.processNumber || "");
      content = content.replace(/\{\{processo\.tipo\}\}/g, process.type || "");
      content = content.replace(/\{\{processo\.status\}\}/g, process.status || "");
      
      setGeneratedContent(content);
      toast({ title: "Documento Gerado!", description: "O texto foi preenchido com base no modelo." });

    } catch(error: any) {
        toast({ title: "Erro ao gerar documento", description: error.message, variant: "destructive" });
        setGeneratedContent("");
    } finally {
        setIsGenerating(false);
    }
  };

  const handleCopyToClipboard = () => {
    if (!generatedContent) return;
    navigator.clipboard.writeText(generatedContent);
    toast({ title: "Copiado!", description: "O conteúdo do documento foi copiado para a área de transferência." });
  };
  
  const handleDownloadPdf = () => {
      if (!generatedContent) return;

      const pdf = new jsPDF({
        compress: true,
      });
      
      const textLines = pdf.splitTextToSize(generatedContent, 180);
      pdf.text(textLines, 15, 20);

      const process = processes.find(p => p.id === selectedProcessId);
      const fileName = `doc-${process?.processNumber || 'gerado'}.pdf`;

      pdf.save(fileName);
      toast({ title: "PDF baixado!", description: `O arquivo ${fileName} foi salvo.` });
  };

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8">
      <h1 className="text-4xl font-headline font-extrabold text-primary mb-8">Gerador de Documentos</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Coluna de Configuração */}
        <Card className="lg:col-span-1 shadow-lg sticky top-8">
            <CardHeader>
                <CardTitle>1. Configurar</CardTitle>
                <CardDescription>Escolha o cliente, processo e modelo para gerar seu documento.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {isLoadingData ? (
                    <div className="space-y-4">
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                ) : (
                    <>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Cliente</label>
                             <Select onValueChange={handleClientChange} value={selectedClientId || ""}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione um cliente" />
                                </SelectTrigger>
                                <SelectContent>
                                    {clients.map(c => (
                                        <SelectItem key={c.id} value={c.id}>
                                            {c.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Processo</label>
                            <Select onValueChange={setSelectedProcessId} value={selectedProcessId || ""} disabled={!selectedClientId}>
                                <SelectTrigger>
                                    <SelectValue placeholder={selectedClientId ? "Selecione um processo" : "Primeiro escolha um cliente"} />
                                </SelectTrigger>
                                <SelectContent>
                                    {filteredProcesses.map(p => (
                                        <SelectItem key={p.id} value={p.id}>
                                            {p.processNumber} - {p.type}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Modelo de Documento</label>
                            <Select onValueChange={setSelectedTemplateId} value={selectedTemplateId || ""}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione um modelo" />
                                </SelectTrigger>
                                <SelectContent>
                                    {templates.map(t => (
                                        <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </>
                )}
            </CardContent>
            <CardFooter>
                 <Button onClick={handleGenerate} disabled={isGenerating || isLoadingData || !selectedProcessId || !selectedTemplateId} className="w-full">
                    {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Wand2 className="mr-2 h-4 w-4"/>}
                    Gerar Documento
                </Button>
            </CardFooter>
        </Card>

        {/* Coluna de Resultado */}
        <Card className="lg:col-span-2 shadow-lg">
            <CardHeader>
                <CardTitle>2. Resultado</CardTitle>
                <CardDescription>O documento gerado aparecerá aqui. Você pode editar, copiar ou baixar em PDF.</CardDescription>
            </CardHeader>
            <CardContent>
                <Textarea
                    value={generatedContent}
                    onChange={(e) => setGeneratedContent(e.target.value)}
                    placeholder="O conteúdo do seu documento gerado será exibido aqui..."
                    className="min-h-[400px] text-sm bg-muted/30"
                />
            </CardContent>
             <CardFooter className="justify-end gap-2">
                <Button variant="outline" onClick={handleCopyToClipboard} disabled={!generatedContent}>
                    <Copy className="mr-2 h-4 w-4" /> Copiar Texto
                </Button>
                <Button onClick={handleDownloadPdf} disabled={!generatedContent}>
                    <FileDown className="mr-2 h-4 w-4" /> Baixar PDF
                </Button>
            </CardFooter>
        </Card>
      </div>
    </div>
  );
}

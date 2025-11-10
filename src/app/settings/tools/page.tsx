
"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Users, FileSignature, ImageIcon, Trash2 } from "lucide-react";
import { getProcesses } from "@/services/processService";
import { addClient, getClients } from "@/services/clientService";
import { Input } from "@/components/ui/input";
import Link from 'next/link';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";


export default function ToolsPage() {
  const { toast } = useToast();
  const [isSyncing, setIsSyncing] = React.useState(false);

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8">
       <div className="flex items-center justify-between mb-8">
            <h1 className="text-4xl font-headline font-extrabold text-primary">Configurações</h1>
            <div></div>
        </div>

      <Tabs defaultValue="tools">
        <TabsList className="mb-6">
          <TabsTrigger value="general">
             <Link href="/settings">Geral</Link>
          </TabsTrigger>
          <TabsTrigger value="tools">Ferramentas</TabsTrigger>
        </TabsList>
        <TabsContent value="tools">
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                <Card className="shadow-lg">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <FileSignature />
                            Modelo de PDF
                        </CardTitle>
                        <CardDescription>
                           Defina um cabeçalho e rodapé padrão (papel timbrado) para os documentos PDF gerados.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Link href="/settings/tools/pdf-template" passHref>
                             <Button>
                                <ImageIcon className="mr-2 h-4 w-4" />
                                Editar Modelos de PDF
                            </Button>
                        </Link>
                    </CardContent>
                </Card>

                <Card className="shadow-lg">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <FileSignature />
                            Modelos de Documentos
                        </CardTitle>
                        <CardDescription>
                           Crie e gerencie modelos de texto para gerar documentos rapidamente.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Link href="/settings/tools/document-templates" passHref>
                             <Button>
                                <FileSignature className="mr-2 h-4 w-4" />
                                Gerenciar Modelos
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

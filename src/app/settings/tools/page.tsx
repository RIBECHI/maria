
"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Users } from "lucide-react";
import { getProcesses } from "@/services/processService";
import { addClient, getClients } from "@/services/clientService";

export default function ToolsPage() {
  const { toast } = useToast();
  const [isSyncing, setIsSyncing] = React.useState(false);

  const handleSyncClients = async () => {
    setIsSyncing(true);
    toast({
      title: "Iniciando sincronização...",
      description: "Buscando processos e clientes para verificar inconsistências.",
    });

    try {
      const allProcesses = await getProcesses();
      const allClients = await getClients();
      const existingClientNames = new Set(allClients.map(c => c.name.toLowerCase()));
      const clientsToCreate = new Set<string>();

      for (const process of allProcesses) {
        if (process.client && !existingClientNames.has(process.client.toLowerCase())) {
          clientsToCreate.add(process.client);
        }
      }

      if (clientsToCreate.size === 0) {
        toast({
          title: "Sincronização Concluída",
          description: "Nenhum cliente novo para adicionar. Sua lista já está sincronizada.",
        });
        setIsSyncing(false);
        return;
      }

      toast({
        title: "Sincronizando...",
        description: `Encontrados ${clientsToCreate.size} clientes para adicionar.`,
      });

      let createdCount = 0;
      for (const clientName of clientsToCreate) {
        await addClient({
          name: clientName,
          contact: "Contato não informado",
          caseCount: 0, 
          lastActivity: new Date().toISOString().split('T')[0],
        });
        createdCount++;
      }

      toast({
        title: "Sucesso!",
        description: `${createdCount} cliente(s) foram adicionados à sua lista principal.`,
        variant: "default",
      });

    } catch (error) {
      console.error("Error syncing clients:", error);
      toast({
        title: "Erro na Sincronização",
        description: "Não foi possível sincronizar os clientes. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8">
      <h1 className="text-4xl font-headline font-extrabold text-primary mb-8">Ferramentas</h1>
      
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users />
            Sincronizador de Clientes
          </CardTitle>
          <CardDescription>
            Esta ferramenta verifica todos os seus processos e cria uma ficha de cliente para qualquer cliente que exista em um processo mas não esteja na sua lista principal de clientes.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleSyncClients} disabled={isSyncing}>
            {isSyncing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sincronizando...
              </>
            ) : (
              "Sincronizar Clientes Agora"
            )}
          </Button>
          <p className="text-xs text-muted-foreground mt-2">
            Esta operação pode levar alguns segundos dependendo do número de processos.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

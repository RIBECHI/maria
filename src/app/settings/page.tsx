
"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/contexts/UserContext";
import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function SettingsPage() {
  const { toast } = useToast();
  const { userName, setUserName } = useUser();
  const [displayName, setDisplayName] = React.useState(userName);
  const [emailNotificationsPrazos, setEmailNotificationsPrazos] = React.useState(true);
  const [emailNotificationsLegal, setEmailNotificationsLegal] = React.useState(true);
  
  React.useEffect(() => {
    setDisplayName(userName);
  }, [userName]);


  const handleSaveChanges = () => {
    setUserName(displayName);
    
    console.log("Configurações salvas:", {
      displayName,
      emailNotificationsPrazos,
      emailNotificationsLegal,
    });
    toast({
      title: "Configurações Salvas!",
      description: "Suas preferências foram atualizadas.",
    });
  };

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-4xl font-headline font-extrabold text-primary">Configurações</h1>
        <Button onClick={handleSaveChanges} size="lg">
          Salvar Alterações
        </Button>
      </div>

      <Tabs defaultValue="general">
        <TabsList className="mb-6">
          <TabsTrigger value="general">Geral</TabsTrigger>
          <TabsTrigger value="tools">
            <Link href="/settings/tools">Ferramentas</Link>
          </TabsTrigger>
        </TabsList>
        <TabsContent value="general">
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            <Card className="lg:col-span-2 shadow-lg">
              <CardHeader>
                <CardTitle>Perfil e Aparência</CardTitle>
                <CardDescription>Personalize suas informações e a aparência do sistema.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="displayName">Nome de Exibição</Label>
                  <Input
                    id="displayName"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Seu nome ou nome do escritório"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>Preferências de Notificação</CardTitle>
                <CardDescription>Escolha como você deseja ser notificado.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between space-y-2">
                  <Label htmlFor="emailPrazos" className="flex flex-col space-y-1">
                    <span>Prazos por E-mail</span>
                    <span className="font-normal leading-snug text-muted-foreground text-xs">
                      Receber e-mails sobre próximos prazos da agenda.
                    </span>
                  </Label>
                  <Switch
                    id="emailPrazos"
                    checked={emailNotificationsPrazos}
                    onCheckedChange={setEmailNotificationsPrazos}
                  />
                </div>
                <div className="flex items-center justify-between space-y-2 border-t pt-4 mt-4">
                  <Label htmlFor="emailLegal" className="flex flex-col space-y-1">
                    <span>Atualizações Legais por E-mail</span>
                    <span className="font-normal leading-snug text-muted-foreground text-xs">
                      Receber e-mails sobre novas atualizações do Lembrete Legal.
                    </span>
                  </Label>
                  <Switch
                    id="emailLegal"
                    checked={emailNotificationsLegal}
                    onCheckedChange={setEmailNotificationsLegal}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

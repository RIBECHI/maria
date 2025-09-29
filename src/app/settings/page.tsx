
"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Moon, Sun } from "lucide-react";
import { useUser } from "@/contexts/UserContext";

export default function SettingsPage() {
  const { toast } = useToast();
  const { userName, setUserName } = useUser();
  const [displayName, setDisplayName] = React.useState(userName);
  const [emailNotificationsPrazos, setEmailNotificationsPrazos] = React.useState(true);
  const [emailNotificationsLegal, setEmailNotificationsLegal] = React.useState(true);
  const [isDarkMode, setIsDarkMode] = React.useState(false);

  React.useEffect(() => {
    // Sincroniza o estado local se o nome do contexto mudar (ex: ao carregar do localStorage)
    setDisplayName(userName);
  }, [userName]);

  React.useEffect(() => {
    const storedTheme = localStorage.getItem("theme");
    if (storedTheme === "dark") {
      setIsDarkMode(true);
      document.documentElement.classList.add("dark");
    } else {
      setIsDarkMode(false);
      document.documentElement.classList.remove("dark");
    }
  }, []);

  const handleThemeToggle = (checked: boolean) => {
    setIsDarkMode(checked);
    if (checked) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

  const handleSaveChanges = () => {
    // Atualiza o nome de exibição no contexto global
    setUserName(displayName);
    
    // Simula o salvamento das outras configurações
    console.log("Configurações salvas:", {
      displayName,
      emailNotificationsPrazos,
      emailNotificationsLegal,
      isDarkMode,
    });
    toast({
      title: "Configurações Salvas!",
      description: "Suas preferências foram atualizadas.",
    });
  };

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8">
      <h1 className="text-4xl font-headline font-extrabold text-primary mb-8">Configurações</h1>

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
            
            <div className="flex items-center justify-between space-y-2 border-t pt-4 mt-4">
              <div className="flex items-center space-x-2">
                {isDarkMode ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
                <Label htmlFor="darkModeToggle">Modo Escuro</Label>
              </div>
              <Switch
                id="darkModeToggle"
                checked={isDarkMode}
                onCheckedChange={handleThemeToggle}
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

      <div className="mt-8 flex justify-end">
        <Button onClick={handleSaveChanges} size="lg">
          Salvar Alterações
        </Button>
      </div>
    </div>
  );
}

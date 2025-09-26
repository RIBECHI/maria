
"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Save } from "lucide-react";

export default function NotepadPage() {
  const { toast } = useToast();
  const [notepadContent, setNotepadContent] = React.useState("");

  // Efeito para carregar o conteúdo salvo no localStorage ao montar o componente
  React.useEffect(() => {
    const savedContent = localStorage.getItem("notepadContent");
    if (savedContent) {
      setNotepadContent(savedContent);
    }
  }, []);


  const handleSave = () => {
    // Salva o conteúdo no localStorage para persistência na sessão do navegador
    localStorage.setItem("notepadContent", notepadContent);
    toast({
      title: "Anotações Salvas!",
      description: "Suas anotações foram salvas localmente no seu navegador.",
    });
  };

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8">
      <h1 className="text-3xl font-headline font-bold text-primary mb-8">Bloco de Notas</h1>
      
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl font-headline">Rascunhos e Anotações</CardTitle>
          <CardDescription>
            Use este espaço para anotações rápidas. Elas serão salvas no seu navegador.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Digite suas anotações aqui..."
            className="min-h-[50vh] resize-y"
            value={notepadContent}
            onChange={(e) => setNotepadContent(e.target.value)}
          />
        </CardContent>
        <CardFooter>
          <Button onClick={handleSave} className="ml-auto">
            <Save className="mr-2 h-4 w-4" />
            Salvar
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

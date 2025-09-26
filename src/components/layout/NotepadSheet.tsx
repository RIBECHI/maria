
"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Save } from "lucide-react";

interface NotepadSheetProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export function NotepadSheet({ isOpen, onOpenChange }: NotepadSheetProps) {
  const { toast } = useToast();
  const [notepadContent, setNotepadContent] = React.useState("");

  // Efeito para carregar o conteúdo salvo no localStorage ao montar o componente
  React.useEffect(() => {
    // Acessa o localStorage apenas no lado do cliente
    try {
      const savedContent = localStorage.getItem("notepadContent");
      if (savedContent) {
        setNotepadContent(savedContent);
      }
    } catch (error) {
      console.warn("Could not access localStorage for notepad.");
    }
  }, []);

  const handleSave = () => {
    try {
      // Salva o conteúdo no localStorage para persistência na sessão do navegador
      localStorage.setItem("notepadContent", notepadContent);
      toast({
        title: "Anotações Salvas!",
        description: "Suas anotações foram salvas localmente no seu navegador.",
      });
    } catch (error) {
       toast({
        title: "Erro ao Salvar",
        description: "Não foi possível salvar as anotações.",
        variant: "destructive",
      });
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg flex flex-col">
        <SheetHeader>
          <SheetTitle>Bloco de Notas</SheetTitle>
          <SheetDescription>
            Use este espaço para rascunhos e anotações rápidas. Suas notas são salvas localmente.
          </SheetDescription>
        </SheetHeader>
        <div className="flex-1 py-4">
          <Textarea
            placeholder="Digite suas anotações aqui..."
            className="h-full resize-none"
            value={notepadContent}
            onChange={(e) => setNotepadContent(e.target.value)}
          />
        </div>
        <SheetFooter>
          <Button onClick={handleSave} className="ml-auto">
            <Save className="mr-2 h-4 w-4" />
            Salvar Anotações
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

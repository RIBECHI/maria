
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
import { Save, Loader2 } from "lucide-react";
import { getNotepadContent, saveNotepadContent } from "@/services/notepadService";
import { Skeleton } from "@/components/ui/skeleton";

interface NotepadSheetProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export function NotepadSheet({ isOpen, onOpenChange }: NotepadSheetProps) {
  const { toast } = useToast();
  const [notepadContent, setNotepadContent] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);

  React.useEffect(() => {
    if (isOpen) {
      const fetchContent = async () => {
        setIsLoading(true);
        try {
          const content = await getNotepadContent();
          setNotepadContent(content);
        } catch (error) {
          console.error("Failed to load notepad content:", error);
          toast({
            title: "Erro ao Carregar Notas",
            description: "Não foi possível buscar as anotações do banco de dados.",
            variant: "destructive",
          });
        } finally {
          setIsLoading(false);
        }
      };
      fetchContent();
    }
  }, [isOpen, toast]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await saveNotepadContent(notepadContent);
      toast({
        title: "Anotações Salvas!",
        description: "Suas anotações foram salvas no banco de dados.",
      });
    } catch (error) {
       toast({
        title: "Erro ao Salvar",
        description: "Não foi possível salvar as anotações na nuvem.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg flex flex-col">
        <SheetHeader>
          <SheetTitle>Bloco de Notas</SheetTitle>
          <SheetDescription>
            Use este espaço para rascunhos e anotações rápidas. Suas notas são salvas na nuvem.
          </SheetDescription>
        </SheetHeader>
        <div className="flex-1 py-4">
          {isLoading ? (
            <Skeleton className="h-full w-full" />
          ) : (
            <Textarea
              placeholder="Digite suas anotações aqui..."
              className="h-full resize-none"
              value={notepadContent}
              onChange={(e) => setNotepadContent(e.target.value)}
              disabled={isSaving}
            />
          )}
        </div>
        <SheetFooter>
          <Button onClick={handleSave} disabled={isLoading || isSaving} className="ml-auto">
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Salvar Anotações
              </>
            )}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

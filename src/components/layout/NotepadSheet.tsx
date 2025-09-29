
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
import { Save, Loader2, PlusCircle, Trash2, XCircle } from "lucide-react";
import { getNotes, saveNotes, type Note } from "@/services/notepadService";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Timestamp } from "firebase/firestore";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface NotepadSheetProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export function NotepadSheet({ isOpen, onOpenChange }: NotepadSheetProps) {
  const { toast } = useToast();
  const [notes, setNotes] = React.useState<Note[]>([]);
  const [newNoteContent, setNewNoteContent] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);
  const [noteToDelete, setNoteToDelete] = React.useState<Note | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);


  React.useEffect(() => {
    if (isOpen) {
      const fetchContent = async () => {
        setIsLoading(true);
        try {
          const content = await getNotes();
          setNotes(content);
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
    } else {
        // Limpa o estado quando o painel é fechado para garantir que dados novos sejam carregados na próxima abertura
        setNewNoteContent("");
        setNotes([]);
    }
  }, [isOpen, toast]);

  const handleAddNote = async () => {
    if (newNoteContent.trim() === "") {
        toast({ title: "Nota vazia", description: "Por favor, escreva algo antes de adicionar.", variant: "destructive" });
        return;
    }
    
    setIsSaving(true);
    
    const newNote: Note = {
        id: `note-${Date.now()}`,
        content: newNoteContent,
        createdAt: Timestamp.now(),
    };

    const updatedNotes = [newNote, ...notes];

    try {
        await saveNotes(updatedNotes);
        setNotes(updatedNotes);
        setNewNoteContent(""); // Limpa o textarea
        toast({
            title: "Anotação Adicionada!",
        });
    } catch (error) {
       toast({
        title: "Erro ao Adicionar Nota",
        description: "Não foi possível salvar a nova anotação na nuvem.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const confirmDeleteNote = async () => {
    if (noteToDelete) {
      setIsSaving(true);
      const updatedNotes = notes.filter(note => note.id !== noteToDelete.id);
      try {
        await saveNotes(updatedNotes);
        setNotes(updatedNotes);
        toast({
          title: "Anotação Excluída!",
        });
      } catch (error) {
        toast({
          title: "Erro ao Excluir",
          description: "Não foi possível excluir a anotação.",
          variant: "destructive",
        });
      } finally {
        setIsSaving(false);
        setNoteToDelete(null);
        setIsDeleteDialogOpen(false);
      }
    }
  };

  const handleDeleteConfirmation = (note: Note) => {
    setNoteToDelete(note);
    setIsDeleteDialogOpen(true);
  };


  return (
    <>
      <Sheet open={isOpen} onOpenChange={onOpenChange}>
        <SheetContent className="w-full sm:max-w-lg flex flex-col">
          <SheetHeader>
            <SheetTitle>Bloco de Notas</SheetTitle>
            <SheetDescription>
              Use este espaço para rascunhos e anotações rápidas. Suas notas são salvas na nuvem com data e hora.
            </SheetDescription>
          </SheetHeader>

          <div className="py-4 space-y-4">
              <div className="space-y-2">
                <Textarea
                    placeholder="Digite sua nova anotação aqui..."
                    className="h-24 resize-y"
                    value={newNoteContent}
                    onChange={(e) => setNewNoteContent(e.target.value)}
                    disabled={isSaving}
                />
                <Button onClick={handleAddNote} disabled={isSaving} className="w-full">
                    {isSaving && !noteToDelete ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Adicionando...
                    </>
                    ) : (
                    <>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Adicionar Anotação
                    </>
                    )}
                </Button>
              </div>

            <div className="flex-1 flex flex-col">
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Anotações Salvas</h3>
                {isLoading ? (
                    <div className="space-y-2">
                        <Skeleton className="h-20 w-full" />
                        <Skeleton className="h-20 w-full" />
                    </div>
                ) : (
                    <ScrollArea className="h-[calc(100vh-320px)] pr-4 -mr-4">
                    {notes.length > 0 ? (
                        <div className="space-y-3">
                        {notes.map(note => (
                            <Card key={note.id} className="bg-muted/40 relative group">
                            <CardContent className="p-3">
                                <p className="text-sm whitespace-pre-wrap">{note.content}</p>
                                <p className="text-xs text-muted-foreground mt-2">
                                {note.createdAt ? format(note.createdAt.toDate(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }) : 'Salvando...'}
                                </p>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="absolute top-1 right-1 h-7 w-7 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity hover:text-destructive"
                                  onClick={() => handleDeleteConfirmation(note)}
                                  disabled={isSaving}
                                  aria-label="Excluir nota"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                            </CardContent>
                            </Card>
                        ))}
                        </div>
                    ) : (
                        <div className="text-center text-muted-foreground py-10">
                            Nenhuma anotação salva.
                        </div>
                    )}
                    </ScrollArea>
                )}
            </div>
          </div>
          
        </SheetContent>
      </Sheet>
      
      {noteToDelete && (
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir esta anotação? Esta ação não poderá ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setIsDeleteDialogOpen(false)}>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDeleteNote} className="bg-destructive hover:bg-destructive/90">Excluir</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  );
}

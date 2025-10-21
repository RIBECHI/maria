
"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Save, Loader2, PlusCircle, Trash2, XCircle, CalendarPlus } from "lucide-react";
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
import { EventFormDialog, type CalendarEvent, type EventFormValues } from "@/components/agenda/EventFormDialog";
import { addEvent } from "@/services/eventService";
import { Checkbox } from "../ui/checkbox";
import { Label } from "../ui/label";


interface NotepadSheetProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export function NotepadSheet({ isOpen, onOpenChange }: NotepadSheetProps) {
  const { toast } = useToast();
  const [notes, setNotes] = React.useState<Note[]>([]);
  const [newNoteContent, setNewNoteContent] = React.useState("");
  const [isTask, setIsTask] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);
  const [noteToDelete, setNoteToDelete] = React.useState<Note | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [isEventDialogOpen, setIsEventDialogOpen] = React.useState(false);
  const [eventToCreate, setEventToCreate] = React.useState<Partial<CalendarEvent> | undefined>(undefined);


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
        setIsTask(false);
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
        isTask: isTask,
        ...(isTask && { completed: false }), // Apenas adiciona `completed` se for uma tarefa
    };

    const updatedNotes = [newNote, ...notes];

    try {
        await saveNotes(updatedNotes);
        setNotes(updatedNotes);
        setNewNoteContent(""); // Limpa o textarea
        setIsTask(false); // Reseta o checkbox
        toast({
            title: isTask ? "Tarefa Adicionada!" : "Anotação Adicionada!",
            description: isTask ? "A nova tarefa também aparecerá na página de Tarefas." : "",
        });
    } catch (error) {
       toast({
        title: "Erro ao Adicionar",
        description: "Não foi possível salvar a nova anotação/tarefa na nuvem.",
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
  
  const handleScheduleFromNote = (note: Note) => {
    setEventToCreate({
      description: note.content,
      date: new Date().toISOString(), // Preenche a data atual para evitar o erro
    });
    setIsEventDialogOpen(true);
  };
  
  const handleToggleTask = async (noteId: string) => {
    const updatedNotes = notes.map(note =>
        note.id === noteId ? { ...note, completed: !note.completed } : note
    );
    setNotes(updatedNotes); // Optimistic update
    try {
        await saveNotes(updatedNotes);
    } catch(error) {
        toast({ title: "Erro ao atualizar tarefa", variant: "destructive" });
        // Revert on error
        setNotes(notes);
    }
  };

  const handleSubmitEventForm = async (data: Omit<EventFormValues, "clientId"> & { client?: string }) => {
    try {
        await addEvent(data);
        toast({ title: "Evento adicionado!", description: `O evento foi adicionado à sua agenda.` });
        setIsEventDialogOpen(false);
    } catch(error) {
      console.error("Failed to save event from note:", error);
      toast({ title: "Erro ao agendar", description: "Não foi possível salvar o evento.", variant: "destructive" });
    }
  };


  return (
    <>
      <Sheet open={isOpen} onOpenChange={onOpenChange}>
        <SheetContent side="left" className="w-full sm:max-w-lg flex flex-col">
          <SheetHeader>
            <SheetTitle>Bloco de Notas Rápido</SheetTitle>
            <SheetDescription>
              Use para rascunhos, anotações e tarefas rápidas. Itens marcados como tarefas aparecerão na página principal de Tarefas.
            </SheetDescription>
          </SheetHeader>

          <div className="py-4 space-y-4">
              <div className="space-y-3">
                <Textarea
                    placeholder="Digite sua nova anotação ou tarefa aqui..."
                    className="h-24 resize-y"
                    value={newNoteContent}
                    onChange={(e) => setNewNoteContent(e.target.value)}
                    disabled={isSaving}
                />
                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center space-x-2">
                        <Checkbox id="is-task-note" checked={isTask} onCheckedChange={(checked) => setIsTask(!!checked)} />
                        <Label htmlFor="is-task-note" className="text-sm font-normal">É uma tarefa pendente?</Label>
                    </div>
                    <Button onClick={handleAddNote} disabled={isSaving || newNoteContent.trim() === ""} className="flex-1">
                        {isSaving && !noteToDelete ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Adicionando...
                        </>
                        ) : (
                        <>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Adicionar
                        </>
                        )}
                    </Button>
                </div>
              </div>

            <div className="flex-1 flex flex-col">
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Anotações e Tarefas Salvas</h3>
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
                                {note.isTask ? (
                                    <div className="flex items-start gap-3">
                                        <Checkbox 
                                            id={`task-note-${note.id}`}
                                            checked={note.completed}
                                            onCheckedChange={() => handleToggleTask(note.id)}
                                            className="mt-1"
                                        />
                                        <div className="flex-1">
                                             <label htmlFor={`task-note-${note.id}`} className={`block text-sm cursor-pointer ${note.completed ? 'line-through text-muted-foreground' : ''}`}>
                                                {note.content}
                                            </label>
                                            <p className={`text-xs text-muted-foreground mt-2 ${note.completed ? 'line-through' : ''}`}>
                                                Tarefa criada em {note.createdAt ? format(note.createdAt.toDate(), "dd/MM/yyyy", { locale: ptBR }) : '...'}
                                            </p>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <p className="text-sm whitespace-pre-wrap">{note.content}</p>
                                        <p className="text-xs text-muted-foreground mt-2">
                                            Anotado em {note.createdAt ? format(note.createdAt.toDate(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }) : '...'}
                                        </p>
                                    </>
                                )}
                                <div className="absolute top-1 right-1 flex opacity-0 group-hover:opacity-100 transition-opacity">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 text-muted-foreground hover:text-primary"
                                    onClick={() => handleScheduleFromNote(note)}
                                    disabled={isSaving}
                                    title="Agendar esta anotação"
                                    aria-label="Agendar nota"
                                  >
                                    <CalendarPlus className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 text-muted-foreground hover:text-destructive"
                                    onClick={() => handleDeleteConfirmation(note)}
                                    disabled={isSaving}
                                    title="Excluir esta anotação"
                                    aria-label="Excluir nota"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
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
                Tem certeza que deseja excluir este item? Esta ação não poderá ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setIsDeleteDialogOpen(false)}>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDeleteNote} className="bg-destructive hover:bg-destructive/90">Excluir</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {/* Dialog para agendar evento a partir da nota */}
      <EventFormDialog
        isOpen={isEventDialogOpen}
        onClose={() => setIsEventDialogOpen(false)}
        onSubmit={handleSubmitEventForm}
        eventData={eventToCreate}
      />
    </>
  );
}

    
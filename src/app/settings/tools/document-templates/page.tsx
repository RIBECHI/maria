
"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PlusCircle, Edit, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
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
import { getTemplates, addTemplate, updateTemplate, deleteTemplate, type DocumentTemplate, type TemplateFormValues } from "@/services/templateService";
import { Skeleton } from "@/components/ui/skeleton";
import { TemplateFormDialog } from "@/components/templates/TemplateFormDialog";
import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function DocumentTemplatesPage() {
  const [templates, setTemplates] = React.useState<DocumentTemplate[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [editingTemplate, setEditingTemplate] = React.useState<DocumentTemplate | undefined>(undefined);
  const [isAlertOpen, setIsAlertOpen] = React.useState(false);
  const [templateToDelete, setTemplateToDelete] = React.useState<DocumentTemplate | null>(null);
  const { toast } = useToast();

  const fetchTemplates = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getTemplates();
      setTemplates(data);
    } catch (error) {
      console.error("Error fetching templates:", error);
      toast({ title: "Erro ao buscar modelos", description: "Não foi possível carregar a lista.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  React.useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const handleOpenForm = (template?: DocumentTemplate) => {
    setEditingTemplate(template);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setEditingTemplate(undefined);
    setIsFormOpen(false);
  };

  const handleSubmit = async (data: TemplateFormValues) => {
    try {
      if (editingTemplate) {
        await updateTemplate(editingTemplate.id, data);
        toast({ title: "Modelo atualizado!", description: "Suas alterações foram salvas." });
      } else {
        await addTemplate(data);
        toast({ title: "Modelo criado!", description: "O novo modelo já está disponível para uso." });
      }
      fetchTemplates(); // Re-fetch to update list
      handleCloseForm();
    } catch (error) {
      console.error("Failed to save template:", error);
      toast({ title: "Erro ao salvar", description: "Não foi possível salvar o modelo.", variant: "destructive" });
    }
  };

  const handleDelete = (template: DocumentTemplate) => {
    setTemplateToDelete(template);
    setIsAlertOpen(true);
  };

  const confirmDelete = async () => {
    if (templateToDelete) {
      try {
        await deleteTemplate(templateToDelete.id);
        setTemplates(prev => prev.filter(t => t.id !== templateToDelete.id));
        toast({ title: "Modelo excluído!", description: `O modelo "${templateToDelete.name}" foi removido.` });
      } catch (error) {
        console.error("Failed to delete template:", error);
        toast({ title: "Erro ao excluir", description: "Não foi possível remover o modelo.", variant: "destructive" });
      } finally {
        setTemplateToDelete(null);
        setIsAlertOpen(false);
      }
    }
  };

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-4xl font-headline font-extrabold text-primary">Modelos de Documentos</h1>
        <Button onClick={() => handleOpenForm()}>
          <PlusCircle className="mr-2 h-5 w-5" /> Criar Novo Modelo
        </Button>
      </div>

       <Tabs defaultValue="tools">
        <TabsList className="mb-6">
          <TabsTrigger value="general">
             <Link href="/settings">Geral</Link>
          </TabsTrigger>
          <TabsTrigger value="tools">
            <Link href="/settings/tools">Ferramentas</Link>
          </TabsTrigger>
        </TabsList>
      </Tabs>


      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Gerenciar Modelos</CardTitle>
          <CardDescription>Crie, edite e exclua seus modelos de documentos aqui.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome do Modelo</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-8 w-20" /></TableCell>
                  </TableRow>
                ))
              ) : templates.length > 0 ? (
                templates.map((template) => (
                  <TableRow key={template.id}>
                    <TableCell className="font-medium">{template.name}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" className="hover:text-accent" onClick={() => handleOpenForm(template)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="hover:text-destructive" onClick={() => handleDelete(template)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={2} className="text-center h-24">
                    Nenhum modelo encontrado. Crie um para começar!
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <TemplateFormDialog
        isOpen={isFormOpen}
        onClose={handleCloseForm}
        onSubmit={handleSubmit}
        templateData={editingTemplate}
      />

      {templateToDelete && (
        <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir o modelo "{templateToDelete.name}"? Esta ação não poderá ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">Excluir</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}

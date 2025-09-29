
"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { UploadCloud, Eye, Download, Edit, Trash2, Search } from "lucide-react";
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
import { DocumentFormDialog, type DocumentFormValues, type Document } from "@/components/documents/DocumentFormDialog";
import { getDocuments, addDocument, updateDocument, deleteDocument } from "@/services/documentService";
import { Skeleton } from "@/components/ui/skeleton";

export default function DocumentsPage() {
  const [documents, setDocuments] = React.useState<Document[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isFormDialogOpen, setIsFormDialogOpen] = React.useState(false);
  const [editingDocument, setEditingDocument] = React.useState<Document | undefined>(undefined);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [documentToDelete, setDocumentToDelete] = React.useState<Document | null>(null);
  const [searchTerm, setSearchTerm] = React.useState("");
  const { toast } = useToast();

  const fetchDocuments = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const docsFromDb = await getDocuments();
      setDocuments(docsFromDb);
    } catch (error) {
      console.error("Error fetching documents:", error);
      toast({
        title: "Erro ao buscar documentos",
        description: "Não foi possível carregar a lista de documentos.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  React.useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const handleOpenFormDialog = (doc?: Document) => {
    setEditingDocument(doc);
    setIsFormDialogOpen(true);
  };

  const handleCloseFormDialog = () => {
    setEditingDocument(undefined);
    setIsFormDialogOpen(false);
  };

  const handleSubmitDocumentForm = async (data: DocumentFormValues) => {
    try {
      if (editingDocument) {
        const updatedDoc = await updateDocument(editingDocument.id, data);
        setDocuments(documents.map(d => (d.id === editingDocument.id ? { ...d, ...updatedDoc } : d)));
        toast({ title: "Documento atualizado!", description: `O documento ${data.name} foi atualizado.` });
      } else {
        const newDocument = await addDocument(data);
        setDocuments(prevDocs => [newDocument, ...prevDocs]);
        toast({ title: "Documento adicionado!", description: `O documento ${newDocument.name} foi adicionado.` });
      }
      handleCloseFormDialog();
    } catch (error) {
      console.error("Failed to save document:", error);
      toast({ title: "Erro ao salvar", description: "Não foi possível salvar o documento.", variant: "destructive" });
    }
  };

  const handleDeleteConfirmation = (doc: Document) => {
    setDocumentToDelete(doc);
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteDocument = async () => {
    if (documentToDelete) {
      try {
        await deleteDocument(documentToDelete.id);
        setDocuments(documents.filter(d => d.id !== documentToDelete.id));
        toast({ title: "Documento excluído!", description: `O documento ${documentToDelete.name} foi excluído.`});
      } catch (error) {
        console.error("Failed to delete document:", error);
        toast({ title: "Erro ao excluir", description: "Não foi possível excluir o documento.", variant: "destructive" });
      } finally {
        setDocumentToDelete(null);
        setIsDeleteDialogOpen(false);
      }
    }
  };

  const handleViewDocument = (doc: Document) => {
    console.log("Visualizar documento:", doc);
    toast({ title: "Ação: Visualizar", description: `Visualizando detalhes de: ${doc.name}` });
  };

  const handleDownloadDocument = (doc: Document) => {
    console.log("Download documento:", doc);
    toast({ title: "Ação: Download", description: `Iniciando download de: ${doc.name}` });
  };

  const filteredDocuments = documents.filter(doc =>
    doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.process.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-4xl font-headline font-extrabold text-primary">Gestão de Documentos</h1>
        <Button onClick={() => handleOpenFormDialog()}>
          <UploadCloud className="mr-2 h-5 w-5" /> Carregar Documento
        </Button>
      </div>
      
      <div className="mb-6 flex items-center gap-2">
        <Search className="h-5 w-5 text-muted-foreground" />
        <Input
          placeholder="Buscar documentos por nome, processo ou tag..."
          className="max-w-sm"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Lista de Documentos</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome do Arquivo</TableHead>
                <TableHead>Processo Vinculado</TableHead>
                <TableHead>Tags</TableHead>
                <TableHead>Data de Upload</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-56" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-32 rounded-full" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-8 w-32" /></TableCell>
                  </TableRow>
                ))
              ) : filteredDocuments.length > 0 ? (
                filteredDocuments.map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell className="font-medium">{doc.name}</TableCell>
                    <TableCell>{doc.process}</TableCell>
                    <TableCell>
                      {doc.tags.map(tag => <Badge key={tag} variant="outline" className="mr-1 mb-1">{tag}</Badge>)}
                    </TableCell>
                    <TableCell>{doc.uploadDate}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" className="hover:text-accent" onClick={() => handleViewDocument(doc)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="hover:text-accent" onClick={() => handleDownloadDocument(doc)}>
                        <Download className="h-4 w-4" />
                      </Button>
                       <Button variant="ghost" size="icon" className="hover:text-accent" onClick={() => handleOpenFormDialog(doc)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="hover:text-destructive" onClick={() => handleDeleteConfirmation(doc)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                 <TableRow>
                  <TableCell colSpan={5} className="text-center h-24">
                    Nenhum documento encontrado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <DocumentFormDialog
        isOpen={isFormDialogOpen}
        onClose={handleCloseFormDialog}
        onSubmit={handleSubmitDocumentForm}
        documentData={editingDocument}
      />

      {documentToDelete && (
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir o documento "{documentToDelete.name}"? Esta ação não poderá ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setIsDeleteDialogOpen(false)}>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDeleteDocument} className="bg-destructive hover:bg-destructive/90">Excluir</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}

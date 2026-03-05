
"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { UploadCloud, Download, Edit, Trash2, Search } from "lucide-react";
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
import { getDocuments, addDocument, updateDocument, deleteDocument, getDownloadUrl } from "@/services/documentService";
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
        description: "Não foi possível carregar la lista de documentos.",
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

  const handleSubmitDocumentForm = async (data: DocumentFormValues, file?: File) => {
    try {
      if (editingDocument) {
        // A lógica de edição não lida com o upload de um novo arquivo, apenas com metadados.
        const dataToUpdate = { ...data, name: editingDocument.name };
        await updateDocument(editingDocument.id, dataToUpdate as DocumentFormValues & { name: string });
        toast({ title: "Documento atualizado!", description: `Os metadados do documento ${dataToUpdate.name} foram atualizados.` });
      } else {
        if (!file) {
            toast({ title: "Arquivo Faltando", description: "Por favor, selecione um arquivo para carregar.", variant: "destructive"});
            // Lança um erro para que o formulário saiba que a submissão falhou
            throw new Error("Arquivo não fornecido.");
        }
        toast({ title: "Iniciando upload...", description: `Enviando o arquivo ${file.name}. Isso pode levar um momento.` });
        
        // O serviço agora lida com o upload e a criação do documento no Firestore.
        await addDocument(data, file);
        
        toast({ title: "Documento adicionado!", description: `O documento ${file.name} foi carregado e salvo com sucesso.` });
      }
      handleCloseFormDialog();
      // Use um pequeno atraso para dar tempo ao Firestore de atualizar antes de refazer a busca
      setTimeout(() => fetchDocuments(), 500);
    } catch (error: any) {
      console.error("Falha ao salvar o documento:", error);
      toast({ title: "Erro ao Salvar", description: error.message || "Não foi possível salvar o documento.", variant: "destructive" });
      // Re-lançar o erro garante que o estado de 'loading' no formulário seja tratado corretamente.
      throw error;
    }
  };

  const handleDeleteConfirmation = (doc: Document) => {
    setDocumentToDelete(doc);
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteDocument = async () => {
    if (documentToDelete) {
      try {
        await deleteDocument(documentToDelete);
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

  const handleDownloadDocument = async (doc: Document) => {
    toast({ title: "Download iniciado", description: `Baixando ${doc.name}...` });
    try {
        const url = await getDownloadUrl(doc.filePath);
        
        const response = await fetch(url);
        const blob = await response.blob();
        const blobUrl = window.URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = doc.name;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(blobUrl);
        document.body.removeChild(a);

    } catch(error) {
        console.error("Download failed", error);
        toast({ title: "Falha no Download", description: "Não foi possível baixar o arquivo.", variant: "destructive" });
    }
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
                Tem certeza que deseja excluir o documento "{documentToDelete.name}"? Esta ação não poderá ser desfeita. O arquivo será permanentemente removido.
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

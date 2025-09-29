
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

const initialDocuments: Document[] = [
  { id: "DOC001", name: "Contrato Social Alpha.pdf", process: "PROC001", tags: ["Contrato", "Societário"], uploadDate: "2024-07-01" },
  { id: "DOC002", name: "Petição Inicial Silva.docx", process: "PROC002", tags: ["Petição", "Trabalhista"], uploadDate: "2024-06-15" },
  { id: "DOC003", name: "Procuração Oliveira.pdf", process: "PROC003", tags: ["Procuração"], uploadDate: "2024-05-20" },
  { id: "DOC004", name: "Laudo Técnico Beta.xslx", process: "PROC004", tags: ["Laudo", "Administrativo", "Perícia"], uploadDate: "2024-07-10" },
];

export default function DocumentsPage() {
  const [documents, setDocuments] = React.useState<Document[]>(initialDocuments);
  const [isFormDialogOpen, setIsFormDialogOpen] = React.useState(false);
  const [editingDocument, setEditingDocument] = React.useState<Document | undefined>(undefined);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [documentToDelete, setDocumentToDelete] = React.useState<Document | null>(null);
  const { toast } = useToast();

  const handleOpenFormDialog = (doc?: Document) => {
    setEditingDocument(doc);
    setIsFormDialogOpen(true);
  };

  const handleCloseFormDialog = () => {
    setEditingDocument(undefined);
    setIsFormDialogOpen(false);
  };

  const handleSubmitDocumentForm = (data: DocumentFormValues) => {
    if (editingDocument) {
      setDocuments(documents.map(d => 
        d.id === editingDocument.id ? { ...editingDocument, ...data, tags: data.tagsString.split(',').map(t => t.trim()).filter(t => t) } : d
      ));
      toast({ title: "Documento atualizado!", description: `O documento ${data.name} foi atualizado.` });
    } else {
      const newDocument: Document = {
        id: `DOC${String(documents.length + 1).padStart(3, '0')}`,
        ...data,
        tags: data.tagsString.split(',').map(t => t.trim()).filter(t => t),
        uploadDate: new Date().toISOString().split('T')[0],
      };
      setDocuments([...documents, newDocument]);
      toast({ title: "Documento adicionado!", description: `O documento ${newDocument.name} foi adicionado.` });
    }
    handleCloseFormDialog();
  };

  const handleDeleteConfirmation = (doc: Document) => {
    setDocumentToDelete(doc);
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteDocument = () => {
    if (documentToDelete) {
      setDocuments(documents.filter(d => d.id !== documentToDelete.id));
      toast({ title: "Documento excluído!", description: `O documento ${documentToDelete.name} foi excluído.`});
      setDocumentToDelete(null);
    }
    setIsDeleteDialogOpen(false);
  };

  const handleViewDocument = (doc: Document) => {
    console.log("Visualizar documento:", doc);
    toast({ title: "Ação: Visualizar", description: `Visualizando detalhes de: ${doc.name}` });
  };

  const handleDownloadDocument = (doc: Document) => {
    console.log("Download documento:", doc);
    toast({ title: "Ação: Download", description: `Iniciando download de: ${doc.name}` });
  };


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
          // onChange={(e) => setSearchTerm(e.target.value)} // Lógica de filtro a ser implementada
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
              {documents.map((doc) => (
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
              ))}
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

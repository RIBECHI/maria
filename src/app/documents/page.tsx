import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { UploadCloud, Eye, Download, Edit, Trash2 } from "lucide-react";

// Mock data for documents
const documents = [
  { id: "DOC001", name: "Contrato Social Alpha.pdf", process: "PROC001", tags: ["Contrato", "Societário"], uploadDate: "2024-07-01" },
  { id: "DOC002", name: "Petição Inicial Silva.docx", process: "PROC002", tags: ["Petição", "Trabalhista"], uploadDate: "2024-06-15" },
  { id: "DOC003", name: "Procuração Oliveira.pdf", process: "PROC003", tags: ["Procuração"], uploadDate: "2024-05-20" },
  { id: "DOC004", name: "Laudo Técnico Beta.xslx", process: "PROC004", tags: ["Laudo", "Administrativo", "Perícia"], uploadDate: "2024-07-10" },
];

export default function DocumentsPage() {
  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-headline font-bold text-primary">Gestão de Documentos</h1>
        <Button>
          <UploadCloud className="mr-2 h-5 w-5" /> Carregar Documento
        </Button>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl font-headline">Lista de Documentos</CardTitle>
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
                    <Button variant="ghost" size="icon" className="hover:text-accent">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="hover:text-accent">
                      <Download className="h-4 w-4" />
                    </Button>
                     <Button variant="ghost" size="icon" className="hover:text-accent">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

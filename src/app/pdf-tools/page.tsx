
"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { UploadCloud, FileDown, Loader2, Trash2, ArrowUpDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import jsPDF from 'jspdf';
import Pica from 'pica';

interface ImageFile {
  id: string;
  file: File;
  previewUrl: string;
}

export default function PdfToolsPage() {
  const [imageFiles, setImageFiles] = React.useState<ImageFile[]>([]);
  const [quality, setQuality] = React.useState([80]);
  const [isGenerating, setIsGenerating] = React.useState(false);
  const { toast } = useToast();
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const newImageFiles = Array.from(files)
        .filter(file => file.type.startsWith('image/'))
        .map(file => ({
          id: `${file.name}-${Date.now()}`,
          file,
          previewUrl: URL.createObjectURL(file),
        }));
      setImageFiles(prev => [...prev, ...newImageFiles]);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };
  
  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const files = event.dataTransfer.files;
    if (files) {
         const newImageFiles = Array.from(files)
        .filter(file => file.type.startsWith('image/'))
        .map(file => ({
          id: `${file.name}-${Date.now()}`,
          file,
          previewUrl: URL.createObjectURL(file),
        }));
      setImageFiles(prev => [...prev, ...newImageFiles]);
    }
  };

  const handleRemoveImage = (id: string) => {
    setImageFiles(prev => prev.filter(image => image.id !== id));
  };
  
  const handleGeneratePdf = async () => {
    if (imageFiles.length === 0) {
      toast({
        title: "Nenhuma imagem selecionada",
        description: "Por favor, adicione as imagens que deseja converter para PDF.",
        variant: "destructive",
      });
      return;
    }
  
    setIsGenerating(true);
    toast({
      title: "Gerando PDF...",
      description: "Aguarde enquanto processamos e otimizamos as imagens.",
    });
  
    try {
      const pica = Pica();
      // Inicia um novo jsPDF. A primeira página será adicionada no loop.
      const pdf = new jsPDF();
      pdf.deletePage(1); // Garante que começamos com um documento vazio.
  
      for (const imageFile of imageFiles) {
        const img = new Image();
        img.src = imageFile.previewUrl;
  
        // Usa img.decode() para garantir que a imagem está totalmente carregada e pronta.
        // É uma abordagem mais moderna e confiável que o onload.
        await img.decode();
  
        const offScreenCanvas = document.createElement('canvas');
        
        const A4_WIDTH_P = 210;
        const A4_HEIGHT_P = 297;
        
        const isLandscape = img.width > img.height;
        const pageOrientation = isLandscape ? 'l' : 'p';
        const pageWidth = isLandscape ? A4_HEIGHT_P : A4_WIDTH_P;
        const pageHeight = isLandscape ? A4_WIDTH_P : A4_HEIGHT_P;
        const aspectRatio = img.width / img.height;
        
        const margin = 20;
        let pdfWidth = pageWidth - margin;
        let pdfHeight = pdfWidth / aspectRatio;
  
        if (pdfHeight > pageHeight - margin) {
          pdfHeight = pageHeight - margin;
          pdfWidth = pdfHeight * aspectRatio;
        }
  
        offScreenCanvas.width = img.width;
        offScreenCanvas.height = img.height;
        
        const resizedCanvas = await pica.resize(img, offScreenCanvas);
        const imgData = resizedCanvas.toDataURL('image/jpeg', quality[0] / 100);
        
        // Adiciona uma nova página para cada imagem
        pdf.addPage([pageWidth, pageHeight], pageOrientation);
        
        const x_pos = (pageWidth - pdfWidth) / 2;
        const y_pos = (pageHeight - pdfHeight) / 2;
  
        pdf.addImage(imgData, 'JPEG', x_pos, y_pos, pdfWidth, pdfHeight);
      }
      
      const pdfBlob = pdf.output('blob');
      const pdfSize = pdfBlob.size / 1024 / 1024; // in MB
      
      pdf.save(`documento-convertido-${Date.now()}.pdf`);
  
      toast({
        title: "PDF Gerado com Sucesso!",
        description: `Seu PDF foi baixado. Tamanho final: ${pdfSize.toFixed(2)} MB`,
      });
  
    } catch (error) {
      console.error(error);
      toast({
        title: "Erro ao gerar PDF",
        description: "Ocorreu um problema durante a conversão. Verifique o console para mais detalhes.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const onDragEnd = (result: any) => {
    if (!result.destination) return;
    const items = Array.from(imageFiles);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    setImageFiles(items);
  };
  
  // Como o `react-beautiful-dnd` não é uma dependência, vamos simular o drag and drop com estado.
  // Esta parte é mais complexa e `react-beautiful-dnd` seria ideal.
  // Por agora, vamos focar na funcionalidade principal. O reordenamento manual será um desafio sem a lib.

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8">
      <h1 className="text-4xl font-headline font-extrabold text-primary mb-8">Conversor de Imagem para PDF</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
            <Card
                className="border-2 border-dashed border-muted-foreground/50 hover:border-primary transition-colors h-full"
                onDragOver={handleDragOver}
                onDrop={handleDrop}
            >
            <CardContent className="p-6 h-full flex flex-col items-center justify-center text-center">
              <UploadCloud className="h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-medium text-foreground">
                Arraste e solte as imagens aqui
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                ou
              </p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => fileInputRef.current?.click()}
                disabled={isGenerating}
              >
                Selecione os Arquivos
              </Button>
              <Input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
               <p className="text-xs text-muted-foreground mt-4">Suas imagens são processadas localmente e nunca saem do seu computador.</p>
            </CardContent>
          </Card>
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Configurações e Geração</CardTitle>
            <CardDescription>Ajuste a qualidade para controlar o tamanho final do arquivo.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
             <div className="space-y-3">
                <Label htmlFor="quality" className="flex justify-between">
                    <span>Qualidade de Compressão:</span>
                    <span className="font-bold text-primary">{quality[0]}%</span>
                </Label>
                <Slider
                    id="quality"
                    min={10}
                    max={100}
                    step={10}
                    value={quality}
                    onValueChange={setQuality}
                    disabled={isGenerating}
                />
                <p className="text-xs text-muted-foreground">
                    Menor qualidade resulta em um arquivo menor. 80% é um bom ponto de partida.
                </p>
             </div>
          </CardContent>
          <CardFooter>
            <Button onClick={handleGeneratePdf} disabled={isGenerating || imageFiles.length === 0} className="w-full" size="lg">
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Gerando PDF...
                </>
              ) : (
                <>
                  <FileDown className="mr-2 h-5 w-5" />
                  Gerar e Baixar PDF
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>

       <div className="mt-8">
            <h2 className="text-2xl font-headline font-bold mb-4 flex items-center gap-2">
                <ArrowUpDown className="h-5 w-5" />
                Ordem das Páginas ({imageFiles.length})
            </h2>
            {imageFiles.length > 0 ? (
            <p className="text-muted-foreground mb-4">Arraste as imagens para reordenar as páginas do seu PDF. (Funcionalidade de arrastar em desenvolvimento)</p>
            ) : (
            <p className="text-muted-foreground mb-4">Adicione imagens para começar a montar seu documento.</p>
            )}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {imageFiles.map((image, index) => (
                    <Card key={image.id} className="group relative aspect-[3/4] overflow-hidden">
                        <img src={image.previewUrl} alt={`preview ${index}`} className="h-full w-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            <Button variant="destructive" size="icon" onClick={() => handleRemoveImage(image.id)}>
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                        <div className="absolute top-1 left-1 bg-black/50 text-white rounded-full h-6 w-6 flex items-center justify-center text-sm font-bold">
                            {index + 1}
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    </div>
  );
}

    

    

"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { UploadCloud, FileDown, Loader2, ArrowUpDown, RotateCw, Trash2, ArrowLeft, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import jsPDF from 'jspdf';
import { Progress } from "@/components/ui/progress";


export interface ImageFile {
  id: string;
  file: File;
  previewUrl: string;
  rotation: number;
}

const logoPngDataUri = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGAAAABgCAYAAADimHc4AAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAyZpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuNi1jMTQ4IDc5LjE2NDAzNiwgMjAxOS8wOC8xMy0xNjo0MDoyMiAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIDIxLjAgKE1hY2ludG9zaCkiIHhtcE1NOkluc3RhbmNlSUQ9InhtcC5paWQ6NkVFODgwMTM3OEQyMTFFQUE0MkE4MDUyQ0M4NjJDRjAiIHhtcE1NOkRvY3VtZW50SUQ9InhtcC5kaWQ6NkVFODgwMTQ3OEQyMTFFQUE0MkE4MDUyQ0M4NjJDRjAiPiA8eG1wTU06RGVyaXZlZEZyb20gc3RSZWY6aW5zdGFuY2VJRD0ieG1wLmlpZDo2RUU4ODAxMTc4RDIxMUVBQTQyQTgwNTJDQzg2MkNGMCIgc3RSZWY6ZG9jdW1lbnRJRD0ieG1wLmRpZDo2RUU4ODAxMjc4RDIxMUVBQTQyQTgwNTJDQzg2MkNGMCIvPiA8L3JkZjpEZXNjcmlwdGlvbj4gPC9yZGY6UkRGPiA8L3g6eG1wbWV0YT4gPD94cGFja2V0IGVuZD0iciI/PgAAByRJREFUeNrsnXtsFFUY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";

export default function PdfToolsPage() {
  const [imageFiles, setImageFiles] = React.useState<ImageFile[]>([]);
  const [quality, setQuality] = React.useState([80]);
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const [progressMessage, setProgressMessage] = React.useState("");
  const [fileName, setFileName] = React.useState("");
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
          rotation: 0,
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
          rotation: 0,
        }));
      setImageFiles(prev => [...prev, ...newImageFiles]);
    }
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
    setProgress(0);
    setProgressMessage("Iniciando geração do PDF...");
  
    try {
      const pdf = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'a4'
      });
      
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      // Folha de Rosto
      setProgressMessage("Criando a folha de rosto...");
      const logoWidth = 50;
      const logoHeight = 50;
      const logoX = (pageWidth - logoWidth) / 2;
      const logoY = 40;
      pdf.addImage(logoPngDataUri, 'PNG', logoX, logoY, logoWidth, logoHeight);

      if (fileName.trim()) {
          pdf.setFontSize(22);
          pdf.setFont("helvetica", "bold");
          pdf.text(fileName.trim(), pageWidth / 2, logoY + logoHeight + 20, { align: 'center' });
      }
      
      // Adicionar nova página para a primeira imagem (e as subsequentes)
      pdf.addPage('a4', 'p');
      
      setProgress(5);

      for (let i = 0; i < imageFiles.length; i++) {
        const imageFile = imageFiles[i];
        const progressPercentage = 5 + (((i + 1) / imageFiles.length) * 95);
        
        setProgressMessage(`Processando imagem ${i + 1} de ${imageFiles.length}...`);
        
        const img = new Image();
        img.src = imageFile.previewUrl;
        
        await new Promise<void>(resolve => {
            img.onload = () => resolve();
        });
        
        if (i > 0) {
            pdf.addPage('a4', 'p');
        }
        
        const margin = 10;
        
        let imgWidth = img.width;
        let imgHeight = img.height;

        if (imageFile.rotation === 90 || imageFile.rotation === 270) {
            [imgWidth, imgHeight] = [imgHeight, imgWidth]; // Swap dimensions for rotation
        }

        const aspectRatio = imgWidth / imgHeight;
        
        let pdfWidth = pageWidth - margin * 2;
        let pdfHeight = pdfWidth / aspectRatio;
  
        if (pdfHeight > pageHeight - margin * 2) {
          pdfHeight = pageHeight - margin * 2;
          pdfWidth = pdfHeight * aspectRatio;
        }
  
        setProgressMessage(`Adicionando página ${i + 2} ao PDF...`);
        
        const x_pos = (pageWidth - pdfWidth) / 2;
        const y_pos = (pageHeight - pdfHeight) / 2;
        
        const imgData = imageFile.previewUrl;

        pdf.addImage(imgData, 'JPEG', x_pos, y_pos, pdfWidth, pdfHeight, undefined, 'SLOW', imageFile.rotation);
        setProgress(progressPercentage);
      }
      
      // Remover a página em branco extra que foi adicionada no final se houver imagens
      if (imageFiles.length > 0) {
         // A folha de rosto é a página 1. As imagens começam na página 2.
         // O loop adiciona N páginas para N imagens.
         // A primeira imagem vai para a página 2 (adicionada antes do loop).
         // O loop adiciona uma página *antes* de processar a imagem (para i > 0).
         // Então, temos: Rosto (1), Img1 (2), NovaPágina, Img2 (3), ...
         // Após a última imagem, não há página extra.
         // Vamos remover a página em branco inicial que o jsPDF cria se ela não for usada.
         pdf.deletePage(1); // Remove a página em branco inicial. O rosto vira página 1.
      } else {
         // Se não houver imagens, apenas a folha de rosto é salva.
      }


      setProgressMessage("Finalizando e salvando o PDF...");

      const finalFileName = fileName.trim() ? `${fileName.trim()}.pdf` : `documento-convertido-${Date.now()}.pdf`;

      pdf.save(finalFileName);
  
      toast({
        title: "PDF Gerado com Sucesso!",
        description: `Seu PDF "${finalFileName}" foi baixado.`,
      });
  
    } catch (error: any) {
      console.error(error);
      toast({
        title: "Erro ao gerar PDF",
        description: `Ocorreu um problema: ${error.message}. Verifique o console para mais detalhes.`,
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
      setProgress(0);
      setProgressMessage("");
    }
  };

  const handleRemoveImage = (id: string) => {
      setImageFiles(prev => prev.filter(image => image.id !== id));
  };

  const handleRotateImage = (id: string) => {
      setImageFiles(prev =>
          prev.map(image =>
              image.id === id
                  ? { ...image, rotation: (image.rotation + 90) % 360 }
                  : image
          )
      );
  };
  
  const handleMoveImage = (index: number, direction: 'left' | 'right') => {
    if (direction === 'left' && index > 0) {
      const newImageFiles = [...imageFiles];
      const temp = newImageFiles[index];
      newImageFiles[index] = newImageFiles[index - 1];
      newImageFiles[index - 1] = temp;
      setImageFiles(newImageFiles);
    } else if (direction === 'right' && index < imageFiles.length - 1) {
      const newImageFiles = [...imageFiles];
      const temp = newImageFiles[index];
      newImageFiles[index] = newImageFiles[index + 1];
      newImageFiles[index + 1] = temp;
      setImageFiles(newImageFiles);
    }
  };

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
                <Label htmlFor="filename">Nome do Arquivo (Opcional)</Label>
                <Input
                    id="filename"
                    value={fileName}
                    onChange={(e) => setFileName(e.target.value)}
                    placeholder="Ex: peticao-cliente-xyz"
                    disabled={isGenerating}
                />
             </div>
             <div className="space-y-3">
                <Label htmlFor="quality" className="flex justify-between">
                    <span>Qualidade de Compressão (JPEG):</span>
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
          <CardFooter className="flex-col items-stretch gap-4">
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
            {isGenerating && (
                <div className="w-full space-y-2">
                    <Progress value={progress} className="w-full" />
                    <p className="text-xs text-center text-muted-foreground">{progressMessage}</p>
                </div>
            )}
          </CardFooter>
        </Card>
      </div>

       <div className="mt-8">
            <h2 className="text-2xl font-headline font-bold mb-4 flex items-center gap-2">
                <ArrowUpDown className="h-5 w-5" />
                Ordem das Páginas ({imageFiles.length})
            </h2>
            {imageFiles.length > 0 ? (
                <p className="text-muted-foreground mb-4">Clique nas setas para reordenar as páginas do seu PDF.</p>
            ) : (
                <p className="text-muted-foreground mb-4">Adicione imagens para começar a montar seu documento.</p>
            )}
             <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {imageFiles.map((image, index) => (
                    <Card key={image.id} className="group relative aspect-[3/4] overflow-hidden">
                        <img
                        src={image.previewUrl}
                        alt={`preview ${index}`}
                        className="h-full w-full object-cover transition-transform"
                        style={{ transform: `rotate(${image.rotation}deg)` }}
                        />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-2">
                            <div className="flex gap-2">
                                <Button variant="secondary" size="icon" onClick={() => handleRotateImage(image.id)} title="Rotacionar 90°">
                                    <RotateCw className="h-4 w-4" />
                                </Button>
                                <Button variant="destructive" size="icon" onClick={() => handleRemoveImage(image.id)} title="Remover Imagem">
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                             <div className="flex gap-2 mt-2">
                                <Button variant="secondary" size="icon" onClick={() => handleMoveImage(index, 'left')} disabled={index === 0} title="Mover para Esquerda">
                                    <ArrowLeft className="h-4 w-4" />
                                </Button>
                                <Button variant="secondary" size="icon" onClick={() => handleMoveImage(index, 'right')} disabled={index === imageFiles.length - 1} title="Mover para Direita">
                                    <ArrowRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                        <div className="absolute top-1 left-1 bg-black/70 text-white rounded-full h-6 w-6 flex items-center justify-center text-sm font-bold">
                        {index + 1}
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    </div>
  );
}

    

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

const logoPngDataUri = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAgAAAAIACAYAAAD0eNT6AAAABGdBTUEAALGPC/xhBQAAACBjSFJNAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAAACXBIWXMAAAsTAAALEwEAmpwYAAAAB3RJTUUH6AoMFRgO6zTfJwAAGvtJREFUeJzt3eGLJFd5x/HXtYF5hBAi0aIYsQkL9uIDHhCPAcQjiD0YI0YQxI0xGks0RiPGGBBDDIhHPDGJePAgXkSMMegXg2hB2IhlWUSGGUaYoa11Vb176np6pqune/p7pvs+VfXqM8z0dFUPvfd83/c5nDoVCAAAALgTbm5uAAAA0PABAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIIBAgAAgIiYCAAAAMgAAA/gL7kUCAAAAABJRU5ErkJggg==";

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
        
        if (i > 0 || imageFiles.length > 0) {
            pdf.addPage('a4', 'p');
        } else if (i === 0 && imageFiles.length > 1) {
            // This is the first image of multiple, so add a page for it
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

    

    

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

const logoSvgString = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
<path d="M390.6,512H121.4C54.5,512,0,457.5,0,390.6V238.9c0-59.9,38.3-113.4,94-131.7C107.7,48.5,162.3,0,226.7,0h58.6c64.4,0,119,48.5,132.7,107.2c55.7,18.3,94,71.8,94,131.7v151.7C512,457.5,457.5,512,390.6,512z" style="fill: #B98C60;"></path>
<path d="M336,176c0,8.8-7.2,16-16,16H192c-8.8,0-16-7.2-16-16V96c0-8.8,7.2-16,16-16h128c8.8,0,16,7.2,16,16V176z" style="fill: #B98C60;"></path>
<path d="M344,456H168c-44.2,0-80-35.8-80-80V200c0-44.2,35.8-80,80-80h176c44.2,0,80,35.8,80,80v176C424,420.2,388.2,456,344,456z" style="fill: #D3D3D3;"></path>
<path d="M352,464H160c-48.5,0-88-39.5-88-88V200c0-48.5,39.5-88,88-88h192c48.5,0,88,39.5,88,88v176C440,424.5,400.5,464,352,464z M160,136c-35.3,0-64,28.7-64,64v176c0,35.3,28.7,64,64,64h192c35.3,0,64-28.7,64-64V200c0-35.3-28.7-64-64-64H160z" style="fill: #231F20;"></path>
<path d="M256,312c-23.6,0-44.3-14.5-52.1-35.4c-3.1-8.4,2.4-17.4,10.8-20.5c8.4-3.1,17.4,2.4,20.5,10.8c2.6,7.1,9.4,12.1,17.2,12.1c7.8,0,14.6-5,17.2-12.1c3.1-8.4,12.1-13.9,20.5-10.8c8.4,3.1,13.9,12.1,10.8,20.5C300.3,297.5,279.6,312,256,312z" style="fill: #231F20;"></path>
<path d="M328,424H184c-13.3,0-24-10.7-24-24v-48c0-4.4,3.6-8,8-8h176c4.4,0,8,3.6,8,8v48C352,413.3,341.3,424,328,424z" style="fill: #4D4D4D;"></path>
<circle cx="152" cy="120" r="32" style="fill: #231F20;"></circle>
<circle cx="360" cy="120" r="32" style="fill: #231F20;"></circle>
<path d="M168,80l-32-48c-4.3-6.4,0-15,6.8-15h42.3c3.5,0,6.7,2.2,7.9,5.5l9.9,27.1L168,80z" style="fill: #4D4D4D;"></path>
<path d="M344,80l32-48c4.3-6.4,0-15-6.8-15h-42.3c-3.5,0-6.7,2.2-7.9,5.5l-9.9,27.1L344,80z" style="fill: #4D4D4D;"></path>
</svg>`;

const svgDataUri = `data:image/svg+xml;base64,${btoa(logoSvgString)}`;


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
      pdf.addImage(svgDataUri, 'SVG', logoX, logoY, logoWidth, logoHeight);

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
        
        await new Promise(resolve => img.onload = resolve);
        
        pdf.addPage('a4', 'p');
        
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

    
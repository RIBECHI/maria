
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
import { Checkbox } from "@/components/ui/checkbox";


export interface ImageFile {
  id: string;
  file: File;
  previewUrl: string;
  rotation: number;
}

export default function PdfToolsPage() {
  const [imageFiles, setImageFiles] = React.useState<ImageFile[]>([]);
  const [quality, setQuality] = React.useState([80]);
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const [progressMessage, setProgressMessage] = React.useState("");
  const [fileName, setFileName] = React.useState("");
  const [includeLetterhead, setIncludeLetterhead] = React.useState(true);
  const [hasTemplate, setHasTemplate] = React.useState(false);

  const { toast } = useToast();
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    // Verifica no cliente se existe algum template salvo no localStorage
    const header = localStorage.getItem('pdfHeaderTemplate');
    const footer = localStorage.getItem('pdfFooterTemplate');
    setHasTemplate(!!header || !!footer);
  }, []);

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
        format: 'a4',
        compress: true,
      });
      
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      
      const headerTemplate = includeLetterhead ? localStorage.getItem('pdfHeaderTemplate') : null;
      const footerTemplate = includeLetterhead ? localStorage.getItem('pdfFooterTemplate') : null;
      
      let headerImageHeight = 0;
      let footerImageHeight = 0;
      
      if (headerTemplate) {
        setProgressMessage("Carregando modelo de cabeçalho...");
        const img = new Image();
        img.src = headerTemplate;
        await new Promise<void>((resolve, reject) => {
            img.onload = () => resolve();
            img.onerror = () => reject(new Error("Falha ao carregar imagem do cabeçalho."));
        });
        const aspectRatio = img.width / img.height;
        headerImageHeight = pageWidth / aspectRatio;
      }

      if (footerTemplate) {
        setProgressMessage("Carregando modelo de rodapé...");
        const img = new Image();
        img.src = footerTemplate;
        await new Promise<void>((resolve, reject) => {
            img.onload = () => resolve();
            img.onerror = () => reject(new Error("Falha ao carregar imagem do rodapé."));
        });
        const aspectRatio = img.width / img.height;
        footerImageHeight = pageWidth / aspectRatio;
      }
      
      const imageMargin = 10;

      for (let i = 0; i < imageFiles.length; i++) {
        const imageFile = imageFiles[i];
        const progressPercentage = ((i + 1) / imageFiles.length) * 100;
        
        setProgressMessage(`Processando imagem ${i + 1} de ${imageFiles.length}...`);

        if (i > 0) {
            pdf.addPage('a4', 'p');
        }
        
        if (headerTemplate && headerImageHeight > 0) {
            pdf.addImage(headerTemplate, 'PNG', 0, 0, pageWidth, headerImageHeight);
        }
        
        const originalImg = new Image();
        originalImg.src = imageFile.previewUrl;
        await new Promise<void>(resolve => { originalImg.onload = () => resolve(); });

        let finalImageData = imageFile.previewUrl;
        let finalImgWidth = originalImg.width;
        let finalImgHeight = originalImg.height;

        // If rotation is needed, use a canvas to pre-rotate the image
        if (imageFile.rotation > 0) {
            setProgressMessage(`Rotacionando imagem ${i + 1}...`);
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) throw new Error('Falha ao criar canvas para rotação.');

            // Swap dimensions for 90/270 degree rotations
            if (imageFile.rotation === 90 || imageFile.rotation === 270) {
                canvas.width = originalImg.height;
                canvas.height = originalImg.width;
            } else { // 180 degrees
                canvas.width = originalImg.width;
                canvas.height = originalImg.height;
            }

            // Translate to center, rotate, and draw the image back on the un-rotated context
            ctx.translate(canvas.width / 2, canvas.height / 2);
            ctx.rotate(imageFile.rotation * Math.PI / 180);
            ctx.drawImage(originalImg, -originalImg.width / 2, -originalImg.height / 2);

            finalImageData = canvas.toDataURL('image/jpeg', quality[0] / 100);
            finalImgWidth = canvas.width;
            finalImgHeight = canvas.height;
        }

        const aspectRatio = finalImgWidth / finalImgHeight;
        
        const availableHeight = pageHeight - headerImageHeight - footerImageHeight - (imageMargin * 2);
        const availableWidth = pageWidth - imageMargin * 2;

        let pdfWidth = availableWidth;
        let pdfHeight = pdfWidth / aspectRatio;
  
        if (pdfHeight > availableHeight) {
          pdfHeight = availableHeight;
          pdfWidth = pdfHeight * aspectRatio;
        }
  
        setProgressMessage(`Adicionando página ${i + 1} ao PDF...`);
        
        const x_pos = (pageWidth - pdfWidth) / 2;
        const y_pos = headerImageHeight + imageMargin;
        
        // The image data is now pre-rotated, so we pass 0 for rotation to jsPDF
        pdf.addImage(finalImageData, 'JPEG', x_pos, y_pos, pdfWidth, pdfHeight, undefined, 'SLOW');

        if (footerTemplate && footerImageHeight > 0) {
            const footerY = pageHeight - footerImageHeight;
            pdf.addImage(footerTemplate, 'PNG', 0, footerY, pageWidth, footerImageHeight);
        }

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
            <CardDescription>Ajuste as opções do seu documento final.</CardDescription>
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

             <div className="flex items-center space-x-2 pt-4 border-t">
                <Checkbox
                    id="include-letterhead"
                    checked={includeLetterhead}
                    onCheckedChange={(checked) => setIncludeLetterhead(!!checked)}
                    disabled={isGenerating || !hasTemplate}
                />
                <Label
                    htmlFor="include-letterhead"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                    Incluir cabeçalho e rodapé (papel timbrado)
                </Label>
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


"use client";

import * as React from "react";
import pica from 'pica';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { UploadCloud, Image as ImageIcon, Trash2, Save, Loader2 } from "lucide-react";

const MAX_WIDTH = 2480; // A4 width in pixels at 300 DPI
const MAX_HEIGHT = 3508; // A4 height in pixels at 300 DPI

export default function PdfTemplatePage() {
  const [headerImage, setHeaderImage] = React.useState<string | null>(null);
  const [isProcessing, setIsProcessing] = React.useState(false);
  const { toast } = useToast();
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    const savedTemplate = localStorage.getItem("pdfHeaderTemplate");
    if (savedTemplate) {
      setHeaderImage(savedTemplate);
    }
  }, []);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setIsProcessing(true);
      toast({ title: "Processando imagem...", description: "Otimizando e redimensionando sua imagem para o modelo." });
      try {
        const resizedDataUrl = await resizeImage(file);
        setHeaderImage(resizedDataUrl);
        toast({ title: "Imagem carregada", description: "Pré-visualização atualizada. Clique em salvar para confirmar." });
      } catch (error) {
        console.error("Error resizing image:", error);
        toast({ title: "Erro ao processar imagem", description: "Não foi possível carregar o arquivo.", variant: "destructive" });
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const resizeImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const picaInstance = pica();
        const img = new Image();
        img.src = URL.createObjectURL(file);
        img.onload = () => {
            const aspectRatio = img.width / img.height;
            let targetWidth = MAX_WIDTH;
            let targetHeight = targetWidth / aspectRatio;

            if (targetHeight > MAX_HEIGHT) {
                targetHeight = MAX_HEIGHT;
                targetWidth = targetHeight * aspectRatio;
            }

            const canvas = document.createElement('canvas');
            canvas.width = targetWidth;
            canvas.height = targetHeight;

            picaInstance.resize(img, canvas, {
                unsharpAmount: 80,
                unsharpRadius: 0.6,
                unsharpThreshold: 2,
            })
            .then(result => picaInstance.toBlob(result, 'image/png', 0.9))
            .then(blob => {
                const reader = new FileReader();
                reader.onloadend = () => {
                    resolve(reader.result as string);
                };
                reader.onerror = reject;
                reader.readAsDataURL(blob);
            })
            .catch(reject);
        };
        img.onerror = reject;
    });
  };

  const handleSaveTemplate = () => {
    if (headerImage) {
      localStorage.setItem("pdfHeaderTemplate", headerImage);
      toast({ title: "Modelo Salvo!", description: "Seu novo cabeçalho será usado nos próximos PDFs gerados." });
    } else {
      toast({ title: "Nenhuma imagem", description: "Carregue uma imagem antes de salvar.", variant: "destructive" });
    }
  };

  const handleRemoveTemplate = () => {
    localStorage.removeItem("pdfHeaderTemplate");
    setHeaderImage(null);
    if (fileInputRef.current) {
        fileInputRef.current.value = "";
    }
    toast({ title: "Modelo Removido", description: "O cabeçalho padrão foi removido." });
  };


  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8">
      <h1 className="text-4xl font-headline font-extrabold text-primary mb-2">Modelo de Cabeçalho do PDF</h1>
      <p className="text-muted-foreground mb-8">
        Faça o upload de uma imagem (como um papel timbrado) para ser usada como cabeçalho em todas as páginas dos PDFs gerados.
      </p>
      
      <Card className="max-w-4xl mx-auto shadow-lg">
        <CardHeader>
          <CardTitle>Configurar Papel Timbrado</CardTitle>
          <CardDescription>A imagem será redimensionada para a largura de uma página A4, mantendo a proporção.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
            <div>
                 <Label htmlFor="header-upload">Carregar nova imagem</Label>
                 <Input
                    id="header-upload"
                    ref={fileInputRef}
                    type="file"
                    accept="image/png, image/jpeg"
                    onChange={handleFileChange}
                    disabled={isProcessing}
                    className="mt-2"
                />
            </div>

            {isProcessing && (
                 <div className="flex items-center justify-center p-8 text-muted-foreground">
                    <Loader2 className="h-6 w-6 animate-spin mr-2" />
                    <span>Otimizando imagem...</span>
                 </div>
            )}
           
            {headerImage && !isProcessing && (
            <div>
              <Label>Pré-visualização do Cabeçalho</Label>
              <div className="mt-2 border rounded-md p-4 bg-muted/20 relative">
                <img src={headerImage} alt="Preview do cabeçalho" className="w-full h-auto rounded-md border" />
              </div>
            </div>
            )}

             {!headerImage && !isProcessing && (
                <div className="flex flex-col items-center justify-center text-center text-muted-foreground border-2 border-dashed rounded-md p-12">
                    <ImageIcon className="h-12 w-12" />
                    <p className="mt-2">Nenhum modelo de cabeçalho definido.</p>
                    <p className="text-sm">Faça o upload de uma imagem para começar.</p>
                </div>
            )}
        </CardContent>
        <CardFooter className="flex justify-end gap-2">
            <Button variant="ghost" onClick={handleRemoveTemplate} disabled={!headerImage}>
                <Trash2 className="mr-2 h-4 w-4" />
                Remover Modelo
            </Button>
            <Button onClick={handleSaveTemplate} disabled={!headerImage || isProcessing}>
                <Save className="mr-2 h-4 w-4" />
                Salvar Modelo Permanente
            </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

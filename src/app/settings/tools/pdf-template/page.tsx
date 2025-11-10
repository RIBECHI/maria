
"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { UploadCloud, Image as ImageIcon, Trash2, Save, Loader2 } from "lucide-react";

export default function PdfTemplatePage() {
  const [headerImage, setHeaderImage] = React.useState<string | null>(null);
  const [footerImage, setFooterImage] = React.useState<string | null>(null);
  const [isProcessingHeader, setIsProcessingHeader] = React.useState(false);
  const [isProcessingFooter, setIsProcessingFooter] = React.useState(false);
  const { toast } = useToast();
  const headerFileInputRef = React.useRef<HTMLInputElement>(null);
  const footerFileInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    const savedHeader = localStorage.getItem("pdfHeaderTemplate");
    if (savedHeader) {
      setHeaderImage(savedHeader);
    }
    const savedFooter = localStorage.getItem("pdfFooterTemplate");
    if (savedFooter) {
      setFooterImage(savedFooter);
    }
  }, []);

  const handleFileChange = (
    event: React.ChangeEvent<HTMLInputElement>,
    type: 'header' | 'footer'
  ) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const setIsProcessing = type === 'header' ? setIsProcessingHeader : setIsProcessingFooter;
      const setImage = type === 'header' ? setHeaderImage : setFooterImage;
      
      setIsProcessing(true);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
        setIsProcessing(false);
        toast({ title: `Imagem de ${type === 'header' ? 'cabeçalho' : 'rodapé'} carregada`, description: "Pré-visualização atualizada. Clique em salvar para confirmar." });
      };
      reader.onerror = () => {
        setIsProcessing(false);
        toast({ title: "Erro ao carregar imagem", description: "Não foi possível ler o arquivo.", variant: "destructive" });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveTemplate = (type: 'header' | 'footer') => {
    const image = type === 'header' ? headerImage : footerImage;
    const storageKey = type === 'header' ? "pdfHeaderTemplate" : "pdfFooterTemplate";
    if (image) {
      localStorage.setItem(storageKey, image);
      toast({ title: `Modelo de ${type === 'header' ? 'cabeçalho' : 'rodapé'} salvo!`, description: `Seu novo ${type === 'header' ? 'cabeçalho' : 'rodapé'} será usado nos próximos PDFs gerados.` });
    } else {
      toast({ title: "Nenhuma imagem", description: `Carregue uma imagem de ${type === 'header' ? 'cabeçalho' : 'rodapé'} antes de salvar.`, variant: "destructive" });
    }
  };

  const handleRemoveTemplate = (type: 'header' | 'footer') => {
    const storageKey = type === 'header' ? "pdfHeaderTemplate" : "pdfFooterTemplate";
    const setImage = type === 'header' ? setHeaderImage : setFooterImage;
    const fileInputRef = type === 'header' ? headerFileInputRef : footerFileInputRef;

    localStorage.removeItem(storageKey);
    setImage(null);
    if (fileInputRef.current) {
        fileInputRef.current.value = "";
    }
    toast({ title: `Modelo de ${type === 'header' ? 'cabeçalho' : 'rodapé'} removido`, description: `O ${type === 'header' ? 'cabeçalho' : 'rodapé'} padrão foi removido.` });
  };


  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8">
      <h1 className="text-4xl font-headline font-extrabold text-primary mb-2">Modelo de Cabeçalho e Rodapé do PDF</h1>
      <p className="text-muted-foreground mb-8">
        Faça o upload de imagens (como um papel timbrado) para serem usadas como cabeçalho e rodapé em todas as páginas dos PDFs gerados.
      </p>
      
      <div className="grid gap-8">
        {/* Card do Cabeçalho */}
        <Card className="max-w-4xl mx-auto shadow-lg w-full">
            <CardHeader>
            <CardTitle>Configurar Papel Timbrado (Cabeçalho)</CardTitle>
            <CardDescription>A imagem será redimensionada para a largura de uma página A4, mantendo a proporção.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div>
                    <Label htmlFor="header-upload">Carregar imagem do cabeçalho</Label>
                    <Input
                        id="header-upload"
                        ref={headerFileInputRef}
                        type="file"
                        accept="image/png, image/jpeg"
                        onChange={(e) => handleFileChange(e, 'header')}
                        disabled={isProcessingHeader}
                        className="mt-2"
                    />
                </div>

                {isProcessingHeader && (
                    <div className="flex items-center justify-center p-8 text-muted-foreground">
                        <Loader2 className="h-6 w-6 animate-spin mr-2" />
                        <span>Carregando imagem...</span>
                    </div>
                )}
            
                {headerImage && !isProcessingHeader && (
                <div>
                <Label>Pré-visualização do Cabeçalho</Label>
                <div className="mt-2 border rounded-md p-4 bg-muted/20 relative">
                    <img src={headerImage} alt="Preview do cabeçalho" className="w-full h-auto rounded-md border" />
                </div>
                </div>
                )}

                {!headerImage && !isProcessingHeader && (
                    <div className="flex flex-col items-center justify-center text-center text-muted-foreground border-2 border-dashed rounded-md p-12">
                        <ImageIcon className="h-12 w-12" />
                        <p className="mt-2">Nenhum modelo de cabeçalho definido.</p>
                        <p className="text-sm">Faça o upload de uma imagem para começar.</p>
                    </div>
                )}
            </CardContent>
            <CardFooter className="flex justify-end gap-2">
                <Button variant="ghost" onClick={() => handleRemoveTemplate('header')} disabled={!headerImage}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Remover Modelo
                </Button>
                <Button onClick={() => handleSaveTemplate('header')} disabled={!headerImage || isProcessingHeader}>
                    <Save className="mr-2 h-4 w-4" />
                    Salvar Modelo de Cabeçalho
                </Button>
            </CardFooter>
        </Card>

        {/* Card do Rodapé */}
        <Card className="max-w-4xl mx-auto shadow-lg w-full">
            <CardHeader>
            <CardTitle>Configurar Rodapé</CardTitle>
            <CardDescription>A imagem será posicionada na parte inferior da página, redimensionada para a largura A4.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div>
                    <Label htmlFor="footer-upload">Carregar imagem do rodapé</Label>
                    <Input
                        id="footer-upload"
                        ref={footerFileInputRef}
                        type="file"
                        accept="image/png, image/jpeg"
                        onChange={(e) => handleFileChange(e, 'footer')}
                        disabled={isProcessingFooter}
                        className="mt-2"
                    />
                </div>

                {isProcessingFooter && (
                    <div className="flex items-center justify-center p-8 text-muted-foreground">
                        <Loader2 className="h-6 w-6 animate-spin mr-2" />
                        <span>Carregando imagem...</span>
                    </div>
                )}
            
                {footerImage && !isProcessingFooter && (
                <div>
                <Label>Pré-visualização do Rodapé</Label>
                <div className="mt-2 border rounded-md p-4 bg-muted/20 relative">
                    <img src={footerImage} alt="Preview do rodapé" className="w-full h-auto rounded-md border" />
                </div>
                </div>
                )}

                {!footerImage && !isProcessingFooter && (
                    <div className="flex flex-col items-center justify-center text-center text-muted-foreground border-2 border-dashed rounded-md p-12">
                        <ImageIcon className="h-12 w-12" />
                        <p className="mt-2">Nenhum modelo de rodapé definido.</p>
                        <p className="text-sm">Faça o upload de uma imagem para começar.</p>
                    </div>
                )}
            </CardContent>
            <CardFooter className="flex justify-end gap-2">
                <Button variant="ghost" onClick={() => handleRemoveTemplate('footer')} disabled={!footerImage}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Remover Modelo
                </Button>
                <Button onClick={() => handleSaveTemplate('footer')} disabled={!footerImage || isProcessingFooter}>
                    <Save className="mr-2 h-4 w-4" />
                    Salvar Modelo de Rodapé
                </Button>
            </CardFooter>
        </Card>
      </div>
    </div>
  );
}

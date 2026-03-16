
"use client";

import * as React from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, Wand2, XCircle } from "lucide-react";
import { handleDocumentAnalysis } from "./actions";
import { DocumentAnalyzerInputSchema, type DocumentAnalyzerInput, type DocumentAnalyzerOutput } from "@/ai/flows/document-analyzer";

type FormValues = z.infer<typeof DocumentAnalyzerInputSchema>;

export default function DocumentAnalyzerPage() {
  const [isLoading, setIsLoading] = React.useState(false);
  const [analysisResult, setAnalysisResult] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(DocumentAnalyzerInputSchema),
    defaultValues: {
      documentText: "",
      analysisType: "summary",
    },
  });

  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    setIsLoading(true);
    setAnalysisResult(null);
    setError(null);
    try {
      const result = await handleDocumentAnalysis(data);
      setAnalysisResult(result.analysisResult);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ocorreu um erro ao processar a análise.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8">
      <h1 className="text-4xl font-headline font-extrabold text-primary mb-8">Analisador de Documentos (IA)</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <Card className="lg:col-span-2 shadow-lg">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <CardHeader>
                <CardTitle>Analisar Documento</CardTitle>
                <CardDescription>
                  Cole o texto de um documento e escolha o tipo de análise que a IA deve realizar.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <FormField
                  control={form.control}
                  name="documentText"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Texto do Documento</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Cole o conteúdo completo do seu documento aqui..."
                          className="resize-y min-h-[300px] font-mono text-sm"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="analysisType"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel>Tipo de Análise</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="flex flex-col md:flex-row gap-4"
                        >
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="summary" />
                            </FormControl>
                            <FormLabel className="font-normal">Resumir Texto</FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="entities" />
                            </FormControl>
                            <FormLabel className="font-normal">Extrair Entidades</FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="nextSteps" />
                            </FormControl>
                            <FormLabel className="font-normal">Sugerir Próximos Passos</FormLabel>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
              <CardFooter>
                <Button type="submit" disabled={isLoading} className="w-full md:w-auto">
                  {isLoading ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Analisando...</>
                  ) : (
                    <><Wand2 className="mr-2 h-4 w-4" /> Analisar com IA</>
                  )}
                </Button>
              </CardFooter>
            </form>
          </Form>
        </Card>

        <Card className="lg:col-span-1 shadow-lg sticky top-8">
            <CardHeader>
                <CardTitle>Resultado da Análise</CardTitle>
            </CardHeader>
            <CardContent className="min-h-[400px] max-h-[60vh] overflow-y-auto">
                {isLoading && (
                    <div className="flex items-center justify-center h-full">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                )}
                {error && (
                    <Alert variant="destructive">
                    <XCircle className="h-4 w-4" />
                    <AlertTitle>Erro na Análise</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}
                {analysisResult && (
                    <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">
                        {analysisResult}
                    </div>
                )}
                {!isLoading && !error && !analysisResult && (
                    <p className="text-center text-muted-foreground h-full flex items-center justify-center">O resultado da análise aparecerá aqui.</p>
                )}
            </CardContent>
        </Card>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import { type LegalReminderInput, type LegalReminderOutput } from "@/ai/flows/legal-reminder";
import { handleLegalReminder } from "./actions";

const FormSchema = z.object({
  caseDescription: z.string().min(10, { message: "A descrição do caso deve ter pelo menos 10 caracteres." }),
  legalUpdates: z.string().min(10, { message: "As atualizações legais devem ter pelo menos 10 caracteres." }),
});

type FormValues = z.infer<typeof FormSchema>;

export default function LegalReminderPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState<LegalReminderOutput | null>(null);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      caseDescription: "",
      legalUpdates: "",
    },
  });

  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    setIsLoading(true);
    setAiResponse(null);
    setError(null);
    try {
      const result = await handleLegalReminder(data as LegalReminderInput);
      setAiResponse(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ocorreu um erro ao processar a solicitação.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8">
      <h1 className="text-3xl font-headline font-bold text-primary mb-8">Lembrete Legal (IA)</h1>
      
      <Card className="shadow-lg max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="text-xl font-headline">Analisar Relevância Legal</CardTitle>
          <CardDescription>
            Insira a descrição de um caso e as novas atualizações legais para que a IA verifique a relevância.
          </CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="caseDescription"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição do Caso</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Descreva os detalhes principais do caso jurídico..."
                        className="resize-y min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="legalUpdates"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Novas Atualizações Legais</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Insira as novas leis, regulamentos ou precedentes judiciais..."
                        className="resize-y min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analisando...
                  </>
                ) : (
                  "Analisar com IA"
                )}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>

      {error && (
        <Alert variant="destructive" className="mt-6 max-w-2xl mx-auto">
          <XCircle className="h-4 w-4" />
          <AlertTitle>Erro</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {aiResponse && (
        <Card className="mt-8 shadow-lg max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="text-xl font-headline flex items-center">
              {aiResponse.isRelevant ? (
                <CheckCircle className="h-6 w-6 mr-2 text-green-600" />
              ) : (
                <XCircle className="h-6 w-6 mr-2 text-red-600" />
              )}
              Resultado da Análise da IA
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`font-semibold text-lg ${aiResponse.isRelevant ? 'text-green-700' : 'text-red-700'}`}>
              {aiResponse.isRelevant ? "Relevante para o caso." : "Não parece ser relevante para o caso."}
            </p>
            <p className="mt-2 text-muted-foreground font-headline">Justificativa:</p>
            <p className="mt-1">{aiResponse.reasoning}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}


"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    // Atualiza o estado para que a próxima renderização mostre a UI de fallback.
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Você também pode registrar o erro em um serviço de relatórios de erro
    console.error("========================");
    console.error("Uncaught error:", error, errorInfo);
    console.error("========================");
  }

  public render() {
    if (this.state.hasError) {
      // Você pode renderizar qualquer UI de fallback personalizada
      return (
        <div className="flex items-center justify-center min-h-screen bg-background">
          <Card className="w-full max-w-lg text-center shadow-2xl">
            <CardHeader>
              <div className="mx-auto bg-destructive/10 p-3 rounded-full w-fit">
                <AlertTriangle className="h-8 w-8 text-destructive" />
              </div>
              <CardTitle className="mt-4 text-2xl">Ocorreu um Erro na Aplicação</CardTitle>
              <CardDescription>
                A aplicação encontrou um problema e não pôde continuar.
                Verifique o console do navegador para detalhes técnicos.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => window.location.reload()}>
                Recarregar a Página
              </Button>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}


"use client";

import React, { useEffect, useState } from 'react';
import { errorEmitter, FirestorePermissionError } from '@/firebase';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '../ui/scroll-area';

export default function FirebaseErrorListener() {
  const [error, setError] = useState<FirestorePermissionError | null>(null);

  useEffect(() => {
    const handleError = (e: FirestorePermissionError) => {
      console.log("FirestorePermissionError caught by listener:", e);
      setError(e);
    };

    errorEmitter.on('permission-error', handleError);

    return () => {
      errorEmitter.off('permission-error', handleError);
    };
  }, []);

  const handleClose = () => {
    setError(null);
  };
  
  const getOperationDescription = (operation: string) => {
    switch(operation) {
        case 'list': return "Listar documentos (getDocs)";
        case 'get': return "Ler um documento (getDoc)";
        case 'create': return "Criar um documento (addDoc/setDoc)";
        case 'update': return "Atualizar um documento (updateDoc)";
        case 'delete': return "Deletar um documento (deleteDoc)";
        default: return operation;
    }
  }

  return (
    <AlertDialog open={!!error} onOpenChange={(open) => !open && handleClose()}>
      <AlertDialogContent className="sm:max-w-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-destructive">Erro de Permissão do Firestore</AlertDialogTitle>
          <AlertDialogDescription>
            A solicitação para o banco de dados foi bloqueada pelas suas Regras de Segurança. Use o contexto abaixo para depurar e corrigir o arquivo `firestore.rules`.
          </AlertDialogDescription>
        </AlertDialogHeader>
        {error && (
          <div className="my-4 text-sm space-y-4">
             <div>
                <h4 className="font-semibold mb-2">Resumo</h4>
                <p>
                    A operação <Badge variant="destructive">{getOperationDescription(error.request.method)}</Badge> na coleção <code className="bg-muted px-1.5 py-0.5 rounded-sm text-sm">{error.request.path}</code> foi negada.
                </p>
             </div>
             
             <div>
                <h4 className="font-semibold mb-2">Contexto da Requisição</h4>
                <div className="bg-muted/60 p-3 rounded-md text-xs space-y-2">
                    <p><strong>Autenticação do Usuário (request.auth):</strong></p>
                     <pre className="p-2 bg-background rounded-md text-xs overflow-auto">
                        <code>{JSON.stringify(error.request.auth, null, 2) || 'null'}</code>
                    </pre>

                    {error.request.resource && (
                        <>
                           <p className="pt-2"><strong>Dados Enviados (request.resource.data):</strong></p>
                            <ScrollArea className="max-h-40">
                                <pre className="p-2 bg-background rounded-md text-xs overflow-auto">
                                    <code>{JSON.stringify(error.request.resource.data, null, 2)}</code>
                                </pre>
                            </ScrollArea>
                        </>
                    )}
                </div>
             </div>

             <div>
                <h4 className="font-semibold mb-2">Próximos Passos</h4>
                <p>
                    Use as informações acima para ajustar seu arquivo <code className="bg-muted px-1.5 py-0.5 rounded-sm text-sm">firestore.rules</code> para permitir esta solicitação.
                </p>
             </div>
          </div>
        )}
        <AlertDialogFooter>
          <AlertDialogAction onClick={handleClose}>Entendido</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

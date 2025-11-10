
import { NextResponse } from 'next/server';
import { getProcesses } from '@/services/processService';
import { getClients } from '@/services/clientService';

// Função para buscar todos os dados de um processo e seus clientes
async function getAutomationData(processNumber: string) {
  if (!processNumber) {
    throw new Error("O número do processo é obrigatório.");
  }

  const [allProcesses, allClients] = await Promise.all([
    getProcesses(),
    getClients()
  ]);

  const targetProcess = allProcesses.find(p => p.processNumber === processNumber);

  if (!targetProcess) {
    return null;
  }

  const processClients = allClients.filter(client =>
    targetProcess.clients.includes(client.name)
  );

  return {
    process: targetProcess,
    clients: processClients,
  };
}

export async function GET(request: Request) {
  // 1. Segurança: Validação da Chave de API
  const apiKey = request.headers.get('x-api-key');
  if (!apiKey || apiKey !== process.env.AUTOMATION_API_KEY) {
    return NextResponse.json({ error: 'Acesso não autorizado.' }, { status: 401 });
  }

  // 2. Extração do Parâmetro
  const { searchParams } = new URL(request.url);
  const processNumber = searchParams.get('processNumber');

  if (!processNumber) {
    return NextResponse.json({ error: 'Parâmetro "processNumber" é obrigatório.' }, { status: 400 });
  }

  // 3. Busca e Retorno dos Dados
  try {
    const data = await getAutomationData(processNumber);
    if (!data) {
      return NextResponse.json({ error: 'Processo não encontrado.' }, { status: 404 });
    }
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error("Erro na API de automação:", error);
    const errorMessage = error instanceof Error ? error.message : "Um erro desconhecido ocorreu.";
    return NextResponse.json({ error: "Erro interno do servidor.", details: errorMessage }, { status: 500 });
  }
}

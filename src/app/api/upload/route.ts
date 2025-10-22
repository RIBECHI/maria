
import { NextResponse } from 'next/server';
import { adminStorage } from '@/lib/firebase-admin';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'Nenhum arquivo enviado.' }, { status: 400 });
    }

    const bucket = adminStorage.bucket();
    const filePath = `documents/${Date.now()}-${file.name}`;
    
    const fileBuffer = Buffer.from(await file.arrayBuffer());

    // Abordagem mais robusta usando bucket.file().save()
    // Isso substitui o createWriteStream que estava causando problemas.
    await bucket.file(filePath).save(fileBuffer, {
      metadata: {
        contentType: file.type,
      },
    });

    // O arquivo agora está no Storage. Retornamos o caminho para ser salvo no Firestore.
    return NextResponse.json({ filePath: filePath }, { status: 200 });

  } catch (error: any) {
    console.error('Erro no upload do arquivo (API Route):', error);
    // Retorna um erro JSON explícito em vez de deixar o Next.js retornar HTML
    return NextResponse.json(
        { error: 'Erro interno do servidor ao fazer upload.', message: error.message }, 
        { status: 500 }
    );
  }
}

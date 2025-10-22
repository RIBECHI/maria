
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

    const blob = bucket.file(filePath);
    const blobStream = blob.createWriteStream({
        metadata: {
            contentType: file.type,
        },
        resumable: false,
    });

    await new Promise((resolve, reject) => {
        blobStream.on('error', (err) => {
            console.error('Erro no stream de upload:', err);
            reject(new Error('Falha ao fazer upload do arquivo.'));
        });

        blobStream.on('finish', () => {
            resolve(true);
        });

        blobStream.end(fileBuffer);
    });

    // O arquivo agora está no Storage. Retornamos o caminho para ser salvo no Firestore.
    return NextResponse.json({ filePath: filePath }, { status: 200 });

  } catch (error: any) {
    console.error('Erro no upload do arquivo (API Route):', error);
    return NextResponse.json({ error: 'Erro interno do servidor ao fazer upload.', message: error.message }, { status: 500 });
  }
}

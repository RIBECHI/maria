
import { NextResponse } from 'next/server';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'Nenhum arquivo enviado.' }, { status: 400 });
    }

    const filePath = `documents/${Date.now()}-${file.name}`;
    const storageRef = ref(storage, filePath);

    const fileBuffer = await file.arrayBuffer();
    await uploadBytes(storageRef, fileBuffer, { contentType: file.type });
    
    // Não vamos mais usar getDownloadURL para evitar problemas de CORS no cliente
    // Apenas retornamos o caminho do arquivo (filePath)
    
    return NextResponse.json({ filePath: filePath }, { status: 200 });

  } catch (error: any) {
    console.error('Erro no upload do arquivo:', error);
    return NextResponse.json({ error: 'Erro interno do servidor ao fazer upload.', message: error.message }, { status: 500 });
  }
}

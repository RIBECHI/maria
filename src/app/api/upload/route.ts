
import { NextResponse } from 'next/server';
import admin from 'firebase-admin';
import { getApps } from 'firebase-admin/app';

// Função para garantir que o Firebase Admin seja inicializado
function initializeAdminApp() {
  if (getApps().length === 0) {
    try {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        }),
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      });
      console.log("Firebase Admin SDK inicializado com sucesso.");
    } catch (error: any) {
      console.error("Erro ao inicializar Firebase Admin SDK:", error.message);
      throw new Error("Falha na configuração do servidor Firebase. Verifique as variáveis de ambiente.");
    }
  }
  return admin;
}


export async function POST(request: Request) {
  try {
    // Garante a inicialização antes de qualquer operação
    const adminApp = initializeAdminApp();
    const bucket = adminApp.storage().bucket();

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'Nenhum arquivo enviado.' }, { status: 400 });
    }
    
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const filePath = `documents/${Date.now()}-${file.name}`;
    const fileUpload = bucket.file(filePath);

    await fileUpload.save(fileBuffer, {
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

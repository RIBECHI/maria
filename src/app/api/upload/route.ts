
import { NextResponse } from 'next/server';
import { initializeApp, getApps, cert, getApp } from 'firebase-admin/app';
import { getStorage } from 'firebase-admin/storage';
import { Readable } from 'stream';

const serviceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
};

const BUCKET_NAME = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;

// Garante que o app admin seja inicializado apenas uma vez.
if (!getApps().length) {
  try {
    initializeApp({
      credential: cert(serviceAccount),
      storageBucket: BUCKET_NAME,
    });
  } catch (e: any) {
    console.error('Firebase Admin Initialization Error:', e.message);
  }
}

export async function POST(request: Request) {
  if (!BUCKET_NAME) {
    return NextResponse.json(
      { success: false, error: "Firebase Storage bucket name is not configured." },
      { status: 500 }
    );
  }

  const formData = await request.formData();
  const file = formData.get('file') as File | null;
  const filePath = formData.get('filePath') as string | null;

  if (!file || !filePath) {
    return NextResponse.json(
      { success: false, error: 'File or filePath not provided.' },
      { status: 400 }
    );
  }

  const bucket = getStorage().bucket();
  const fileRef = bucket.file(filePath);

  try {
    // Converte o arquivo para um buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // Usa um stream para salvar o buffer
    const stream = fileRef.createWriteStream({
      metadata: {
        contentType: file.type,
      },
    });

    await new Promise((resolve, reject) => {
        stream.on('error', (err) => {
            console.error('Error uploading to GCS:', err);
            reject(new Error('Failed to upload file.'));
        });
        stream.on('finish', resolve);
        stream.end(buffer);
    });

    return NextResponse.json({ success: true, filePath: filePath });

  } catch (error: any) {
    console.error('API Upload Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error during upload.' },
      { status: 500 }
    );
  }
}

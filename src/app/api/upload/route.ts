
import { NextResponse } from 'next/server';
import { initializeApp, getApps, cert, getApp } from 'firebase-admin/app';
import { getStorage } from 'firebase-admin/storage';
import { Readable } from 'stream';

function initializeFirebaseAdmin() {
  if (!getApps().length) {
    const serviceAccount = {
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    };

    if (!serviceAccount.projectId || !serviceAccount.clientEmail || !serviceAccount.privateKey) {
      console.warn("Firebase Admin credentials are not set. Skipping initialization.");
      return null;
    }
    
    try {
      initializeApp({
        credential: cert(serviceAccount as any),
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      });
      console.log("Firebase Admin SDK initialized.");
    } catch (e: any) {
      console.error('Firebase Admin Initialization Error:', e.message);
      return null;
    }
  }
  return getApp();
}


export async function POST(request: Request) {
  const adminApp = initializeFirebaseAdmin();
  if (!adminApp) {
      return NextResponse.json(
          { success: false, error: "Firebase Admin SDK not initialized. Check server credentials." },
          { status: 500 }
      );
  }

  const BUCKET_NAME = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
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

  const bucket = getStorage(adminApp).bucket();
  const fileRef = bucket.file(filePath);

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
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

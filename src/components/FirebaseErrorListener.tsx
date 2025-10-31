
'use client';

import { useEffect } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';
import type { FirestorePermissionError } from '@/firebase/errors';

/**
 * A client-side component that listens for Firestore permission errors
 * and throws them to be caught by the Next.js development error overlay.
 * This provides a much better debugging experience than just logging to the console.
 */
export function FirebaseErrorListener() {
  useEffect(() => {
    const handler = (error: FirestorePermissionError) => {
      // Throw the error so Next.js's overlay can pick it up
      throw error;
    };

    errorEmitter.on('permission-error', handler);

    return () => {
      errorEmitter.off('permission-error', handler);
    };
  }, []);

  return null; // This component doesn't render anything
}

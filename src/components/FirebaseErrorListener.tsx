'use client';

import { useEffect } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

/**
 * A client component that listens for Firestore permission errors
 * and throws them as uncaught exceptions to be displayed in the
 * Next.js development error overlay. This is for development-time
 * debugging only.
 */
export function FirebaseErrorListener() {
  useEffect(() => {
    const handlePermissionError = (error: FirestorePermissionError) => {
      // Throw the error so Next.js can catch it and display the overlay.
      // The custom error class will provide a rich, readable format.
      throw error;
    };

    errorEmitter.on('permission-error', handlePermissionError);

    return () => {
      errorEmitter.off('permission-error', handlePermissionError);
    };
  }, []);

  return null; // This component does not render anything.
}

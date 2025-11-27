// src/firebase/client-provider.tsx
'use client';

import { ReactNode } from 'react';
import { FirebaseProvider } from './provider';
import { initializeFirebase } from './index';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener';

// Initialize Firebase on the client
const { app, auth, db } = initializeFirebase();

/**
 * A client-side component that wraps the FirebaseProvider and ensures
 * that Firebase is initialized only once. It also includes the
 * development-only error listener for security rule debugging.
 */
export function FirebaseClientProvider({ children }: { children: ReactNode }) {
  return (
    <FirebaseProvider app={app} auth={auth} db={db}>
      {children}
      {process.env.NODE_ENV === 'development' && <FirebaseErrorListener />}
    </FirebaseProvider>
  );
}

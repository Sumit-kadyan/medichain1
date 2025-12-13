// src/firebase/client-provider.tsx
'use client';

import { ReactNode } from 'react';
import { FirebaseProvider } from './provider';
import { initializeFirebase } from './index';

// Initialize Firebase on the client using the singleton function
const { app, auth, db } = initializeFirebase();

/**
 * A client-side component that wraps the FirebaseProvider and ensures
 * that Firebase is initialized only once using the singleton pattern.
 */
export function FirebaseClientProvider({ children }: { children: ReactNode }) {
  return (
    <FirebaseProvider app={app} auth={auth} db={db}>
      {children}
    </FirebaseProvider>
  );
}

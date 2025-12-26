// src/firebase/client-provider.tsx
'use client';

import { ReactNode, useMemo } from 'react';
import { initializeFirebase } from './index';
import { FirebaseProvider } from './provider';

export function FirebaseClientProvider({
  children,
}: {
  children: ReactNode;
}) {
  // Initialize Firebase ONCE on the client
  const firebase = useMemo(() => initializeFirebase(), []);

  return (
    <FirebaseProvider
      app={firebase.app}
      auth={firebase.auth}
      db={firebase.db}
    >
      {children}
    </FirebaseProvider>
  );
}

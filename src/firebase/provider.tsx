// src/firebase/provider.tsx
'use client';

import { createContext, useContext, ReactNode } from 'react';
import type { FirebaseApp } from 'firebase/app';
import type { Auth } from 'firebase/auth';
import type { Firestore } from 'firebase/firestore';

interface FirebaseContextValue {
  app: FirebaseApp;
  auth: Auth;
  db: Firestore;
}

const FirebaseContext = createContext<FirebaseContextValue | undefined>(undefined);

interface FirebaseProviderProps {
  children: ReactNode;
  app: FirebaseApp;
  auth: Auth;
  db: Firestore;
}

/**
 * Provides the Firebase app, auth, and firestore instances to the component tree.
 */
export function FirebaseProvider({ children, app, auth, db }: FirebaseProviderProps) {
  return (
    <FirebaseContext.Provider value={{ app, auth, db }}>
      {children}
    </FirebaseContext.Provider>
  );
}

/**
 * Hook to access the full Firebase context (app, auth, db).
 */
export function useFirebase() {
  const context = useContext(FirebaseContext);

  // Safe during Next.js build / prerender
  if (context === undefined) {
    if (typeof window === 'undefined') {
      return null as any;
    }
    throw new Error('useFirebase must be used within a FirebaseProvider');
  }

  return context;
}

export function useFirebaseApp() {
  const firebase = useFirebase();
  return firebase ? firebase.app : null;
}

export function useAuth() {
  const firebase = useFirebase();
  return firebase ? firebase.auth : null;
}

export function useFirestore() {
  const firebase = useFirebase();
  return firebase ? firebase.db : null;
}


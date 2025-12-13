// src/firebase/index.ts
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore, initializeFirestore, persistentLocalCache, memoryLocalCache } from 'firebase/firestore';
import { getAuth, Auth, browserLocalPersistence, setPersistence } from 'firebase/auth';
import { firebaseConfig } from './config';

interface FirebaseInstances {
  app: FirebaseApp;
  db: Firestore;
  auth: Auth;
}

let firebaseInstances: FirebaseInstances | null = null;

/**
 * Initializes Firebase and returns the app, auth, and firestore instances
 * using a singleton pattern. This ensures that Firebase is initialized only once,
 * making it safe for both server and client environments in Next.js.
 */
export function initializeFirebase(): FirebaseInstances {
  if (typeof window !== 'undefined') {
    // Client-side execution
    if (firebaseInstances) {
      return firebaseInstances;
    }

    const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    const auth = getAuth(app);
    
    // It's recommended to set persistence to avoid re-authentication on page refresh.
    setPersistence(auth, browserLocalPersistence);

    const db = initializeFirestore(app, {
      localCache: persistentLocalCache(),
    });

    firebaseInstances = { app, db, auth };
    return firebaseInstances;
  } else {
    // Server-side execution
    if (firebaseInstances) {
      return firebaseInstances;
    }
    
    const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    const auth = getAuth(app);
    const db = getFirestore(app);

    firebaseInstances = { app, db, auth };
    return firebaseInstances;
  }
}

// Export providers and hooks for easy import
export { FirebaseProvider, useFirebase, useFirebaseApp, useFirestore, useAuth } from './provider';
export { FirebaseClientProvider } from './client-provider';
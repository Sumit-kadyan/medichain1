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
 * using a singleton pattern. This ensures that Firebase is initialized only once.
 */
export function initializeFirebase(): FirebaseInstances {
  if (firebaseInstances) {
    return firebaseInstances;
  }

  const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
  const auth = getAuth(app);

  // Use memory cache for server-side rendering, persistent for client
  const localCache = typeof window !== 'undefined'
    ? persistentLocalCache(/*{ tabManager: 'NONE' }*/) // Consider disabling tabManager if needed
    : memoryLocalCache();

  const db = initializeFirestore(app, {
    localCache: localCache,
  });

  firebaseInstances = { app, db, auth };
  return firebaseInstances;
}


// Export providers and hooks for easy import
export { FirebaseProvider, useFirebase, useFirebaseApp, useFirestore, useAuth } from './provider';
export { FirebaseClientProvider } from './client-provider';

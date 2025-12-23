// src/firebase/index.ts
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore, initializeFirestore, persistentLocalCache } from 'firebase/firestore';
import { getAuth, Auth, browserLocalPersistence, setPersistence } from 'firebase/auth';
import { firebaseConfig } from './config';

interface FirebaseInstances {
  app: FirebaseApp;
  db: Firestore;
  auth: Auth;
}

/**
 * Initializes Firebase and returns the app, auth, and firestore instances.
 * It ensures that Firebase is initialized only once.
 */
export function initializeFirebase(): FirebaseInstances {

  const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
  const auth = getAuth(app);

  setPersistence(auth, browserLocalPersistence);

  const db = getFirestore(app);

  return { app, db, auth };
}


// Export providers and hooks for easy import
export { FirebaseProvider, useFirebase, useFirebaseApp, useFirestore, useAuth } from './provider';
export { FirebaseClientProvider } from './client-provider';

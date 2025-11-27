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

  // It's recommended to set persistence to avoid re-authentication on page refresh.
  setPersistence(auth, browserLocalPersistence);

  try {
    // initializeFirestore enables advanced features like offline persistence.
    initializeFirestore(app, {
      localCache: persistentLocalCache(),
    });
  } catch (error) {
    // Firestore might already be initialized if hot-reloading.
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code: string }).code !== 'failed-precondition'
    ) {
      console.warn('Firebase initialization error:', error);
    }
  }

  const db = getFirestore(app);

  return { app, db, auth };
}

// Export providers and hooks for easy import
export { FirebaseProvider, useFirebase, useFirebaseApp, useFirestore, useAuth } from './provider';
export { FirebaseClientProvider } from './client-provider';

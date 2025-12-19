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
  // 🚫 STOP Firebase from running during build / server
  if (typeof window === "undefined") {
    throw new Error("Firebase should not be initialized on the server");
  }

  const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
  const auth = getAuth(app);

  setPersistence(auth, browserLocalPersistence).catch(() => {});

  try {
    initializeFirestore(app, {
      localCache: persistentLocalCache(),
    });
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code: string }).code !== "failed-precondition"
    ) {
      console.warn("Firebase initialization error:", error);
    }
  }

  const db = getFirestore(app);

  return { app, db, auth };
}

// Export providers and hooks for easy import
export { FirebaseProvider, useFirebase, useFirebaseApp, useFirestore, useAuth } from './provider';
export { FirebaseClientProvider } from './client-provider';

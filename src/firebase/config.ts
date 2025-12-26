// src/firebase/config.ts
import type { FirebaseOptions } from "firebase/app";

let firebaseConfig: FirebaseOptions;

/**
 * Firebase App Hosting automatically injects FIREBASE_WEBAPP_CONFIG
 * This MUST be used in production.
 */
if (process.env.FIREBASE_WEBAPP_CONFIG) {
  firebaseConfig = JSON.parse(process.env.FIREBASE_WEBAPP_CONFIG);
} else {
  // Local / fallback (dev only)
  const {
    NEXT_PUBLIC_FIREBASE_API_KEY,
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    NEXT_PUBLIC_FIREBASE_APP_ID,
  } = process.env;

  if (
    !NEXT_PUBLIC_FIREBASE_API_KEY ||
    !NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ||
    !NEXT_PUBLIC_FIREBASE_PROJECT_ID
  ) {
    throw new Error(
      "Firebase config missing. FIREBASE_WEBAPP_CONFIG or NEXT_PUBLIC_FIREBASE_* must be defined."
    );
  }

  firebaseConfig = {
    apiKey: NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: NEXT_PUBLIC_FIREBASE_APP_ID,
  };
}

export { firebaseConfig };

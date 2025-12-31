// src/firebase/config.ts
import type { FirebaseOptions } from "firebase/app";

function getServerConfig(): FirebaseOptions {
  if (!process.env.FIREBASE_WEBAPP_CONFIG) {
    throw new Error("FIREBASE_WEBAPP_CONFIG missing on server");
  }
  return JSON.parse(process.env.FIREBASE_WEBAPP_CONFIG);
}

function getClientConfig(): FirebaseOptions {
  return {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
  };
}

export const firebaseConfig: FirebaseOptions =
  typeof window === "undefined"
    ? getServerConfig()
    : getClientConfig();

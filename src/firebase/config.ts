
// src/firebase/config.ts
import { FirebaseOptions } from 'firebase/app';

// This configuration now securely loads from environment variables.
// Make sure you have a .env file in your project root with the required keys.
export const firebaseConfig =
  process.env.FIREBASE_WEBAPP_CONFIG
    ? JSON.parse(process.env.FIREBASE_WEBAPP_CONFIG)
    : {
        apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
        authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
        appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
      };

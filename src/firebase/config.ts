// src/firebase/config.ts
import { FirebaseOptions } from 'firebase/app';

// This configuration is now populated from environment variables
// to keep secret keys out of the source code.
export const firebaseConfig: FirebaseOptions = {
  apiKey: "AIzaSyDtYoi1x923bcZ8eNnjw79lPY_dQxf9gGk",
  authDomain: "medichain-of3ue.firebaseapp.com",
  projectId: "medichain-of3ue",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: "250475667538",
  appId: "1:250475667538:web:2324574f92d6d5a34bff8b",
};

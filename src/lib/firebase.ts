
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  projectId: "YOUR_PROJECT_ID",
  appId: "YOUR_APP_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

export { app, db };

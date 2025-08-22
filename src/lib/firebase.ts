
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  projectId: "medichain-of3ue",
  appId: "1:250475667538:web:2324574f92d6d5a34bff8b",
  storageBucket: "medichain-of3ue.firebasestorage.app",
  apiKey: "AIzaSyAyYsik0fydSxsBvnSs5StPQ4fCjKB_TMc",
  authDomain: "medichain-of3ue.firebaseapp.com",
  messagingSenderId: "250475667538"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

export { app, db };


import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, initializeFirestore, memoryLocalCache } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  "projectId": "medichain-of3ue",
  "appId": "1:250475667538:web:2324574f92d6d5a34bff8b",
  "storageBucket": "medichain-of3ue.firebasestorage.app",
  "apiKey": "AIzaSyAyYsik0fydSxsBvnSs5StPQ4fCjKB_TMc",
  "authDomain": "medichain-of3ue.firebaseapp.com",
  "messagingSenderId": "250475667538"
};


// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Use initializeFirestore to enable offline persistence
const db = initializeFirestore(app, {
  localCache: memoryLocalCache(),
});

const auth = getAuth(app);

export { app, db, auth };

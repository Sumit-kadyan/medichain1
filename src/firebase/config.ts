// src/firebase/config.ts
import { FirebaseOptions } from 'firebase/app';

// WARNING: This is a temporary solution to get the application running.
// It is not secure to keep API keys in source code.
// We will implement a secure solution using environment variables next.
export const firebaseConfig: FirebaseOptions = {
  apiKey: "AIzaSyDtYoi1x923bcZ8eNnjw79lPY_dQxf9gGk",
  authDomain: "medichain-of3ue.firebaseapp.com",
  projectId: "medichain-of3ue",
  storageBucket: "medichain-of3ue.appspot.com",
  messagingSenderId: "250475667538",
  appId: "1:250475667538:web:2324574f92d6d5a34bff8b",
};

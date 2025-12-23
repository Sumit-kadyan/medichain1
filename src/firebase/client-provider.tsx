// src/firebase/client-provider.tsx
"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { initializeFirebase } from "./index";
import type { FirebaseApp } from "firebase/app";
import type { Firestore } from "firebase/firestore";
import type { Auth } from "firebase/auth";

interface FirebaseContextValue {
  app: FirebaseApp | null;
  db: Firestore | null;
  auth: Auth | null;
}

const FirebaseContext = createContext<FirebaseContextValue>({
  app: null,
  db: null,
  auth: null,
});

export function FirebaseClientProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [value, setValue] = useState<FirebaseContextValue>({
    app: null,
    db: null,
    auth: null,
  });

  useEffect(() => {
    const { app, db, auth } = initializeFirebase();
    setValue({ app, db, auth });
  }, []);

  return (
    <FirebaseContext.Provider value={value}>
      {children}
    </FirebaseContext.Provider>
  );
}

export const useFirebase = () => useContext(FirebaseContext);

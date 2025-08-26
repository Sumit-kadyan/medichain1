// src/lib/clinicIdentity.ts
import { doc, getDoc } from "firebase/firestore";
import type { Auth } from "firebase/auth";
import type { Firestore } from "firebase/firestore";

export async function resolveClinicId(auth: Auth, db: Firestore): Promise<string | null> {
  const u = auth.currentUser;
  if (!u) return null;
  try {
    const mref = doc(db, "users", u.uid);
    const snap = await getDoc(mref);
    if (snap.exists()) {
      const d = snap.data() as { clinicId?: string };
      if (d?.clinicId) return d.clinicId;
    }
    // fallback: clinic owner account uses its own uid
    return u.uid;
  } catch (e) {
    console.error("resolveClinicId error:", e);
    return u.uid;
  }
}

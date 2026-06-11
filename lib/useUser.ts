"use client";

import { onAuthStateChanged, signInAnonymously, User } from "firebase/auth";
import { useEffect, useState } from "react";
import { auth, firebaseConfigured } from "./firebase";

/**
 * Sesión anónima de Firebase: cada visitante obtiene un uid estable en este
 * navegador sin necesidad de registrarse. El nombre visible se guarda en
 * localStorage y dentro de cada liga a la que se una.
 */
export function useUser() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!firebaseConfigured) {
      setLoading(false);
      return;
    }
    const unsub = onAuthStateChanged(auth, (u) => {
      if (u) {
        setUser(u);
        setLoading(false);
      } else {
        signInAnonymously(auth).catch(() => setLoading(false));
      }
    });
    return unsub;
  }, []);

  return { user, loading };
}

export function getSavedName(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("mf_name") ?? "";
}

export function saveName(name: string) {
  localStorage.setItem("mf_name", name.trim());
}

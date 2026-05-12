"use client";

import { useEffect } from "react";

export function PwaRegister() {
  useEffect(() => {
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;

    // In dev a service worker only gets in the way: it caches the (non-content-hashed)
    // Turbopack chunks cache-first and then serves stale code back. Actively unregister
    // any worker that's already installed and wipe its caches.
    if (process.env.NODE_ENV !== "production") {
      void navigator.serviceWorker
        .getRegistrations()
        .then((regs) => Promise.all(regs.map((r) => r.unregister())))
        .catch(() => undefined);
      if (typeof caches !== "undefined") {
        void caches.keys().then((keys) => Promise.all(keys.map((k) => caches.delete(k)))).catch(() => undefined);
      }
      return;
    }

    const register = () => {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        /* registration failures are non-fatal — the app works fine without the SW */
      });
    };
    if (document.readyState === "complete") register();
    else {
      window.addEventListener("load", register, { once: true });
      return () => window.removeEventListener("load", register);
    }
  }, []);
  return null;
}

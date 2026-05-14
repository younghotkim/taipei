"use client";

import { useCallback, useEffect, useState } from "react";
import {
  emptyTravelerBook,
  normalizeTravelerBook,
  type Traveler,
  type TravelerBook,
  type TravelerId
} from "./travelers";

const storageKey = "taipei-trip-travelers-v1";

export type TravelerSyncStatus = "local" | "loading" | "synced" | "saving" | "offline";

export function useTravelers() {
  const [book, setBook] = useState<TravelerBook>(() => emptyTravelerBook());
  const [status, setStatus] = useState<TravelerSyncStatus>("loading");
  // Gate the writeback effect on a hydration flag so the empty initial book
  // doesn't clobber what's already in localStorage before the read populates it.
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem(storageKey);
    if (stored) {
      try {
        setBook(normalizeTravelerBook(JSON.parse(stored)));
      } catch {
        /* ignore */
      }
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!hydrated) return;
    window.localStorage.setItem(storageKey, JSON.stringify(book));
  }, [book, hydrated]);

  const refresh = useCallback(async () => {
    setStatus("loading");
    try {
      const res = await fetch("/api/travelers", { cache: "no-store" });
      if (!res.ok) throw new Error("load failed");
      const payload = (await res.json()) as { mode?: string; travelers?: unknown };
      if (payload.mode === "supabase") setBook(normalizeTravelerBook(payload.travelers));
      setStatus(payload.mode === "supabase" ? "synced" : "local");
    } catch {
      setStatus("offline");
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const saveOne = useCallback((id: TravelerId, traveler: Traveler) => {
    setBook((current) => {
      const next: TravelerBook = { ...current, [id]: { ...traveler, id } };
      setStatus("saving");
      void fetch("/api/travelers", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ travelers: next })
      })
        .then((r) => (r.ok ? (r.json() as Promise<{ mode?: string }>) : Promise.reject()))
        .then((payload) => setStatus(payload.mode === "supabase" ? "synced" : "local"))
        .catch(() => setStatus("offline"));
      return next;
    });
  }, []);

  return { book, status, saveOne, refresh };
}

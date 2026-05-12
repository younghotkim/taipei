"use client";

import { useCallback, useEffect, useState } from "react";
import { normalizePackBook, presetPackBook, type PackBook, type PackItem } from "./packing";

const storageKey = "taipei-trip-packing-v1";
const seededKey = "taipei-trip-packing-seeded-v1";

export type PackingSyncStatus = "local" | "loading" | "synced" | "saving" | "offline";

export function usePacking() {
  const [items, setItems] = useState<PackBook>([]);
  const [status, setStatus] = useState<PackingSyncStatus>("loading");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem(storageKey);
    if (stored) {
      try {
        setItems(normalizePackBook(JSON.parse(stored)));
      } catch {
        /* ignore */
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(storageKey, JSON.stringify(items));
  }, [items]);

  const persist = useCallback((next: PackBook) => {
    setStatus("saving");
    void fetch("/api/packing", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: next })
    })
      .then((r) => (r.ok ? (r.json() as Promise<{ mode?: string }>) : Promise.reject()))
      .then((payload) => setStatus(payload.mode === "supabase" ? "synced" : "local"))
      .catch(() => setStatus("offline"));
  }, []);

  const saveAll = useCallback(
    (next: PackBook) => {
      const normalized = normalizePackBook(next);
      setItems(normalized);
      persist(normalized);
    },
    [persist]
  );

  const refresh = useCallback(async () => {
    setStatus("loading");
    try {
      const res = await fetch("/api/packing", { cache: "no-store" });
      if (!res.ok) throw new Error("load failed");
      const payload = (await res.json()) as { mode?: string; items?: unknown };
      if (payload.mode === "supabase") setItems(normalizePackBook(payload.items));
      setStatus(payload.mode === "supabase" ? "synced" : "local");
    } catch {
      setStatus("offline");
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  // Seed the curated checklist the first time, if nothing exists yet (locally or remotely).
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (status === "loading" || status === "saving") return;
    if (window.localStorage.getItem(seededKey)) return;
    if (items.length > 0) {
      window.localStorage.setItem(seededKey, "1");
      return;
    }
    window.localStorage.setItem(seededKey, "1");
    saveAll(presetPackBook());
  }, [status, items.length, saveAll]);

  const toggle = useCallback(
    (id: string) => {
      saveAll(items.map((item) => (item.id === id ? { ...item, packed: !item.packed } : item)));
    },
    [items, saveAll]
  );

  const add = useCallback(
    (item: PackItem) => {
      saveAll([...items, item]);
    },
    [items, saveAll]
  );

  const update = useCallback(
    (item: PackItem) => {
      saveAll(items.map((entry) => (entry.id === item.id ? item : entry)));
    },
    [items, saveAll]
  );

  const remove = useCallback(
    (id: string) => {
      saveAll(items.filter((item) => item.id !== id));
    },
    [items, saveAll]
  );

  const resetToPreset = useCallback(() => {
    saveAll(presetPackBook());
  }, [saveAll]);

  return { items, status, toggle, add, update, remove, resetToPreset, refresh };
}

"use client";

import { useCallback, useEffect, useState } from "react";
import { normalizeVaultBook, type VaultBook, type VaultItem } from "./trip-vault";

const storageKey = "taipei-trip-vault-v1";

export type VaultSyncStatus = "local" | "loading" | "synced" | "saving" | "offline";

export function useVault() {
  const [items, setItems] = useState<VaultBook>([]);
  const [status, setStatus] = useState<VaultSyncStatus>("loading");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem(storageKey);
    if (!stored) return;
    try {
      setItems(normalizeVaultBook(JSON.parse(stored)));
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(storageKey, JSON.stringify(items));
  }, [items]);

  const refresh = useCallback(async () => {
    setStatus("loading");
    try {
      const res = await fetch("/api/vault", { cache: "no-store" });
      if (!res.ok) throw new Error("load failed");
      const payload = (await res.json()) as { mode?: string; items?: unknown };
      if (payload.mode === "supabase") setItems(normalizeVaultBook(payload.items));
      setStatus(payload.mode === "supabase" ? "synced" : "local");
    } catch {
      setStatus("offline");
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const saveAll = useCallback((next: VaultBook) => {
    const normalized = normalizeVaultBook(next);
    setItems(normalized);
    setStatus("saving");
    void fetch("/api/vault", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: normalized })
    })
      .then((r) => (r.ok ? (r.json() as Promise<{ mode?: string }>) : Promise.reject()))
      .then((payload) => setStatus(payload.mode === "supabase" ? "synced" : "local"))
      .catch(() => setStatus("offline"));
  }, []);

  const upsert = useCallback(
    (item: VaultItem) => {
      saveAll(items.some((entry) => entry.id === item.id)
        ? items.map((entry) => (entry.id === item.id ? item : entry))
        : [...items, item]);
    },
    [items, saveAll]
  );

  const remove = useCallback(
    (id: string) => {
      saveAll(items.filter((entry) => entry.id !== id));
    },
    [items, saveAll]
  );

  return { items, status, upsert, remove, saveAll, refresh };
}

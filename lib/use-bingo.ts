"use client";

import { useCallback, useEffect, useState } from "react";
import { normalizeBingoDone, toggleBingoCell } from "./bingo";

const storageKey = "taipei-trip-bingo-v1";

export type BingoSyncStatus = "local" | "loading" | "synced" | "saving" | "offline";

export function useBingo() {
  const [done, setDone] = useState<number[]>([]);
  const [status, setStatus] = useState<BingoSyncStatus>("loading");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem(storageKey);
    if (!stored) return;
    try {
      setDone(normalizeBingoDone(JSON.parse(stored)));
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(storageKey, JSON.stringify(done));
  }, [done]);

  const refresh = useCallback(async () => {
    setStatus("loading");
    try {
      const res = await fetch("/api/bingo", { cache: "no-store" });
      if (!res.ok) throw new Error("load failed");
      const payload = (await res.json()) as { mode?: string; done?: unknown };
      if (payload.mode === "supabase") setDone(normalizeBingoDone(payload.done));
      setStatus(payload.mode === "supabase" ? "synced" : "local");
    } catch {
      setStatus("offline");
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const push = useCallback((next: number[]) => {
    setStatus("saving");
    void fetch("/api/bingo", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ done: next })
    })
      .then((r) => (r.ok ? (r.json() as Promise<{ mode?: string }>) : Promise.reject()))
      .then((p) => setStatus(p.mode === "supabase" ? "synced" : "local"))
      .catch(() => setStatus("offline"));
  }, []);

  const toggle = useCallback(
    (index: number) => {
      setDone((current) => {
        const next = toggleBingoCell(current, index);
        push(next);
        return next;
      });
    },
    [push]
  );

  return { done, status, toggle, refresh };
}

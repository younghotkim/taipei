"use client";

import { useCallback, useEffect, useState } from "react";
import {
  newExpenseId,
  normalizeExpenseEntry,
  normalizeLedger,
  type ExpenseEntry,
  type ExpenseLedger
} from "./expense-ledger";

const storageKey = "taipei-trip-expenses-v1";

export type ExpenseSyncStatus = "local" | "loading" | "synced" | "saving" | "offline";

export type NewExpenseInput = Omit<ExpenseEntry, "id" | "at"> & { at?: string };

export function useExpenses() {
  const [entries, setEntries] = useState<ExpenseLedger>([]);
  const [status, setStatus] = useState<ExpenseSyncStatus>("loading");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem(storageKey);
    if (!stored) return;
    try {
      setEntries(normalizeLedger(JSON.parse(stored)));
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(storageKey, JSON.stringify(entries));
  }, [entries]);

  const refresh = useCallback(async () => {
    setStatus("loading");
    try {
      const res = await fetch("/api/expenses", { cache: "no-store" });
      if (!res.ok) throw new Error("load failed");
      const payload = (await res.json()) as { mode?: string; entries?: unknown };
      if (payload.mode === "supabase") {
        const remote = normalizeLedger(payload.entries);
        setEntries((current) => {
          const remoteIds = new Set(remote.map((e) => e.id));
          const localOnly = current.filter((e) => !remoteIds.has(e.id));
          return [...remote, ...localOnly];
        });
      }
      setStatus(payload.mode === "supabase" ? "synced" : "local");
    } catch {
      setStatus("offline");
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const pushOne = useCallback((entry: ExpenseEntry) => {
    setStatus("saving");
    void fetch("/api/expenses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entry })
    })
      .then((r) => (r.ok ? (r.json() as Promise<{ mode?: string }>) : Promise.reject()))
      .then((p) => setStatus(p.mode === "supabase" ? "synced" : "local"))
      .catch(() => setStatus("offline"));
  }, []);

  const addEntry = useCallback(
    (data: NewExpenseInput) => {
      const entry = normalizeExpenseEntry({ ...data, id: newExpenseId(), at: data.at ?? new Date().toISOString() });
      if (!entry) return;
      setEntries((current) => [...current, entry]);
      pushOne(entry);
    },
    [pushOne]
  );

  const updateEntry = useCallback(
    (id: string, patch: Partial<ExpenseEntry>) => {
      setEntries((current) => {
        const next = current.map((e) => (e.id === id ? normalizeExpenseEntry({ ...e, ...patch, id }) ?? e : e));
        const updated = next.find((e) => e.id === id);
        if (updated) pushOne(updated);
        return next;
      });
    },
    [pushOne]
  );

  const removeEntry = useCallback((id: string) => {
    setEntries((current) => current.filter((e) => e.id !== id));
    setStatus("saving");
    void fetch("/api/expenses", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id })
    })
      .then((r) => (r.ok ? (r.json() as Promise<{ mode?: string }>) : Promise.reject()))
      .then((p) => setStatus(p.mode === "supabase" ? "synced" : "local"))
      .catch(() => setStatus("offline"));
  }, []);

  return { entries, status, addEntry, updateEntry, removeEntry, refresh };
}

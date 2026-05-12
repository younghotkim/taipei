"use client";

import { useCallback, useEffect, useState } from "react";
import {
  defaultBudgetSettings,
  normalizeBudgetSettings,
  type BudgetSettings
} from "./budget";

const storageKey = "taipei-trip-budget-v1";

export type BudgetSyncStatus = "local" | "loading" | "synced" | "saving" | "offline";

export function useBudget() {
  const [settings, setSettings] = useState<BudgetSettings>(defaultBudgetSettings);
  const [status, setStatus] = useState<BudgetSyncStatus>("loading");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem(storageKey);
    if (!stored) return;
    try {
      setSettings(normalizeBudgetSettings(JSON.parse(stored)));
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(storageKey, JSON.stringify(settings));
  }, [settings]);

  const refresh = useCallback(async () => {
    setStatus("loading");
    try {
      const res = await fetch("/api/budget", { cache: "no-store" });
      if (!res.ok) throw new Error("load failed");
      const payload = (await res.json()) as { mode?: string; settings?: unknown };
      if (payload.settings) setSettings(normalizeBudgetSettings(payload.settings));
      setStatus(payload.mode === "supabase" ? "synced" : "local");
    } catch {
      setStatus("offline");
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const save = useCallback((next: BudgetSettings) => {
    const normalized = normalizeBudgetSettings(next);
    setSettings(normalized);
    setStatus("saving");
    void fetch("/api/budget", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ settings: normalized })
    })
      .then((r) => (r.ok ? (r.json() as Promise<{ mode?: string }>) : Promise.reject()))
      .then((payload) => setStatus(payload.mode === "supabase" ? "synced" : "local"))
      .catch(() => setStatus("offline"));
  }, []);

  return { settings, status, save, refresh };
}

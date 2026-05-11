"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  dayToRow,
  mergeItinerary,
  planToRow,
  stopToRow,
  type DayRow,
  type EssentialItem,
  type EssentialRow,
  type ItinerarySnapshot,
  type RemoteOverrides,
  type StopPlanRow,
  type StopRow
} from "./itinerary";
import { type StopPlanMeta, type TripDay, type TripStop } from "./trip-data";

export type ItinerarySyncStatus = "loading" | "synced" | "local" | "saving" | "offline" | "error";

type RemotePayload = {
  mode?: string;
  remote?: {
    stops?: StopRow[];
    days?: DayRow[];
    plans?: StopPlanRow[];
    essentials?: EssentialRow[];
    archived?: string[];
  } | null;
};

function toOverrides(
  payload: RemotePayload["remote"] | null | undefined
): RemoteOverrides | null {
  if (!payload) return null;
  return {
    stops: payload.stops ?? [],
    days: payload.days ?? [],
    plans: payload.plans ?? [],
    essentials: payload.essentials ?? [],
    archived: new Set(payload.archived ?? [])
  };
}

export function useItinerary() {
  const [overrides, setOverrides] = useState<RemoteOverrides | null>(null);
  const [status, setStatus] = useState<ItinerarySyncStatus>("loading");
  const overridesRef = useRef<RemoteOverrides | null>(null);
  overridesRef.current = overrides;

  useEffect(() => {
    let cancelled = false;
    setStatus("loading");
    fetch("/api/itinerary", { cache: "no-store" })
      .then((response) => (response.ok ? (response.json() as Promise<RemotePayload>) : null))
      .then((payload) => {
        if (cancelled) return;
        if (!payload) {
          setStatus("offline");
          return;
        }
        setOverrides(toOverrides(payload.remote ?? null));
        setStatus(payload.mode === "supabase" ? "synced" : "local");
      })
      .catch(() => {
        if (!cancelled) setStatus("offline");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const snapshot: ItinerarySnapshot = useMemo(() => mergeItinerary(overrides), [overrides]);

  async function putBatch(body: Record<string, unknown>) {
    setStatus("saving");
    try {
      const response = await fetch("/api/itinerary", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      if (!response.ok) throw new Error("save failed");
      const payload = (await response.json()) as { mode?: string };
      setStatus(payload.mode === "supabase" ? "synced" : "local");
      return true;
    } catch {
      setStatus("error");
      return false;
    }
  }

  async function refresh() {
    const response = await fetch("/api/itinerary", { cache: "no-store" });
    if (!response.ok) return;
    const payload = (await response.json()) as RemotePayload;
    setOverrides(toOverrides(payload.remote ?? null));
  }

  const saveStop = useCallback(
    async (stop: TripStop, sortOrder: number) => {
      const row = stopToRow(stop, "_", sortOrder, false);
      const ok = await putBatch({ stops: [row] });
      if (ok) await refresh();
      return ok;
    },
    []
  );

  const saveStopFull = useCallback(
    async (stop: TripStop, plan: StopPlanMeta, sortOrder: number) => {
      const stopRow = stopToRow(stop, "_", sortOrder, false);
      const planRow = planToRow(stop.id, plan, "_");
      const ok = await putBatch({ stops: [stopRow], plans: [planRow] });
      if (ok) await refresh();
      return ok;
    },
    []
  );

  const saveStops = useCallback(async (rows: StopRow[]) => {
    const ok = await putBatch({ stops: rows });
    if (ok) await refresh();
    return ok;
  }, []);

  const archiveStop = useCallback(async (stopId: string) => {
    const ok = await putBatch({ archived: [stopId] });
    if (ok) await refresh();
    return ok;
  }, []);

  const deleteStop = useCallback(async (stopId: string) => {
    setStatus("saving");
    try {
      const response = await fetch(`/api/itinerary?stopId=${encodeURIComponent(stopId)}`, {
        method: "DELETE"
      });
      if (!response.ok) throw new Error("delete failed");
      setStatus("synced");
      await refresh();
      return true;
    } catch {
      setStatus("error");
      return false;
    }
  }, []);

  const saveDay = useCallback(async (day: TripDay, sortOrder: number) => {
    const row = dayToRow(day, "_", sortOrder);
    const ok = await putBatch({ days: [row] });
    if (ok) await refresh();
    return ok;
  }, []);

  const savePlan = useCallback(async (stopId: string, plan: StopPlanMeta) => {
    const row = planToRow(stopId, plan, "_");
    const ok = await putBatch({ plans: [row] });
    if (ok) await refresh();
    return ok;
  }, []);

  const saveEssentials = useCallback(async (items: EssentialItem[]) => {
    const rows: EssentialRow[] = items.map((item) => ({
      trip_id: "_",
      item_id: item.itemId,
      label: item.label,
      sort_order: item.sortOrder,
      checked: item.checked
    }));
    const ok = await putBatch({ essentials: rows });
    if (ok) await refresh();
    return ok;
  }, []);

  return {
    snapshot,
    status,
    saveStop,
    saveStopFull,
    saveStops,
    archiveStop,
    deleteStop,
    saveDay,
    savePlan,
    saveEssentials,
    refresh
  };
}

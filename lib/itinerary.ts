// Custom (editable) itinerary state. The static defaults in trip-data.ts are the
// baseline; rows in Supabase override per-id. Stops added by the editor exist
// only in Supabase. Reads merge the two; writes target Supabase only.

import {
  essentials as defaultEssentials,
  stopPlanMeta as defaultStopPlanMeta,
  tripDays as defaultTripDays,
  tripStops as defaultTripStops,
  type StopPlanMeta,
  type TripCategory,
  type TripDay,
  type TripPriority,
  type TripStop
} from "./trip-data";

export type EssentialItem = {
  itemId: string;
  label: string;
  sortOrder: number;
  checked: boolean;
};

export type ItinerarySnapshot = {
  days: TripDay[];
  stops: TripStop[];
  plans: Record<string, StopPlanMeta>;
  essentials: EssentialItem[];
};

// ----- Row types from Supabase -----

export type StopRow = {
  trip_id: string;
  stop_id: string;
  day: number;
  time: string;
  title: string;
  subtitle: string;
  name_zh: string;
  mrt: string;
  phrase: string;
  category: string;
  lat: number;
  lng: number;
  highlights: string[];
  prompt: string;
  maps_query: string;
  sort_order: number;
  archived: boolean;
  updated_at?: string;
};

export type DayRow = {
  trip_id: string;
  day: number;
  date: string;
  title: string;
  mood: string;
  summary: string;
  sort_order: number;
  updated_at?: string;
};

export type StopPlanRow = {
  trip_id: string;
  stop_id: string;
  priority: string;
  duration_minutes: number;
  alternatives: string[];
  flex_tip: string;
  opening_hours?: string;
  booking_status?: string;
  risk_level?: string;
  risk_note?: string;
  updated_at?: string;
};

export type EssentialRow = {
  trip_id: string;
  item_id: string;
  label: string;
  sort_order: number;
  checked: boolean;
  updated_at?: string;
};

// ----- Conversion helpers -----

const VALID_CATEGORIES: readonly TripCategory[] = [
  "food",
  "coffee",
  "beer",
  "whisky",
  "sight",
  "shopping",
  "transit",
  "hotel"
];

const VALID_PRIORITIES: readonly TripPriority[] = ["must", "optional", "backup"];

export function asCategory(value: string): TripCategory {
  return (VALID_CATEGORIES as readonly string[]).includes(value)
    ? (value as TripCategory)
    : "sight";
}

export function asPriority(value: string): TripPriority {
  return (VALID_PRIORITIES as readonly string[]).includes(value)
    ? (value as TripPriority)
    : "optional";
}

export function rowToStop(row: StopRow, fallback?: TripStop): TripStop {
  const dayMeta = defaultTripDays.find((day) => day.day === row.day);
  return {
    id: row.stop_id,
    day: row.day,
    date: dayMeta?.date ?? fallback?.date ?? "",
    time: row.time,
    title: row.title,
    subtitle: row.subtitle,
    nameZh: row.name_zh,
    mrt: row.mrt,
    phrase: row.phrase,
    // not stored remotely — keep the curated pinyin/Korean gloss from the default stop
    phrasePron: fallback?.phrasePron,
    phraseHint: fallback?.phraseHint,
    category: asCategory(row.category),
    lat: row.lat,
    lng: row.lng,
    highlights: row.highlights ?? [],
    prompt: row.prompt,
    mapsQuery: row.maps_query
  };
}

export function stopToRow(stop: TripStop, tripId: string, sortOrder: number, archived: boolean): StopRow {
  return {
    trip_id: tripId,
    stop_id: stop.id,
    day: stop.day,
    time: stop.time,
    title: stop.title,
    subtitle: stop.subtitle,
    name_zh: stop.nameZh,
    mrt: stop.mrt,
    phrase: stop.phrase,
    category: stop.category,
    lat: stop.lat,
    lng: stop.lng,
    highlights: stop.highlights,
    prompt: stop.prompt,
    maps_query: stop.mapsQuery,
    sort_order: sortOrder,
    archived
  };
}

export function rowToDay(row: DayRow): TripDay {
  return {
    day: row.day,
    date: row.date,
    title: row.title,
    mood: row.mood,
    summary: row.summary
  };
}

export function dayToRow(day: TripDay, tripId: string, sortOrder: number): DayRow {
  return {
    trip_id: tripId,
    day: day.day,
    date: day.date,
    title: day.title,
    mood: day.mood,
    summary: day.summary,
    sort_order: sortOrder
  };
}

export function rowToPlan(row: StopPlanRow): StopPlanMeta {
  const riskLevel =
    row.risk_level === "medium" || row.risk_level === "high" || row.risk_level === "low"
      ? row.risk_level
      : "low";
  return {
    priority: asPriority(row.priority),
    durationMinutes: row.duration_minutes,
    alternatives: row.alternatives ?? [],
    flexTip: row.flex_tip,
    openingHours: row.opening_hours ?? "",
    bookingStatus: row.booking_status ?? "",
    riskLevel,
    riskNote: row.risk_note ?? ""
  };
}

export function planToRow(stopId: string, plan: StopPlanMeta, tripId: string): StopPlanRow {
  return {
    trip_id: tripId,
    stop_id: stopId,
    priority: plan.priority,
    duration_minutes: plan.durationMinutes,
    alternatives: plan.alternatives,
    flex_tip: plan.flexTip,
    opening_hours: plan.openingHours ?? "",
    booking_status: plan.bookingStatus ?? "",
    risk_level: plan.riskLevel ?? "low",
    risk_note: plan.riskNote ?? ""
  };
}

// ----- Merge static defaults with remote overrides -----

export type RemoteOverrides = {
  stops: StopRow[];
  days: DayRow[];
  plans: StopPlanRow[];
  essentials: EssentialRow[];
  archived: Set<string>;
};

export function mergeItinerary(remote: RemoteOverrides | null): ItinerarySnapshot {
  // 1. Days — start from defaults, override per-day, add any new days
  const daysById = new Map<number, TripDay>();
  defaultTripDays.forEach((day) => daysById.set(day.day, day));
  remote?.days.forEach((row) => daysById.set(row.day, rowToDay(row)));
  const days = Array.from(daysById.values()).sort((a, b) => a.day - b.day);

  // 2. Stops — start from defaults, override per-id, add new ones, drop archived
  const stopOverridesByDay = new Map<number, Map<string, { row: StopRow }>>();
  remote?.stops.forEach((row) => {
    if (!stopOverridesByDay.has(row.day)) {
      stopOverridesByDay.set(row.day, new Map());
    }
    stopOverridesByDay.get(row.day)!.set(row.stop_id, { row });
  });

  const archived = remote?.archived ?? new Set<string>();

  // For each day: collect (id, sortOrder, stop) entries from defaults + overrides
  type Indexed = { stop: TripStop; sortOrder: number };
  const stopsByDayList = new Map<number, Indexed[]>();

  // defaults first (sortOrder by original array position)
  defaultTripStops.forEach((stop, index) => {
    if (archived.has(stop.id)) return;
    const override = stopOverridesByDay.get(stop.day)?.get(stop.id);
    if (override) {
      const merged = rowToStop(override.row, stop);
      if (!stopsByDayList.has(merged.day)) stopsByDayList.set(merged.day, []);
      stopsByDayList.get(merged.day)!.push({ stop: merged, sortOrder: override.row.sort_order });
    } else {
      if (!stopsByDayList.has(stop.day)) stopsByDayList.set(stop.day, []);
      stopsByDayList.get(stop.day)!.push({ stop, sortOrder: index * 100 });
    }
  });

  // new stops (in Supabase but not in defaults)
  const defaultIds = new Set(defaultTripStops.map((stop) => stop.id));
  remote?.stops.forEach((row) => {
    if (defaultIds.has(row.stop_id)) return;
    if (archived.has(row.stop_id)) return;
    const stop = rowToStop(row);
    if (!stopsByDayList.has(stop.day)) stopsByDayList.set(stop.day, []);
    stopsByDayList.get(stop.day)!.push({ stop, sortOrder: row.sort_order });
  });

  const stops: TripStop[] = [];
  Array.from(stopsByDayList.keys())
    .sort((a, b) => a - b)
    .forEach((day) => {
      const list = stopsByDayList.get(day)!;
      list.sort((a, b) => {
        if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
        return a.stop.time.localeCompare(b.stop.time);
      });
      list.forEach((entry) => stops.push(entry.stop));
    });

  // 3. Plans — defaults overlay with overrides
  const plans: Record<string, StopPlanMeta> = { ...defaultStopPlanMeta };
  remote?.plans.forEach((row) => {
    plans[row.stop_id] = rowToPlan(row);
  });

  // 4. Essentials — if remote has rows, use them; otherwise convert defaults to rows
  let essentialList: EssentialItem[];
  if (remote && remote.essentials.length > 0) {
    essentialList = remote.essentials
      .slice()
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((row) => ({
        itemId: row.item_id,
        label: row.label,
        sortOrder: row.sort_order,
        checked: row.checked
      }));
  } else {
    essentialList = defaultEssentials.map((label, index) => ({
      itemId: `default-${index}`,
      label,
      sortOrder: index,
      checked: false
    }));
  }

  return { days, stops, plans, essentials: essentialList };
}

// ----- Helpers for editor -----

export function newStopId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `stop-${crypto.randomUUID()}`;
  }
  return `stop-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function newEssentialId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `ess-${crypto.randomUUID()}`;
  }
  return `ess-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function getPlan(plans: Record<string, StopPlanMeta>, stopId: string): StopPlanMeta {
  return (
    plans[stopId] ?? {
      priority: "optional",
      durationMinutes: 60,
      alternatives: [],
      flexTip: "",
      openingHours: "",
      bookingStatus: "",
      riskLevel: "low",
      riskNote: ""
    }
  );
}

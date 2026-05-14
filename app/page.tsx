"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  BarChart3,
  Camera,
  Check,
  ChevronDown,
  ChevronUp,
  Clock,
  Cloud,
  CloudOff,
  Download,
  ExternalLink,
  FileText,
  FolderLock,
  Import,
  ListChecks,
  Loader2,
  Luggage,
  Map as MapIcon,
  Navigation,
  Paperclip,
  Pencil,
  Plus,
  RefreshCw,
  Save,
  Search,
  Star,
  Sun,
  Timer,
  Trash2,
  Wallet
} from "lucide-react";
import { TaiwanFlag } from "./components/TaiwanFlag";
import { MapView } from "./components/MapView";
import { TodayMode } from "./components/TodayMode";
import { RecapMode } from "./components/RecapMode";
import { LedgerMode } from "./components/LedgerMode";
import { categoryIcon } from "./components/icons";
import { DayWeatherBadge } from "./components/WeatherBar";
import { PhotoUploader } from "./components/PhotoUploader";
import { PackingList } from "./components/PackingList";
import { TaipeiInfo } from "./components/TaipeiInfo";
import { TravelerCards } from "./components/TravelerCards";
import { FlightStatusBadge } from "./components/FlightStatusBadge";
import { VaultFileField } from "./components/VaultFileField";
import { ItineraryProvider, useItineraryContext } from "./components/ItineraryContext";
import { StopEditor, DayEditor } from "./components/StopEditor";
import { CommentThread } from "./components/CommentThread";
import { useConfirm } from "./components/ConfirmProvider";
import { DepartureWidget } from "./components/DepartureWidget";
import {
  categoryColors,
  categoryLabels,
  priorityLabels,
  type TripCategory,
  type TripDay,
  type TripPriority,
  type TripStop,
  type StopPlanMeta
} from "@/lib/trip-data";
import { getPlan, newStopId, stopToRow, type StopRow } from "@/lib/itinerary";
import { useExpenses } from "@/lib/use-expenses";
import { useVault } from "@/lib/use-vault";
import { usePacking } from "@/lib/use-packing";
import { useTravelers } from "@/lib/use-travelers";
import {
  emptyVaultItem,
  vaultKindLabels,
  vaultOwnerLabels,
  vaultStatusLabels,
  type VaultItem,
  type VaultKind
} from "@/lib/trip-vault";
import {
  authorLabels,
  combinedRating,
  emptyMemory,
  expenseCategoryLabels,
  expenseMethodLabels,
  expensePayerLabels,
  getStopMemory,
  isMemoryBook,
  type ExpenseCategory,
  type ExpenseMethod,
  type ExpensePayer,
  type Memory,
  type MemoryBook
} from "@/lib/memory-types";

type ShellMode = "plan" | "today" | "vault" | "memories" | "ledger" | "recap";
type PlanView = "list" | "map" | "edit";
type MemoryView = "list" | "edit";
type SyncStatus = "local" | "loading" | "synced" | "saving" | "offline" | "error";
type TripStatus = Memory["status"];

const storageKey = "taipei-trip-memory-book-v1";
const modeStorageKey = "taipei-trip-mode-v1";

const dayIsoDates: Record<number, string> = {
  1: "2026-05-15",
  2: "2026-05-16",
  3: "2026-05-17",
  4: "2026-05-18"
};

const isoDayMap: Record<string, number> = Object.fromEntries(
  Object.entries(dayIsoDates).map(([day, iso]) => [iso, Number(day)])
);

function todayIso() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

function minutesFromTimeString(time: string): number {
  const match = time.match(/^(\d{1,2}):(\d{2})/);
  if (!match) return -1;
  return Number(match[1]) * 60 + Number(match[2]);
}

// Pick the stop most relevant to "right now": if today is a trip day, the latest
// stop whose time has already started (or the first if the day hasn't started);
// otherwise the first stop of the closest upcoming day.
function pickCurrentStop(stops: TripStop[]): TripStop | null {
  if (stops.length === 0) return null;
  const iso = todayIso();
  const tripDayNum = isoDayMap[iso];
  if (tripDayNum) {
    const dayStops = stops.filter((s) => s.day === tripDayNum);
    if (dayStops.length === 0) return stops[0];
    const now = new Date();
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    let chosen = dayStops[0];
    for (const stop of dayStops) {
      const m = minutesFromTimeString(stop.time);
      if (m >= 0 && m <= nowMinutes) chosen = stop;
    }
    return chosen;
  }
  // not a trip day — if before the trip, day 1 first; if after, last stop
  const sortedIsos = Object.values(dayIsoDates).sort();
  if (iso < sortedIsos[0]) {
    return stops.find((s) => s.day === 1) ?? stops[0];
  }
  const lastDay = Math.max(...stops.map((s) => s.day));
  const lastDayStops = stops.filter((s) => s.day === lastDay);
  return lastDayStops[lastDayStops.length - 1] ?? stops[stops.length - 1];
}

function isShellMode(value: string | null): value is ShellMode {
  return (
    value === "plan" ||
    value === "today" ||
    value === "vault" ||
    value === "memories" ||
    value === "ledger" ||
    value === "recap"
  );
}

// Combine memory + itinerary sync status into one label/state for the topbar chip.
type CombinedSync = "synced" | "saving" | "local" | "offline" | "loading";

function combineSync(memory: SyncStatus, itinerary: string): CombinedSync {
  const states = [memory, itinerary];
  if (states.includes("saving")) return "saving";
  if (states.includes("loading")) return "loading";
  if (states.includes("error") || states.includes("offline")) return "offline";
  if (memory === "synced" || itinerary === "synced") return "synced";
  return "local";
}

const combinedSyncMeta: Record<CombinedSync, { label: string }> = {
  synced: { label: "동기화됨" },
  saving: { label: "저장 중" },
  loading: { label: "불러오는 중" },
  local: { label: "로컬 저장" },
  offline: { label: "오프라인" }
};

const modeLabels: Record<ShellMode, string> = {
  plan: "일정",
  today: "오늘",
  vault: "준비",
  ledger: "가계부",
  memories: "기록",
  recap: "회고"
};

const modeIcons: Record<ShellMode, React.ReactNode> = {
  plan: <MapIcon size={16} />,
  today: <Sun size={16} />,
  vault: <Luggage size={16} />,
  ledger: <Wallet size={16} />,
  memories: <FileText size={16} />,
  recap: <BarChart3 size={16} />
};

const statusLabels: Record<TripStatus, string> = {
  planned: "예정",
  going: "가는 중",
  done: "완료",
  skipped: "스킵"
};

export default function Home() {
  return (
    <ItineraryProvider>
      <HomeShell />
    </ItineraryProvider>
  );
}

function HomeShell() {
  const itinerary = useItineraryContext();
  const { snapshot } = itinerary;
  const tripDays = snapshot.days;
  const tripStops = snapshot.stops;
  const fallbackStopId = tripStops[0]?.id ?? "";
  const expenses = useExpenses();
  const vault = useVault();
  const packing = usePacking();
  const travelers = useTravelers();

  const [mode, setMode] = useState<ShellMode>("plan");
  const [planView, setPlanView] = useState<PlanView>("list");
  const [memoryView, setMemoryView] = useState<MemoryView>("list");
  const [editMode, setEditMode] = useState(false);
  const [pendingPin, setPendingPin] = useState<{ lat: number; lng: number } | null>(null);
  const [activeDay, setActiveDay] = useState(1);
  const [activeStopId, setActiveStopId] = useState(fallbackStopId);
  const [memoryBook, setMemoryBook] = useState<MemoryBook>({});
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<TripCategory | "all">("all");
  const [importOpen, setImportOpen] = useState(false);
  const [importText, setImportText] = useState("");
  const [importError, setImportError] = useState("");
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("loading");
  const todayAutoSelectedRef = useRef(false);
  const saveTimersRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  // Restore the last-used mode on first render.
  useEffect(() => {
    const stored = window.localStorage.getItem(modeStorageKey);
    if (isShellMode(stored)) setMode(stored);
  }, []);

  useEffect(() => {
    window.localStorage.setItem(modeStorageKey, mode);
  }, [mode]);

  // When entering TODAY mode, jump to the time-appropriate stop (once per session).
  useEffect(() => {
    if (mode !== "today") return;
    if (todayAutoSelectedRef.current) return;
    if (tripStops.length === 0) return;
    const target = pickCurrentStop(tripStops);
    if (target) {
      setActiveDay(target.day);
      setActiveStopId(target.id);
    }
    todayAutoSelectedRef.current = true;
  }, [mode, tripStops]);

  const activeStop = tripStops.find((stop) => stop.id === activeStopId) ?? tripStops[0];
  const activeDayData = tripDays.find((day) => day.day === activeDay) ?? tripDays[0];
  const plans = snapshot.plans;
  const visibleStops = useMemo(
    () =>
      tripStops.filter((stop) => {
        const matchesDay = activeDay === 0 || stop.day === activeDay;
        const matchesCategory = categoryFilter === "all" || stop.category === categoryFilter;
        return matchesDay && matchesCategory;
      }),
    [tripStops, activeDay, categoryFilter]
  );
  const visitedCount = tripStops.filter((stop) => getStopMemory(memoryBook, stop.id).visited).length;
  const skippedCount = tripStops.filter((stop) => getStopMemory(memoryBook, stop.id).status === "skipped").length;
  const writtenStops = tripStops.filter((stop) => getStopMemory(memoryBook, stop.id).note.trim());
  const currentIndex = Math.max(
    tripStops.findIndex((stop) => stop.id === activeStop.id) + 1,
    1
  );

  useEffect(() => {
    if (tripStops.length === 0) return;
    if (!tripStops.find((stop) => stop.id === activeStopId)) {
      setActiveStopId(tripStops[0].id);
    }
  }, [tripStops, activeStopId]);

  useEffect(() => {
    const stored = window.localStorage.getItem(storageKey);
    if (!stored) return;
    try {
      setMemoryBook(JSON.parse(stored) as MemoryBook);
    } catch {
      setMemoryBook({});
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(storageKey, JSON.stringify(memoryBook));
  }, [memoryBook]);

  const loadRemoteMemories = useCallback(async () => {
    setSyncStatus("loading");
    try {
      const response = await fetch("/api/memories", { cache: "no-store" });
      if (!response.ok) throw new Error("Failed to load memories.");
      const payload = (await response.json()) as { mode?: string; memories?: unknown };
      if (isMemoryBook(payload.memories)) {
        const remoteMemories = payload.memories;
        setMemoryBook((current) => ({ ...current, ...remoteMemories }));
      }
      setSyncStatus(payload.mode === "supabase" ? "synced" : "local");
    } catch {
      setSyncStatus("offline");
    }
  }, []);

  useEffect(() => {
    void loadRemoteMemories();
    const timers = saveTimersRef.current;
    return () => {
      Object.values(timers).forEach((timer) => clearTimeout(timer));
    };
  }, [loadRemoteMemories]);

  const refreshAll = useCallback(() => {
    void loadRemoteMemories();
    void itinerary.refresh();
    void expenses.refresh();
    void vault.refresh();
    void packing.refresh();
  }, [loadRemoteMemories, itinerary, expenses, vault, packing]);

  const selectDay = (day: number) => {
    setActiveDay(day);
    if (day === 0) {
      if (tripStops[0]) setActiveStopId(tripStops[0].id);
      return;
    }
    const firstStop = tripStops.find((stop) => stop.day === day);
    if (firstStop) setActiveStopId(firstStop.id);
  };

  const handleSelectStop = useCallback((stop: TripStop) => {
    setActiveDay(stop.day);
    setActiveStopId(stop.id);
  }, []);

  // ---- Itinerary editor handlers ----

  const handleMapClick = useCallback(
    (lat: number, lng: number) => {
      if (!editMode) return;
      setPendingPin({ lat, lng });
    },
    [editMode]
  );

  const dayStopsInOrder = (day: number) => tripStops.filter((stop) => stop.day === day);

  const renumberAndSave = useCallback(
    async (orderedStops: TripStop[]) => {
      const rows: StopRow[] = orderedStops.map((stop, index) =>
        stopToRow(stop, "_", index * 100, false)
      );
      await itinerary.saveStops(rows);
    },
    [itinerary]
  );

  const moveStop = useCallback(
    async (stopId: string, direction: -1 | 1) => {
      const stop = tripStops.find((s) => s.id === stopId);
      if (!stop) return;
      const list = tripStops.filter((s) => s.day === stop.day);
      const index = list.findIndex((s) => s.id === stopId);
      const target = index + direction;
      if (target < 0 || target >= list.length) return;
      const reordered = list.slice();
      [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
      await renumberAndSave(reordered);
    },
    [tripStops, renumberAndSave]
  );

  const addStop = useCallback(async () => {
    const dayStops = dayStopsInOrder(activeDay);
    const anchor = dayStops[dayStops.length - 1] ?? activeStop;
    const id = newStopId();
    const newStop: TripStop = {
      id,
      day: activeDay,
      date: activeDayData?.date ?? "",
      time: "",
      title: "새 스톱",
      subtitle: "",
      nameZh: "",
      mrt: "",
      phrase: "",
      category: "sight",
      lat: anchor?.lat ?? 25.043,
      lng: anchor?.lng ?? 121.525,
      highlights: [],
      prompt: "",
      mapsQuery: ""
    };
    const ok = await itinerary.saveStop(newStop, dayStops.length * 100 + 50);
    if (ok) {
      setActiveStopId(id);
      setPlanView("edit");
    }
  }, [activeDay, activeStop, activeDayData, itinerary]);

  const archiveStop = useCallback(
    async (stopId: string) => {
      await itinerary.archiveStop(stopId);
      if (activeStopId === stopId) {
        const remaining = tripStops.filter((s) => s.id !== stopId);
        if (remaining[0]) setActiveStopId(remaining[0].id);
      }
    },
    [itinerary, activeStopId, tripStops]
  );

  const moveStopToDay = useCallback(
    async (stopId: string, day: number) => {
      const stop = tripStops.find((s) => s.id === stopId);
      if (!stop) return;
      const dayStops = tripStops.filter((s) => s.day === day);
      const moved = { ...stop, day, date: tripDays.find((d) => d.day === day)?.date ?? stop.date };
      await itinerary.saveStop(moved, dayStops.length * 100 + 50);
      setActiveDay(day);
    },
    [tripStops, tripDays, itinerary]
  );

  const saveStopFull = useCallback(
    async (stop: TripStop, plan: StopPlanMeta, sortOrder: number) => {
      const ok = await itinerary.saveStopFull(stop, plan, sortOrder);
      if (ok) setPendingPin(null);
      return ok;
    },
    [itinerary]
  );

  const saveMemory = (stopId: string, memory: Memory) => {
    if (saveTimersRef.current[stopId]) {
      clearTimeout(saveTimersRef.current[stopId]);
    }

    saveTimersRef.current[stopId] = setTimeout(async () => {
      setSyncStatus("saving");
      try {
        const response = await fetch("/api/memories", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ stopId, memory })
        });
        if (!response.ok) throw new Error("Failed to save memory.");
        const payload = (await response.json()) as { mode?: string };
        setSyncStatus(payload.mode === "supabase" ? "synced" : "local");
      } catch {
        setSyncStatus("offline");
      }
    }, 450);
  };

  const updateMemory = useCallback((stopId: string, patch: Partial<Memory>) => {
    setMemoryBook((current) => ({
      ...current,
      [stopId]: (() => {
        const nextMemory = {
          ...emptyMemory(),
          ...current[stopId],
          ...patch,
          updatedAt: new Date().toISOString()
        };
        saveMemory(stopId, nextMemory);
        return nextMemory;
      })()
    }));
  }, []);

  const exportMemories = () => {
    const payload = {
      title: "Y & S Taipei — Trip Diary",
      exportedAt: new Date().toISOString(),
      memories: memoryBook
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "taipei-trip-memories.json";
    link.click();
    URL.revokeObjectURL(url);
  };

  const importMemories = () => {
    setImportError("");
    try {
      const parsed = JSON.parse(importText) as unknown;
      const memories =
        parsed && typeof parsed === "object" && "memories" in parsed
          ? (parsed as { memories: unknown }).memories
          : parsed;
      if (!isMemoryBook(memories)) throw new Error("Invalid memory payload");
      setMemoryBook(memories);
      fetch("/api/memories", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memories })
      })
        .then((response) => {
          if (!response.ok) throw new Error("Failed to import memories.");
          return response.json() as Promise<{ mode?: string }>;
        })
        .then((payload) => setSyncStatus(payload.mode === "supabase" ? "synced" : "local"))
        .catch(() => setSyncStatus("offline"));
      setImportOpen(false);
      setImportText("");
    } catch {
      setImportError("내보낸 JSON 내용을 그대로 붙여넣어 주세요.");
    }
  };

  return (
    <main className={`app-shell app-shell--${mode}`}>
      <header className="topbar">
        <div className="brand">
          <span className="brand__mark" aria-label="대만국기 - 타이베이 여행">
            <TaiwanFlag className="brand__flag" />
            <span className="brand__mark-label">TAIPEI</span>
          </span>
          <div className="brand__copy">
            <strong>
              <span className="brand__zh">Y&amp;S</span>
              <span className="brand__en">台北</span>
            </strong>
            <small>
              <span className="brand__dot" aria-hidden="true" />
              5.15 — 5.18 · 西門町 NEON DIARY
            </small>
          </div>
        </div>
        <div className="topbar__spacer" />
        <SyncChip
          status={combineSync(syncStatus, itinerary.status)}
          onRefresh={refreshAll}
        />
        <nav className="top-actions" aria-label="모드 전환">
          {(Object.keys(modeLabels) as ShellMode[]).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={mode === m ? "nav-button nav-button--active" : "nav-button"}
            >
              {modeIcons[m]}
              {modeLabels[m]}
            </button>
          ))}
        </nav>
      </header>

      <DepartureWidget
        todayIso={todayIso()}
        startIso={dayIsoDates[1]}
        packingItems={packing.items}
        vaultItems={vault.items}
        travelers={travelers.book}
        onJump={setMode}
      />

      {mode === "plan" && (
        <PlanShell
          activeStop={activeStop}
          activeDay={activeDay}
          activeDayData={activeDayData}
          memoryBook={memoryBook}
          visibleStops={visibleStops}
          categoryFilter={categoryFilter}
          currentIndex={currentIndex}
          onCategoryFilterChange={setCategoryFilter}
          onSelectDay={selectDay}
          onSelectStop={(stop) => {
            handleSelectStop(stop);
            if (editMode) setPlanView("edit");
          }}
          onOpenInMemories={(stop) => {
            handleSelectStop(stop);
            setMemoryView("edit");
            setMode("memories");
          }}
          editMode={editMode}
          onToggleEdit={() => {
            setEditMode((v) => {
              const next = !v;
              if (next && activeDay === 0) setActiveDay(activeStop.day || 1);
              if (!next && planView === "edit") setPlanView("list");
              return next;
            });
            setPendingPin(null);
          }}
          pendingPin={pendingPin}
          onMapClick={handleMapClick}
          onMoveStop={moveStop}
          onArchiveStop={archiveStop}
          onAddStop={addStop}
          onMoveStopToDay={moveStopToDay}
          onSaveStopFull={saveStopFull}
          onSaveDay={itinerary.saveDay}
          onSavePlan={itinerary.savePlan}
          planView={planView}
          onPlanViewChange={setPlanView}
        />
      )}

      {mode === "today" && (
        <TodayMode
          activeStop={activeStop}
          memoryBook={memoryBook}
          todayTripDay={isoDayMap[todayIso()] ?? null}
          onSelectStop={handleSelectStop}
          onUpdateMemory={updateMemory}
        />
      )}

      {mode === "memories" && (
        <MemoriesShell
          activeStop={activeStop}
          memoryBook={memoryBook}
          query={query}
          onQueryChange={setQuery}
          onSelectStop={(stop) => {
            handleSelectStop(stop);
            setMemoryView("edit");
          }}
          onUpdateMemory={updateMemory}
          exportMemories={exportMemories}
          importOpen={importOpen}
          setImportOpen={setImportOpen}
          importText={importText}
          setImportText={setImportText}
          importError={importError}
          importMemories={importMemories}
          memoryView={memoryView}
          onMemoryViewChange={setMemoryView}
        />
      )}

      {mode === "vault" && (
        <VaultMode
          items={vault.items}
          onUpsert={vault.upsert}
          onRemove={vault.remove}
          packing={packing}
          travelers={travelers}
        />
      )}

      {mode === "ledger" && (
        <LedgerMode
          memoryBook={memoryBook}
          ledger={expenses.entries}
          todayTripDay={isoDayMap[todayIso()] ?? null}
          onAdd={expenses.addEntry}
          onRemove={expenses.removeEntry}
          onSelectStop={(stop) => {
            handleSelectStop(stop);
            setMemoryView("edit");
            setMode("memories");
          }}
        />
      )}

      {mode === "recap" && (
        <RecapMode
          memoryBook={memoryBook}
          ledgerEntries={expenses.entries}
          onExport={exportMemories}
          onSelectStop={(stop) => {
            handleSelectStop(stop);
            setMode("memories");
          }}
        />
      )}
    </main>
  );
}

function PlanShell({
  activeStop,
  activeDay,
  activeDayData,
  memoryBook,
  visibleStops,
  categoryFilter,
  currentIndex,
  onCategoryFilterChange,
  onSelectDay,
  onSelectStop,
  onOpenInMemories,
  editMode,
  onToggleEdit,
  pendingPin,
  onMapClick,
  onMoveStop,
  onArchiveStop,
  onAddStop,
  onMoveStopToDay,
  onSaveStopFull,
  onSaveDay,
  onSavePlan,
  planView,
  onPlanViewChange
}: {
  activeStop: TripStop;
  activeDay: number;
  activeDayData: TripDay;
  memoryBook: MemoryBook;
  visibleStops: TripStop[];
  categoryFilter: TripCategory | "all";
  currentIndex: number;
  onCategoryFilterChange: (category: TripCategory | "all") => void;
  onSelectDay: (day: number) => void;
  onSelectStop: (stop: TripStop) => void;
  onOpenInMemories: (stop: TripStop) => void;
  editMode: boolean;
  onToggleEdit: () => void;
  pendingPin: { lat: number; lng: number } | null;
  onMapClick: (lat: number, lng: number) => void;
  onMoveStop: (stopId: string, direction: -1 | 1) => void;
  onArchiveStop: (stopId: string) => void;
  onAddStop: () => void;
  onMoveStopToDay: (stopId: string, day: number) => void;
  onSaveStopFull: (stop: TripStop, plan: StopPlanMeta, sortOrder: number) => Promise<boolean>;
  onSaveDay: (day: TripDay, sortOrder: number) => Promise<boolean>;
  onSavePlan: (stopId: string, plan: StopPlanMeta) => Promise<boolean>;
  planView: PlanView;
  onPlanViewChange: (view: PlanView) => void;
}) {
  const { snapshot } = useItineraryContext();
  const tripDays = snapshot.days;
  const tripStops = snapshot.stops;
  const plans = snapshot.plans;
  const dayStops = tripStops.filter((stop) => stop.day === activeDay);
  const activeSortOrder = dayStops.findIndex((stop) => stop.id === activeStop.id) * 100;
  const activeDaySortOrder = tripDays.findIndex((d) => d.day === activeDayData.day);
  const confirm = useConfirm();
  const planViewTabs: { id: PlanView; label: string; icon: React.ReactNode }[] = [
    { id: "list", label: "목록", icon: <ListChecks size={14} /> },
    { id: "map", label: "지도", icon: <MapIcon size={14} /> },
    ...(editMode ? [{ id: "edit" as PlanView, label: "편집", icon: <Pencil size={14} /> }] : [])
  ];

  return (
    <>
      <nav className="workspace-tabs" aria-label="패널 전환">
        {planViewTabs.map((tab) => (
          <button
            key={tab.id}
            className={planView === tab.id ? "workspace-tab workspace-tab--active" : "workspace-tab"}
            onClick={() => onPlanViewChange(tab.id)}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </nav>

      <section className={`workspace workspace--view-${planView}`}>
        <aside className="planner-panel" aria-label="일정 목록">
          <div className="planner-panel__head">
            <div className="day-strip" role="tablist" aria-label="날짜 선택">
              {!editMode && (
                <button
                  role="tab"
                  aria-selected={activeDay === 0}
                  className={activeDay === 0 ? "day-pill day-pill--all day-pill--active" : "day-pill day-pill--all"}
                  onClick={() => onSelectDay(0)}
                >
                  <span>전체</span>
                  <strong>{tripDays.length}일</strong>
                </button>
              )}
              {tripDays.map((day) => (
                <button
                  key={day.day}
                  role="tab"
                  aria-selected={activeDay === day.day}
                  className={activeDay === day.day ? "day-pill day-pill--active" : "day-pill"}
                  onClick={() => onSelectDay(day.day)}
                >
                  <span>Day {day.day}</span>
                  <strong>{day.date}</strong>
                  <DayWeatherBadge isoDate={dayIsoDates[day.day] ?? null} />
                </button>
              ))}
            </div>
            <button
              className={editMode ? "edit-toggle edit-toggle--on" : "edit-toggle"}
              onClick={onToggleEdit}
              title="일정 편집"
            >
              <Pencil size={14} />
              {editMode ? "편집 종료" : "편집"}
            </button>
          </div>

          {editMode ? (
            <DayEditor day={activeDayData} sortOrder={activeDaySortOrder} onSave={onSaveDay} />
          ) : activeDay === 0 ? (
            <div className="route-head">
              <p>FULL ITINERARY</p>
              <h1>전체 일정 · {tripDays.length}일</h1>
              <span>{tripStops.length}개 스톱 · 날짜를 눌러 그날만 볼 수 있어요</span>
            </div>
          ) : (
            <div className="route-head">
              <p>{activeDayData.mood}</p>
              <h1>{activeDayData.title}</h1>
              <span>{activeDayData.summary}</span>
            </div>
          )}

          {!editMode && (
            <div className="category-strip" aria-label="카테고리 필터">
              <button
                className={categoryFilter === "all" ? "filter-chip filter-chip--active" : "filter-chip"}
                onClick={() => onCategoryFilterChange("all")}
              >
                전체
              </button>
              {(Object.keys(categoryLabels) as TripCategory[]).map((category) => (
                <button
                  key={category}
                  className={categoryFilter === category ? "filter-chip filter-chip--active" : "filter-chip"}
                  onClick={() => onCategoryFilterChange(category)}
                >
                  {categoryIcon(category, 14)}
                  {categoryLabels[category]}
                </button>
              ))}
            </div>
          )}

          <div className="stop-list">
            {editMode
              ? dayStops.map((stop, index, arr) => {
                  const plan = getPlan(plans, stop.id);
                  return (
                    <div
                      key={stop.id}
                      className={activeStop.id === stop.id ? "stop-row stop-row--edit stop-row--active" : "stop-row stop-row--edit"}
                    >
                      <span className="stop-row__reorder">
                        <button onClick={() => onMoveStop(stop.id, -1)} disabled={index === 0} title="위로">
                          <ChevronUp size={14} />
                        </button>
                        <button onClick={() => onMoveStop(stop.id, 1)} disabled={index === arr.length - 1} title="아래로">
                          <ChevronDown size={14} />
                        </button>
                      </span>
                      <button className="stop-row__main stop-row__main--edit" onClick={() => onSelectStop(stop)}>
                        <strong>{stop.time || "—"} {stop.title}</strong>
                        <small>{priorityLabels[plan.priority]} · {plan.durationMinutes}분 · {categoryLabels[stop.category]}</small>
                      </button>
                      <select
                        className="stop-row__priority"
                        value={plan.priority}
                        onChange={(event) => {
                          void onSavePlan(stop.id, { ...plan, priority: event.target.value as TripPriority });
                        }}
                        title="우선순위"
                      >
                        {(Object.keys(priorityLabels) as TripPriority[]).map((priority) => (
                          <option key={priority} value={priority}>{priorityLabels[priority]}</option>
                        ))}
                      </select>
                      <button
                        className="stop-row__archive"
                        onClick={async () => {
                          const ok = await confirm({
                            title: `"${stop.title}" 스톱을 일정에서 뺄까요?`,
                            description: "스톱만 일정에서 사라지고, 기록·사진·코멘트는 보존돼요.",
                            confirmLabel: "제거"
                          });
                          if (ok) onArchiveStop(stop.id);
                        }}
                        title="제거"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  );
                })
              : visibleStops.map((stop, index, arr) => {
                  const memory = getStopMemory(memoryBook, stop.id);
                  const plan = getPlan(plans, stop.id);
                  const showDivider = activeDay === 0 && (index === 0 || arr[index - 1].day !== stop.day);
                  return (
                    <div key={stop.id} className="stop-list__group">
                      {showDivider && (
                        <div className="day-divider">
                          <span>Day {stop.day}</span>
                          <strong>{tripDays.find((d) => d.day === stop.day)?.date ?? ""}</strong>
                        </div>
                      )}
                      <button
                        className={activeStop.id === stop.id ? "stop-row stop-row--active" : "stop-row"}
                        onClick={() => onOpenInMemories(stop)}
                      >
                        <span className="stop-row__time">{stop.time}</span>
                        <span className="stop-row__main">
                          <strong>{stop.title}</strong>
                          <small>
                            {priorityLabels[plan.priority]} · {plan.durationMinutes}분 · {statusLabels[memory.status]}
                            {plan.openingHours && ` · ${plan.openingHours}`}
                            {plan.bookingStatus && ` · ${plan.bookingStatus}`}
                            {plan.riskLevel && plan.riskLevel !== "low" && ` · ${plan.riskLevel === "high" ? "리스크 높음" : "주의"}`}
                            {memory.comments.length > 0 && ` · 💬${memory.comments.length}`}
                          </small>
                        </span>
                        <span className="stop-row__status" style={{ ["--cat" as string]: categoryColors[stop.category] }}>
                          {memory.status === "done" ? <Check size={14} /> : categoryIcon(stop.category, 14)}
                        </span>
                      </button>
                    </div>
                  );
                })}
            {editMode && (
              <button className="stop-add" onClick={onAddStop}>
                <Plus size={16} />
                새 스톱 추가 (Day {activeDay})
              </button>
            )}
            {!editMode && visibleStops.length === 0 && (
              <div className="empty-state">
                <Search size={18} />
                조건에 맞는 장소가 없습니다.
              </div>
            )}
          </div>
        </aside>

        <section className="map-stage" aria-label="지도">
          <MapView
            activeStop={activeStop}
            onSelectStop={onSelectStop}
            onMapClick={editMode ? onMapClick : undefined}
            pin={editMode ? pendingPin : null}
          />
          <div className="map-floating map-floating--top">
            <div>
              <span>Route {activeDay}{editMode ? " · 편집 중" : ""}</span>
              <strong>{activeDayData.date}</strong>
            </div>
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${activeStop.lat},${activeStop.lng}&travelmode=walking`}
              target="_blank"
              rel="noreferrer"
              title="여기로 길찾기 (도보)"
            >
              <Navigation size={18} />
            </a>
          </div>
          <div className="map-floating map-floating--bottom">
            <Clock size={17} />
            <span>
              {editMode
                ? "지도를 클릭하면 선택된 스톱의 좌표가 바뀝니다"
                : `${currentIndex}/${tripStops.length} · ${activeStop.time} ${activeStop.title}`}
            </span>
          </div>
        </section>

        <aside className="detail-panel" aria-label="스톱 편집">
          {editMode && (
            <div className="panel-stack">
              <StopEditor
                stop={activeStop}
                plan={getPlan(plans, activeStop.id)}
                sortOrder={activeSortOrder < 0 ? 0 : activeSortOrder}
                days={tripDays}
                onSave={onSaveStopFull}
                onArchive={async (stopId) => {
                  onArchiveStop(stopId);
                  return true;
                }}
                onMoveToDay={onMoveStopToDay}
                pendingPin={pendingPin}
              />
            </div>
          )}
        </aside>
      </section>
    </>
  );
}

function MemoriesShell({
  activeStop,
  memoryBook,
  query,
  onQueryChange,
  onSelectStop,
  onUpdateMemory,
  exportMemories,
  importOpen,
  setImportOpen,
  importText,
  setImportText,
  importError,
  importMemories,
  memoryView,
  onMemoryViewChange
}: {
  activeStop: TripStop;
  memoryBook: MemoryBook;
  query: string;
  onQueryChange: (value: string) => void;
  onSelectStop: (stop: TripStop) => void;
  onUpdateMemory: (stopId: string, patch: Partial<Memory>) => void;
  exportMemories: () => void;
  importOpen: boolean;
  setImportOpen: (open: boolean) => void;
  importText: string;
  setImportText: (text: string) => void;
  importError: string;
  importMemories: () => void;
  memoryView: MemoryView;
  onMemoryViewChange: (view: MemoryView) => void;
}) {
  const { snapshot } = useItineraryContext();
  const tripStops = snapshot.stops;
  const filtered = tripStops.filter((stop) => {
    if (!query.trim()) return true;
    const memory = getStopMemory(memoryBook, stop.id);
    const haystack =
      `${stop.title} ${stop.subtitle} ${memory.note} ${memory.comments.map((c) => c.text).join(" ")}`.toLowerCase();
    return haystack.includes(query.trim().toLowerCase());
  });
  const activeIndex = tripStops.findIndex((s) => s.id === activeStop.id);
  const prevStop = activeIndex > 0 ? tripStops[activeIndex - 1] : null;
  const nextStop = activeIndex >= 0 && activeIndex < tripStops.length - 1 ? tripStops[activeIndex + 1] : null;

  return (
    <section className={`memories-stage memories-stage--view-${memoryView}`} aria-label="기록 모드">
      <aside className="memories-list" aria-label="기록 목록">
        <header className="memories-list__head">
          <div>
            <span>MEMORY BOOK</span>
            <h2>여행 기록</h2>
          </div>
          <div className="memories-list__actions">
            <button className="icon-button" onClick={exportMemories} title="내보내기">
              <Download size={16} />
            </button>
            <button
              className="icon-button"
              onClick={() => setImportOpen(!importOpen)}
              title="가져오기"
            >
              <Import size={16} />
            </button>
          </div>
        </header>
        <div className="memories-search">
          <Search size={15} />
          <input
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="제목·메모·코멘트 검색"
          />
        </div>
        {importOpen && (
          <div className="import-box">
            <textarea
              value={importText}
              onChange={(event) => setImportText(event.target.value)}
              placeholder="taipei-trip-memories.json 내용을 붙여넣기"
            />
            <span>{importError}</span>
            <button className="wide-link wide-link--primary" onClick={importMemories}>
              <Save size={17} />
              적용
            </button>
          </div>
        )}
        <div className="memories-list__items">
          {filtered.map((stop) => {
            const memory = getStopMemory(memoryBook, stop.id);
            return (
              <button
                key={stop.id}
                className={
                  activeStop.id === stop.id
                    ? "memory-item memory-item--active"
                    : "memory-item"
                }
                onClick={() => onSelectStop(stop)}
              >
                <span className="memory-item__top">
                  <strong>{stop.title}</strong>
                  <small>Day {stop.day}</small>
                </span>
                <span className="memory-item__text">{memory.note || stop.prompt}</span>
                {memory.comments.length > 0 && (
                  <span className="memory-item__comments">
                    {memory.comments.slice(-2).map((c) => (
                      <em key={c.id} className={`memory-item__comment memory-item__comment--${c.author}`}>
                        <b>{authorLabels[c.author]}</b> {c.text}
                      </em>
                    ))}
                    {memory.comments.length > 2 && (
                      <em className="memory-item__comment-more">+{memory.comments.length - 2}개 더</em>
                    )}
                  </span>
                )}
                <span className="memory-item__meta">
                  {statusLabels[memory.status]}
                  <span>{combinedRating(memory) ? `★ ${combinedRating(memory)}` : "별점 전"}</span>
                  {memory.comments.length > 0 && <span>💬 {memory.comments.length}</span>}
                  {memory.expenseAmount > 0 && <span>TWD {memory.expenseAmount.toLocaleString()}</span>}
                </span>
                {memory.photoUrl && (
                  <span className="photo-link">
                    <Camera size={14} />
                    사진 링크 있음
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </aside>

      <section className="memories-editor" aria-label="기록 작성">
        <header className="memories-editor__head">
          <div className="memories-editor__nav">
            <button className="memories-editor__back" onClick={() => onMemoryViewChange("list")}>
              ← 목록
            </button>
            <div className="memories-editor__pager">
              <button
                type="button"
                className="memories-editor__step"
                onClick={() => prevStop && onSelectStop(prevStop)}
                disabled={!prevStop}
                aria-label="이전 스톱"
                title={prevStop ? `← ${prevStop.title}` : "이전 스톱 없음"}
              >
                <ChevronUp size={14} style={{ transform: "rotate(-90deg)" }} />
              </button>
              <span className="memories-editor__step-count">
                {activeIndex + 1} / {tripStops.length}
              </span>
              <button
                type="button"
                className="memories-editor__step"
                onClick={() => nextStop && onSelectStop(nextStop)}
                disabled={!nextStop}
                aria-label="다음 스톱"
                title={nextStop ? `${nextStop.title} →` : "다음 스톱 없음"}
              >
                <ChevronUp size={14} style={{ transform: "rotate(90deg)" }} />
              </button>
            </div>
          </div>
          <span>{activeStop.date} · {activeStop.time}</span>
          <h2>{activeStop.title}</h2>
          <p>{activeStop.subtitle}</p>
        </header>
        <MemoryEditor
          stop={activeStop}
          memory={getStopMemory(memoryBook, activeStop.id)}
          onChange={(patch) => onUpdateMemory(activeStop.id, patch)}
        />
        <a
          className="wide-link"
          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(activeStop.mapsQuery)}`}
          target="_blank"
          rel="noreferrer"
        >
          <ExternalLink size={17} />
          Google Maps에서 열기
        </a>
      </section>
    </section>
  );
}

function fmtCountdown(ms: number): string {
  const mins = Math.max(0, Math.floor(ms / 60000));
  if (mins < 60) return `${mins}분 후`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}시간 후`;
  const days = Math.floor(hours / 24);
  const remHours = hours % 24;
  return remHours > 0 ? `${days}일 ${remHours}시간 후` : `${days}일 후`;
}

function VaultMode({
  items,
  onUpsert,
  onRemove,
  packing,
  travelers
}: {
  items: VaultItem[];
  onUpsert: (item: VaultItem) => void;
  onRemove: (id: string) => void;
  packing: ReturnType<typeof usePacking>;
  travelers: ReturnType<typeof useTravelers>;
}) {
  const [draft, setDraft] = useState<VaultItem>(() => emptyVaultItem());
  const confirm = useConfirm();
  const [filter, setFilter] = useState<VaultKind | "all">("all");
  const [addOpen, setAddOpen] = useState(false);
  const formRef = useRef<HTMLDivElement | null>(null);
  const editing = items.some((item) => item.id === draft.id);
  const filtered = items
    .filter((item) => filter === "all" || item.kind === filter)
    .slice()
    .sort((a, b) => (a.startAt || "9999").localeCompare(b.startAt || "9999"));
  const pendingCount = items.filter((item) => item.status === "pending").length;
  const totalReservationAmount = items.reduce((sum, item) => sum + item.amount, 0);

  const nowMs = Date.now();
  const upcoming = items
    .filter((item) => item.startAt && item.status !== "cancelled")
    .map((item) => ({ item, ms: new Date(item.startAt).getTime() - nowMs }))
    .filter((entry) => Number.isFinite(entry.ms) && entry.ms > 0)
    .sort((a, b) => a.ms - b.ms);
  const imminentMs = 24 * 60 * 60 * 1000;

  const updateDraft = <K extends keyof VaultItem>(key: K, value: VaultItem[K]) => {
    setDraft((current) => ({ ...current, [key]: value }));
  };

  const resetForm = () => {
    setDraft(emptyVaultItem());
    setAddOpen(false);
  };

  const submit = () => {
    if (!draft.title.trim()) return;
    onUpsert({ ...draft, title: draft.title.trim() });
    resetForm();
  };

  const startEdit = (item: VaultItem) => {
    setDraft(item);
    setAddOpen(true);
    requestAnimationFrame(() => formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  };

  return (
    <section className="vault-stage">
      <header className="vault-head">
        <div>
          <span><Luggage size={13} /> 여행 준비</span>
          <h1>준비물 · 예약 · 정보</h1>
          <p>항공·숙소·예약 보관함, 챙길 준비물 체크리스트, 타이베이 현지 정보를 한 곳에.</p>
        </div>
        <div className="vault-stats">
          <div><span>예약·문서</span><strong>{items.length}</strong></div>
          <div><span>확인 필요</span><strong>{pendingCount}</strong></div>
          <div><span>준비물 챙김</span><strong>{packing.items.filter((i) => i.packed).length}/{packing.items.length}</strong></div>
        </div>
      </header>

      <TravelerCards book={travelers.book} onSave={travelers.saveOne} />

      {upcoming.length > 0 && (
        <div className="vault-reminders">
          <header><Timer size={13} /> 다가오는 예약</header>
          <ul>
            {upcoming.slice(0, 4).map(({ item, ms }) => (
              <li key={item.id} className={ms <= imminentMs ? "vault-reminder vault-reminder--soon" : "vault-reminder"}>
                <span className="vault-reminder__kind">{vaultKindLabels[item.kind]}</span>
                <span className="vault-reminder__title">{item.title}</span>
                <span className="vault-reminder__when">
                  {fmtCountdown(ms)}
                  <em>{item.startAt.replace("T", " ")}</em>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="vault-add-bar" ref={formRef}>
        <button
          className={addOpen ? "vault-add-toggle vault-add-toggle--open" : "vault-add-toggle"}
          onClick={() => (addOpen ? resetForm() : setAddOpen(true))}
        >
          {addOpen ? <ChevronUp size={16} /> : <Plus size={16} />}
          {addOpen ? (editing ? "수정 중 — 닫기" : "추가 닫기") : "예약·문서 추가"}
        </button>
      </div>

      {addOpen && (
        <section className="vault-add">
          <label className="field field--wide">
            <span>제목</span>
            <input value={draft.title} onChange={(e) => updateDraft("title", e.target.value)} placeholder="예: 카발란 투어 예약" autoFocus />
          </label>
          <div className="vault-add__grid">
            <label className="field">
              <span>종류</span>
              <select value={draft.kind} onChange={(e) => updateDraft("kind", e.target.value as VaultKind)}>
                {(Object.keys(vaultKindLabels) as VaultKind[]).map((kind) => (
                  <option key={kind} value={kind}>{vaultKindLabels[kind]}</option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>상태</span>
              <select value={draft.status} onChange={(e) => updateDraft("status", e.target.value as VaultItem["status"])}>
                {(Object.keys(vaultStatusLabels) as VaultItem["status"][]).map((status) => (
                  <option key={status} value={status}>{vaultStatusLabels[status]}</option>
                ))}
              </select>
            </label>
          </div>
          <label className="field field--wide">
            <span>일시</span>
            <input type="datetime-local" value={draft.startAt} onChange={(e) => updateDraft("startAt", e.target.value)} />
          </label>
          {draft.kind === "flight" && (
            <label className="field field--wide">
              <span>항공편 번호 (실시간 상태 조회용)</span>
              <input
                value={draft.flightNo}
                onChange={(e) => updateDraft("flightNo", e.target.value)}
                placeholder="예: KE691 / CI160 / BR205"
                autoCapitalize="characters"
              />
            </label>
          )}
          <div className="vault-add__grid">
            <label className="field">
              <span>업체/앱</span>
              <input value={draft.provider} onChange={(e) => updateDraft("provider", e.target.value)} placeholder="Booking, KKday, 항공사" />
            </label>
            <label className="field">
              <span>예약번호</span>
              <input value={draft.confirmation} onChange={(e) => updateDraft("confirmation", e.target.value)} />
            </label>
          </div>
          <div className="vault-add__grid">
            <label className="field">
              <span>담당</span>
              <select value={draft.owner} onChange={(e) => updateDraft("owner", e.target.value as VaultItem["owner"])}>
                {(Object.keys(vaultOwnerLabels) as VaultItem["owner"][]).map((owner) => (
                  <option key={owner} value={owner}>{vaultOwnerLabels[owner]}</option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>금액 TWD</span>
              <input
                inputMode="numeric"
                placeholder="0"
                value={draft.amount ? String(draft.amount) : ""}
                onChange={(e) => updateDraft("amount", Number(e.target.value.replace(/[^0-9]/g, "")) || 0)}
              />
            </label>
          </div>
          <label className="field field--wide">
            <span>장소</span>
            <input value={draft.location} onChange={(e) => updateDraft("location", e.target.value)} placeholder="공항 터미널, 호텔 주소, 미팅 포인트" />
          </label>
          <label className="field field--wide">
            <span>예약/문서 링크</span>
            <input value={draft.link} onChange={(e) => updateDraft("link", e.target.value)} placeholder="예약 페이지, Google Drive, 메일 링크" />
          </label>
          <VaultFileField value={draft.documentUrl} itemId={draft.id} onChange={(url) => updateDraft("documentUrl", url)} />
          <label className="field field--wide">
            <span>메모</span>
            <textarea value={draft.notes} onChange={(e) => updateDraft("notes", e.target.value)} placeholder="체크인 조건, 준비물, 취소 규정, 현장 제시 방법" />
          </label>
          <div className="vault-add__actions">
            {editing && (
              <button className="wide-link" onClick={resetForm}>취소</button>
            )}
            <button className="wide-link wide-link--primary" onClick={submit} disabled={!draft.title.trim()}>
              <Save size={16} />
              {editing ? "수정 저장" : "보관"}
            </button>
          </div>
        </section>
      )}

      {items.length > 0 && (
        <div className="category-strip category-strip--vault">
          <button className={filter === "all" ? "filter-chip filter-chip--active" : "filter-chip"} onClick={() => setFilter("all")}>전체</button>
          {(Object.keys(vaultKindLabels) as VaultKind[])
            .filter((kind) => items.some((item) => item.kind === kind))
            .map((kind) => (
              <button key={kind} className={filter === kind ? "filter-chip filter-chip--active" : "filter-chip"} onClick={() => setFilter(kind)}>
                {vaultKindLabels[kind]}
              </button>
            ))}
        </div>
      )}

      <section className="vault-list">
        {filtered.length === 0 && (
          <div className="empty-state">
            <FolderLock size={18} />
            {items.length === 0 ? "위 ‘예약·문서 추가’로 항공권·숙소·예약을 모아두세요." : "이 종류에 해당하는 항목이 없습니다."}
          </div>
        )}
        {filtered.map((item) => (
          <article key={item.id} className={`vault-card vault-card--${item.status}`}>
            <header>
              <span>{vaultKindLabels[item.kind]}</span>
              <strong>{item.title}</strong>
              <em>{vaultStatusLabels[item.status]}</em>
            </header>
            <div className="vault-card__meta">
              {item.startAt && <span>{item.startAt.replace("T", " ")}</span>}
              {item.flightNo && <span>✈ {item.flightNo}</span>}
              {item.provider && <span>{item.provider}</span>}
              {item.confirmation && <span>예약번호 {item.confirmation}</span>}
              <span>{vaultOwnerLabels[item.owner]}</span>
              {item.amount > 0 && <span>TWD {item.amount.toLocaleString()}</span>}
            </div>
            {item.location && <p className="vault-card__loc">{item.location}</p>}
            {item.notes && <p>{item.notes}</p>}
            {item.kind === "flight" && item.flightNo && <FlightStatusBadge flightNo={item.flightNo} />}
            <div className="vault-card__actions">
              {item.link && (
                <a href={item.link} target="_blank" rel="noreferrer">
                  <ExternalLink size={14} />
                  열기
                </a>
              )}
              {item.documentUrl && (
                <a href={item.documentUrl} target="_blank" rel="noreferrer">
                  <Paperclip size={14} />
                  첨부
                </a>
              )}
              <button onClick={() => startEdit(item)}>
                <Pencil size={14} />
                수정
              </button>
              <button
                onClick={async () => {
                  const ok = await confirm({
                    title: `"${item.title || "이 항목"}"을(를) 삭제할까요?`,
                    description: `${vaultKindLabels[item.kind]}${item.provider ? ` · ${item.provider}` : ""}${item.confirmation ? ` · 예약번호 ${item.confirmation}` : ""}`
                  });
                  if (ok) onRemove(item.id);
                }}
              >
                <Trash2 size={14} />
                삭제
              </button>
            </div>
          </article>
        ))}
      </section>

      <PackingList
        items={packing.items}
        onToggle={packing.toggle}
        onAdd={packing.add}
        onRemove={packing.remove}
        onReset={packing.resetToPreset}
      />

      <TaipeiInfo />
    </section>
  );
}

function SyncChip({
  status,
  onRefresh
}: {
  status: CombinedSync;
  onRefresh: () => void;
}) {
  const meta = combinedSyncMeta[status];
  const icon =
    status === "saving" || status === "loading" ? (
      <Loader2 size={13} className="sync-chip__spin" />
    ) : status === "offline" ? (
      <CloudOff size={13} />
    ) : status === "local" ? (
      <RefreshCw size={13} />
    ) : (
      <Cloud size={13} />
    );
  return (
    <button
      className={`sync-chip sync-chip--${status}`}
      onClick={onRefresh}
      title="새로고침 (기기 간 동기화)"
    >
      {icon}
      <span>{meta.label}</span>
    </button>
  );
}

function MemoryEditor({
  stop,
  memory,
  onChange
}: {
  stop: TripStop;
  memory: Memory;
  onChange: (patch: Partial<Memory>) => void;
}) {
  return (
    <div className="memory-editor">
      <div className="segment-group" aria-label={`${stop.title} 진행 상태`}>
        {(Object.keys(statusLabels) as TripStatus[]).map((status) => (
          <button
            key={status}
            className={memory.status === status ? "segment segment--active" : "segment"}
            onClick={() =>
              onChange({
                status,
                visited: status === "done"
              })
            }
          >
            {statusLabels[status]}
          </button>
        ))}
      </div>
      <div className="rating-pair">
        {([
          ["youngha", "영하", memory.ratingY, (v: number) => onChange({ ratingY: v })],
          ["sohyun", "소현", memory.ratingS, (v: number) => onChange({ ratingS: v })]
        ] as const).map(([key, label, value, set]) => (
          <div key={key} className={`rating-line rating-line--${key}`}>
            <span className="rating-line__who">{label}</span>
            <div className="rating" role="group" aria-label={`${label} ${stop.title} 별점`}>
              {[1, 2, 3, 4, 5].map((score) => (
                <button
                  key={score}
                  className={score <= value ? "rating__star rating__star--on" : "rating__star"}
                  onClick={() => set(score === value ? 0 : score)}
                  title={`${score}점`}
                >
                  <Star size={18} fill={score <= value ? "currentColor" : "none"} />
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
      <CommentThread
        comments={memory.comments}
        onAdd={(comment) => onChange({ comments: [...memory.comments, comment] })}
        onRemove={(id) => onChange({ comments: memory.comments.filter((c) => c.id !== id) })}
      />
      <label className="field">
        <span>공동 메모</span>
        <textarea
          value={memory.note}
          onChange={(event) => onChange({ note: event.target.value })}
          placeholder="맛, 분위기, 다음에 또 올 이유 (둘이 같이 정리하는 메모)"
        />
      </label>
      <PhotoUploader
        stopId={stop.id}
        photos={memory.photos}
        onChange={(next) => onChange({ photos: next })}
      />
      <label className="field">
        <span>사진 링크 (외부)</span>
        <input
          value={memory.photoUrl}
          onChange={(event) => onChange({ photoUrl: event.target.value })}
          placeholder="Google Photos, iCloud, Instagram 링크 (선택)"
        />
      </label>
      <div className="expense-row expense-row--four">
        <label className="field">
          <span>지출 TWD</span>
          <input
            inputMode="numeric"
            value={memory.expenseAmount ? String(memory.expenseAmount) : ""}
            onChange={(event) =>
              onChange({ expenseAmount: Number(event.target.value.replace(/[^0-9]/g, "")) || 0 })
            }
            placeholder="0"
          />
        </label>
        <label className="field">
          <span>분류</span>
          <select
            value={memory.expenseCategory}
            onChange={(event) =>
              onChange({ expenseCategory: event.target.value as ExpenseCategory })
            }
          >
            {(Object.keys(expenseCategoryLabels) as ExpenseCategory[]).map((category) => (
              <option key={category} value={category}>
                {expenseCategoryLabels[category]}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>결제자</span>
          <select
            value={memory.expensePayer}
            onChange={(event) =>
              onChange({ expensePayer: event.target.value as ExpensePayer })
            }
          >
            {(Object.keys(expensePayerLabels) as ExpensePayer[]).map((payer) => (
              <option key={payer} value={payer}>
                {payer === "none" ? "미지정" : expensePayerLabels[payer]}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>수단</span>
          <select
            value={memory.expenseMethod}
            onChange={(event) => onChange({ expenseMethod: event.target.value as ExpenseMethod })}
          >
            {(Object.keys(expenseMethodLabels) as ExpenseMethod[]).map((method) => (
              <option key={method} value={method}>
                {expenseMethodLabels[method]}
              </option>
            ))}
          </select>
        </label>
      </div>
      {memory.status === "skipped" && (
        <label className="field">
          <span>스킵 이유</span>
          <input
            value={memory.skippedReason}
            onChange={(event) => onChange({ skippedReason: event.target.value })}
            placeholder="비, 피곤함, 웨이팅, 동선 변경 등"
          />
        </label>
      )}
    </div>
  );
}

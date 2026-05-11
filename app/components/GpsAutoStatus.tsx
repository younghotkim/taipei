"use client";

import { useEffect, useRef, useState } from "react";
import { Compass, LocateFixed, LocateOff } from "lucide-react";
import { distanceMeters, watchPosition } from "@/lib/integrations";
import { tripStops, type TripStop } from "@/lib/trip-data";
import { getStopMemory, type Memory, type MemoryBook } from "@/lib/memory-types";

const ENABLED_KEY = "taipei-trip-gps-auto";
const ARRIVAL_RADIUS_METERS = 80;
const DEPARTURE_RADIUS_METERS = 160;

export function GpsAutoStatus({
  memoryBook,
  onUpdateMemory,
  onSelectStop
}: {
  memoryBook: MemoryBook;
  onUpdateMemory: (stopId: string, patch: Partial<Memory>) => void;
  onSelectStop: (stop: TripStop) => void;
}) {
  const [enabled, setEnabled] = useState(false);
  const [nearest, setNearest] = useState<{ stop: TripStop; distance: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const lastStopRef = useRef<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem(ENABLED_KEY);
    if (stored === "1") setEnabled(true);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(ENABLED_KEY, enabled ? "1" : "0");
  }, [enabled]);

  useEffect(() => {
    if (!enabled) {
      setNearest(null);
      setError(null);
      return;
    }
    const memoryBookSnapshot = memoryBook;
    const handle = watchPosition(
      (position) => {
        setError(null);
        const ranked = tripStops
          .map((stop) => ({ stop, distance: distanceMeters(position, stop) }))
          .sort((a, b) => a.distance - b.distance);
        const closest = ranked[0];
        setNearest(closest);

        if (closest.distance <= ARRIVAL_RADIUS_METERS) {
          const memory = getStopMemory(memoryBookSnapshot, closest.stop.id);
          if (memory.status !== "done" && lastStopRef.current !== closest.stop.id) {
            onUpdateMemory(closest.stop.id, { status: "going" });
            onSelectStop(closest.stop);
            lastStopRef.current = closest.stop.id;
          }
        } else if (lastStopRef.current && closest.distance > DEPARTURE_RADIUS_METERS) {
          const last = tripStops.find((stop) => stop.id === lastStopRef.current);
          if (last) {
            const memory = getStopMemory(memoryBookSnapshot, last.id);
            if (memory.status === "going") {
              onUpdateMemory(last.id, { status: "done", visited: true });
            }
          }
          lastStopRef.current = null;
        }
      },
      (message) => setError(message)
    );
    return () => handle.stop();
  }, [enabled, memoryBook, onUpdateMemory, onSelectStop]);

  return (
    <div className={enabled ? "gps-auto gps-auto--on" : "gps-auto"}>
      <header className="gps-auto__head">
        {enabled ? <LocateFixed size={16} /> : <LocateOff size={16} />}
        <strong>GPS 자동 상태</strong>
        <label className="gps-auto__toggle">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(event) => setEnabled(event.target.checked)}
          />
          <span>{enabled ? "켜짐" : "꺼짐"}</span>
        </label>
      </header>
      {enabled && (
        <div className="gps-auto__body">
          <Compass size={14} />
          {nearest ? (
            <span>
              가장 가까운 스톱: <strong>{nearest.stop.title}</strong> · {Math.round(nearest.distance)}m
            </span>
          ) : (
            <span>위치를 가져오는 중…</span>
          )}
        </div>
      )}
      {error && <div className="gps-auto__error">위치 권한 오류: {error}</div>}
    </div>
  );
}

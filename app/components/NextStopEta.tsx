"use client";

import { useEffect, useState } from "react";
import { Footprints, Loader2, TrainFront } from "lucide-react";
import {
  durationLabel,
  fetchDirections,
  type DirectionsResult
} from "@/lib/integrations";
import type { TripStop } from "@/lib/trip-data";

export function NextStopEta({
  from,
  to
}: {
  from: TripStop;
  to: TripStop | null;
}) {
  const [walking, setWalking] = useState<DirectionsResult | null>(null);
  const [transit, setTransit] = useState<DirectionsResult | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!to) {
      setWalking(null);
      setTransit(null);
      return;
    }
    const controller = new AbortController();
    setLoading(true);
    Promise.all([
      fetchDirections({ lat: from.lat, lng: from.lng }, { lat: to.lat, lng: to.lng }, "walking", controller.signal),
      fetchDirections({ lat: from.lat, lng: from.lng }, { lat: to.lat, lng: to.lng }, "transit", controller.signal)
    ]).then(([w, t]) => {
      if (controller.signal.aborted) return;
      setWalking(w);
      setTransit(t);
      setLoading(false);
    });
    return () => controller.abort();
  }, [from.id, to?.id, from.lat, from.lng, to?.lat, to?.lng]);

  if (!to) return null;

  return (
    <div className="next-eta">
      {loading && (
        <div className="next-eta__loading">
          <Loader2 size={14} className="weather-bar__spinner" />
          <span>경로 계산 중…</span>
        </div>
      )}
      {(walking || transit) && (
        <div className="next-eta__chips">
          {walking && (
            <span className="next-eta__chip">
              <Footprints size={14} />
              {durationLabel(walking.durationSeconds)}
              <small>{Math.round(walking.distanceMeters / 100) / 10}km</small>
            </span>
          )}
          {transit && (
            <span className="next-eta__chip">
              <TrainFront size={14} />
              {durationLabel(transit.durationSeconds)}
              {transit.summary && <small>{transit.summary}</small>}
            </span>
          )}
        </div>
      )}
      {!loading && !walking && !transit && (
        <div className="next-eta__missing">경로 정보 없음 (Directions API 활성화 필요)</div>
      )}
    </div>
  );
}

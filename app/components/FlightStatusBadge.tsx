"use client";

import { useState } from "react";
import { Loader2, Plane, RefreshCw } from "lucide-react";
import {
  fmtFlightTime,
  flightStateLabels,
  type FlightStatusResponse,
  type FlightStatus
} from "@/lib/flight-status";

export function FlightStatusBadge({ flightNo }: { flightNo: string }) {
  const [state, setState] = useState<"idle" | "loading" | "done">("idle");
  const [data, setData] = useState<FlightStatus | null>(null);
  const [message, setMessage] = useState<string>("");

  const load = async () => {
    setState("loading");
    setMessage("");
    try {
      const res = await fetch(`/api/flight-status?flight=${encodeURIComponent(flightNo)}`, { cache: "no-store" });
      const payload = (await res.json()) as FlightStatusResponse;
      if (!payload.configured) {
        setMessage("항공 API 미설정 — .env의 AVIATIONSTACK_KEY를 채우면 동작합니다.");
        setData(null);
      } else if (payload.status === null) {
        setMessage(payload.message);
        setData(null);
      } else {
        setData(payload.status);
      }
    } catch {
      setMessage("조회에 실패했습니다.");
      setData(null);
    }
    setState("done");
  };

  if (state === "idle") {
    return (
      <button className="flight-status flight-status--btn" onClick={load}>
        <Plane size={13} />
        운항 상태 확인 ({flightNo})
      </button>
    );
  }

  return (
    <div className={`flight-status${data ? ` flight-status--${data.state}` : ""}`}>
      <div className="flight-status__head">
        <span className="flight-status__no">
          <Plane size={13} /> {flightNo}
          {data?.airline && <em>{data.airline}</em>}
        </span>
        {data && <span className="flight-status__state">{flightStateLabels[data.state]}</span>}
        <button className="flight-status__refresh" onClick={load} aria-label="새로고침" disabled={state === "loading"}>
          {state === "loading" ? <Loader2 size={13} className="spin" /> : <RefreshCw size={13} />}
        </button>
      </div>
      {state === "loading" && !data && <p className="flight-status__msg">조회 중…</p>}
      {message && <p className="flight-status__msg">{message}</p>}
      {data && (
        <div className="flight-status__legs">
          <div className="flight-status__leg">
            <span className="flight-status__role">출발</span>
            <strong>{data.departure.iata || "—"}</strong>
            <span className="flight-status__time">
              {fmtFlightTime(data.departure.estimated || data.departure.scheduled) || "—"}
              {data.departure.delayMinutes > 0 && <em className="flight-status__delay">+{data.departure.delayMinutes}분</em>}
            </span>
            <span className="flight-status__gate">
              {data.departure.terminal && `T${data.departure.terminal}`}
              {data.departure.gate && ` · ${data.departure.gate}게이트`}
            </span>
          </div>
          <div className="flight-status__arrow">→</div>
          <div className="flight-status__leg">
            <span className="flight-status__role">도착</span>
            <strong>{data.arrival.iata || "—"}</strong>
            <span className="flight-status__time">
              {fmtFlightTime(data.arrival.estimated || data.arrival.scheduled) || "—"}
              {data.arrival.delayMinutes > 0 && <em className="flight-status__delay">+{data.arrival.delayMinutes}분</em>}
            </span>
            <span className="flight-status__gate">
              {data.arrival.terminal && `T${data.arrival.terminal}`}
              {data.arrival.gate && ` · ${data.arrival.gate}게이트`}
            </span>
          </div>
        </div>
      )}
      {data?.date && <p className="flight-status__date">{data.date} 운항편 기준 · 출발/도착 현지시각</p>}
    </div>
  );
}

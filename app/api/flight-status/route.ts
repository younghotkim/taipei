import { NextRequest, NextResponse } from "next/server";
import {
  normalizeFlightCode,
  type FlightStatus,
  type FlightStatusResponse,
  type FlightStatusState
} from "@/lib/flight-status";

export const runtime = "nodejs";

const TTL_MS = 10 * 60 * 1000; // cache per flight for 10 min to protect the 100-call/month free quota
const cache = new Map<string, { at: number; payload: FlightStatusResponse }>();

type AviationLeg = {
  airport?: string;
  iata?: string;
  terminal?: string | null;
  gate?: string | null;
  scheduled?: string | null;
  estimated?: string | null;
  actual?: string | null;
  delay?: number | null;
};

type AviationFlight = {
  flight_date?: string;
  flight_status?: string;
  departure?: AviationLeg;
  arrival?: AviationLeg;
  airline?: { name?: string; iata?: string };
  flight?: { iata?: string; icao?: string; number?: string };
};

function str(v: unknown): string {
  return typeof v === "string" ? v : "";
}

function leg(raw: AviationLeg | undefined) {
  return {
    airport: str(raw?.airport),
    iata: str(raw?.iata),
    terminal: str(raw?.terminal),
    gate: str(raw?.gate),
    scheduled: str(raw?.scheduled),
    estimated: str(raw?.estimated),
    actual: str(raw?.actual),
    delayMinutes: typeof raw?.delay === "number" && Number.isFinite(raw.delay) ? raw.delay : 0
  };
}

function mapState(raw: string | undefined): FlightStatusState {
  switch (raw) {
    case "scheduled":
    case "active":
    case "landed":
    case "cancelled":
    case "incident":
    case "diverted":
      return raw;
    default:
      return "unknown";
  }
}

export async function GET(request: NextRequest) {
  const key = process.env.AVIATIONSTACK_KEY;
  if (!key) {
    return NextResponse.json({ configured: false } satisfies FlightStatusResponse);
  }
  const flightRaw = request.nextUrl.searchParams.get("flight") ?? "";
  const flight = normalizeFlightCode(flightRaw);
  if (!flight || flight.length < 3) {
    return NextResponse.json({ configured: true, status: null, message: "항공편 번호를 확인해 주세요." } satisfies FlightStatusResponse);
  }

  const cached = cache.get(flight);
  if (cached && Date.now() - cached.at < TTL_MS) {
    return NextResponse.json(cached.payload);
  }

  let payload: FlightStatusResponse;
  try {
    const url = `http://api.aviationstack.com/v1/flights?access_key=${encodeURIComponent(key)}&flight_iata=${encodeURIComponent(flight)}&limit=20`;
    const res = await fetch(url, { cache: "no-store" });
    const json = (await res.json()) as { data?: AviationFlight[]; error?: { message?: string; code?: string } };
    if (json?.error) {
      payload = { configured: true, status: null, message: json.error.message || "항공 데이터 조회 실패" };
    } else {
      const list = Array.isArray(json?.data) ? json.data : [];
      // Prefer a flight that's today or in the near future; otherwise the first result.
      const today = new Date().toISOString().slice(0, 10);
      const sorted = list
        .filter((f) => f.flight?.iata && normalizeFlightCode(f.flight.iata) === flight)
        .sort((a, b) => {
          const da = str(a.flight_date) || "0000";
          const db = str(b.flight_date) || "0000";
          const fa = da >= today ? 0 : 1;
          const fb = db >= today ? 0 : 1;
          return fa !== fb ? fa - fb : (fa === 0 ? da.localeCompare(db) : db.localeCompare(da));
        });
      const pick = sorted[0] ?? list[0];
      if (!pick) {
        payload = { configured: true, status: null, message: "이 항공편에 대한 데이터가 없습니다." };
      } else {
        const status: FlightStatus = {
          flight,
          airline: str(pick.airline?.name) || str(pick.airline?.iata),
          date: str(pick.flight_date),
          state: mapState(pick.flight_status),
          departure: leg(pick.departure),
          arrival: leg(pick.arrival),
          fetchedAt: new Date().toISOString()
        };
        payload = { configured: true, status };
      }
    }
  } catch {
    payload = { configured: true, status: null, message: "항공 데이터 서버에 연결하지 못했습니다." };
  }

  cache.set(flight, { at: Date.now(), payload });
  return NextResponse.json(payload);
}

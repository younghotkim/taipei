// Normalized flight-status shape returned by /api/flight-status (AviationStack-backed).

export type FlightLeg = {
  airport: string;
  iata: string;
  terminal: string;
  gate: string;
  scheduled: string; // ISO
  estimated: string; // ISO
  actual: string; // ISO
  delayMinutes: number;
};

export type FlightStatusState =
  | "scheduled"
  | "active"
  | "landed"
  | "cancelled"
  | "incident"
  | "diverted"
  | "delayed"
  | "unknown";

export type FlightStatus = {
  flight: string; // e.g. "KE691"
  airline: string;
  date: string; // flight date "YYYY-MM-DD"
  state: FlightStatusState;
  departure: FlightLeg;
  arrival: FlightLeg;
  fetchedAt: string; // ISO
};

export type FlightStatusResponse =
  | { configured: false }
  | { configured: true; status: null; message: string } // configured but no result / error
  | { configured: true; status: FlightStatus };

export const flightStateLabels: Record<FlightStatusState, string> = {
  scheduled: "예정",
  active: "운항 중",
  landed: "착륙",
  cancelled: "결항",
  incident: "이슈",
  diverted: "회항",
  delayed: "지연",
  unknown: "정보 없음"
};

// Strip spaces / dashes, uppercase → "KE 691" / "ke-691" → "KE691"
export function normalizeFlightCode(raw: string): string {
  return raw.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
}

// AviationStack returns times in the airport's local timezone (sometimes with a wrong "+00:00"
// offset label). Read the wall-clock parts straight from the string so we don't shift them.
export function fmtFlightTime(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(iso ?? "");
  if (!m) return "";
  return `${m[2]}/${m[3]} ${m[4]}:${m[5]}`;
}

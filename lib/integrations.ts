// External integration helpers. Every function returns either real data or null,
// so callers can degrade gracefully when API keys/permissions are missing.

export type IntegrationStatus = "ready" | "missing-key" | "unavailable";

const GOOGLE_MAPS_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

export function integrationStatus() {
  return {
    weather: "ready" as IntegrationStatus, // open-meteo, no key
    exchange: "ready" as IntegrationStatus, // frankfurter, no key
    directions: GOOGLE_MAPS_KEY ? ("ready" as IntegrationStatus) : ("missing-key" as IntegrationStatus),
    geolocation:
      typeof navigator !== "undefined" && "geolocation" in navigator
        ? ("ready" as IntegrationStatus)
        : ("unavailable" as IntegrationStatus)
  };
}

// ============================================================================
// open-meteo — weather forecast (free, no key)
// ============================================================================

export type WeatherHour = {
  time: string; // ISO
  temperature: number;
  precipProbability: number;
  weatherCode: number;
};

export type DailyWeather = {
  date: string;
  tempMin: number;
  tempMax: number;
  precipProbabilityMax: number;
  weatherCode: number;
};

export type WeatherForecast = {
  hourly: WeatherHour[];
  daily: DailyWeather[];
};

export async function fetchWeather(
  lat: number,
  lng: number,
  signal?: AbortSignal
): Promise<WeatherForecast | null> {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&hourly=temperature_2m,precipitation_probability,weather_code&daily=temperature_2m_min,temperature_2m_max,precipitation_probability_max,weather_code&timezone=Asia%2FTaipei&forecast_days=7`;
    const response = await fetch(url, { signal, cache: "no-store" });
    if (!response.ok) return null;
    const payload = (await response.json()) as {
      hourly?: {
        time?: string[];
        temperature_2m?: number[];
        precipitation_probability?: number[];
        weather_code?: number[];
      };
      daily?: {
        time?: string[];
        temperature_2m_min?: number[];
        temperature_2m_max?: number[];
        precipitation_probability_max?: number[];
        weather_code?: number[];
      };
    };

    const hourly: WeatherHour[] =
      payload.hourly?.time?.map((time, index) => ({
        time,
        temperature: payload.hourly?.temperature_2m?.[index] ?? 0,
        precipProbability: payload.hourly?.precipitation_probability?.[index] ?? 0,
        weatherCode: payload.hourly?.weather_code?.[index] ?? 0
      })) ?? [];

    const daily: DailyWeather[] =
      payload.daily?.time?.map((date, index) => ({
        date,
        tempMin: payload.daily?.temperature_2m_min?.[index] ?? 0,
        tempMax: payload.daily?.temperature_2m_max?.[index] ?? 0,
        precipProbabilityMax: payload.daily?.precipitation_probability_max?.[index] ?? 0,
        weatherCode: payload.daily?.weather_code?.[index] ?? 0
      })) ?? [];

    return { hourly, daily };
  } catch {
    return null;
  }
}

export function weatherLabel(code: number): { label: string; emoji: string } {
  // open-meteo WMO codes: https://open-meteo.com/en/docs
  if (code === 0) return { label: "맑음", emoji: "☀️" };
  if (code <= 2) return { label: "구름 조금", emoji: "🌤" };
  if (code === 3) return { label: "흐림", emoji: "☁️" };
  if (code >= 45 && code <= 48) return { label: "안개", emoji: "🌫" };
  if (code >= 51 && code <= 57) return { label: "이슬비", emoji: "🌦" };
  if (code >= 61 && code <= 67) return { label: "비", emoji: "🌧" };
  if (code >= 71 && code <= 77) return { label: "눈", emoji: "❄️" };
  if (code >= 80 && code <= 82) return { label: "소나기", emoji: "🌧" };
  if (code >= 95) return { label: "뇌우", emoji: "⛈" };
  return { label: "—", emoji: "·" };
}

// ============================================================================
// frankfurter.app — exchange rate (free, no key)
// ============================================================================

export type ExchangeRates = {
  base: string;
  rates: Record<string, number>;
  date: string;
};

export async function fetchExchangeRate(
  from: string = "TWD",
  to: string = "KRW",
  signal?: AbortSignal
): Promise<number | null> {
  try {
    // proxied through our own /api/exchange to avoid CORS / upstream redirects
    const response = await fetch(`/api/exchange?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`, { signal });
    if (!response.ok) return null;
    const payload = (await response.json()) as { rate?: number };
    return typeof payload.rate === "number" ? payload.rate : null;
  } catch {
    return null;
  }
}

// ============================================================================
// Google Directions — via server proxy (/api/directions)
// ============================================================================

export type DirectionsResult = {
  durationSeconds: number;
  distanceMeters: number;
  mode: "walking" | "transit" | "driving";
  summary: string;
};

export async function fetchDirections(
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number },
  mode: "walking" | "transit" | "driving" = "walking",
  signal?: AbortSignal
): Promise<DirectionsResult | null> {
  try {
    const params = new URLSearchParams({
      originLat: String(origin.lat),
      originLng: String(origin.lng),
      destLat: String(destination.lat),
      destLng: String(destination.lng),
      mode
    });
    const response = await fetch(`/api/directions?${params.toString()}`, { signal });
    if (!response.ok) return null;
    const payload = (await response.json()) as Partial<DirectionsResult>;
    if (
      typeof payload.durationSeconds !== "number" ||
      typeof payload.distanceMeters !== "number"
    ) {
      return null;
    }
    return {
      durationSeconds: payload.durationSeconds,
      distanceMeters: payload.distanceMeters,
      mode: payload.mode ?? mode,
      summary: payload.summary ?? ""
    };
  } catch {
    return null;
  }
}

export function durationLabel(seconds: number) {
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}분`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours}시간 ${rest}분` : `${hours}시간`;
}

// ============================================================================
// Geolocation — browser API, no key required, requires user permission
// ============================================================================

export function watchPosition(
  onUpdate: (position: { lat: number; lng: number; accuracy: number }) => void,
  onError: (message: string) => void
): { stop: () => void } {
  if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
    onError("브라우저가 위치 권한을 지원하지 않습니다.");
    return { stop: () => {} };
  }

  const watchId = navigator.geolocation.watchPosition(
    (position) =>
      onUpdate({
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        accuracy: position.coords.accuracy
      }),
    (error) => onError(error.message),
    { enableHighAccuracy: true, maximumAge: 30000, timeout: 20000 }
  );

  return {
    stop: () => navigator.geolocation.clearWatch(watchId)
  };
}

export function distanceMeters(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number }
): number {
  const R = 6371000;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const sinDLat = Math.sin(dLat / 2);
  const sinDLng = Math.sin(dLng / 2);
  const c = sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLng * sinDLng;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(c)));
}

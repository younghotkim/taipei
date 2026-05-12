import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const ALLOWED_TYPES = new Set([
  "restaurant",
  "cafe",
  "bakery",
  "supermarket",
  "convenience_store",
  "pharmacy",
  "tourist_attraction",
  "bar"
]);

const TTL_MS = 8 * 60 * 1000;
const cache = new Map<string, { at: number; body: unknown }>();

type GPlace = {
  name?: string;
  rating?: number;
  user_ratings_total?: number;
  vicinity?: string;
  price_level?: number;
  types?: string[];
  business_status?: string;
  opening_hours?: { open_now?: boolean };
  geometry?: { location?: { lat?: number; lng?: number } };
};

function haversineM(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const R = 6371000;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLng = ((bLng - aLng) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((aLat * Math.PI) / 180) * Math.cos((bLat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s)));
}

export async function GET(request: NextRequest) {
  const key = process.env.GOOGLE_MAPS_SERVER_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!key) return NextResponse.json({ configured: false, results: [] });

  const params = request.nextUrl.searchParams;
  const lat = Number(params.get("lat"));
  const lng = Number(params.get("lng"));
  const type = params.get("type") ?? "restaurant";
  const radius = Math.min(2000, Math.max(150, Number(params.get("radius")) || 700));
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || !ALLOWED_TYPES.has(type)) {
    return NextResponse.json({ configured: true, results: [], message: "잘못된 요청입니다." });
  }

  const cacheKey = `${lat.toFixed(4)},${lng.toFixed(4)},${type},${radius}`;
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.at < TTL_MS) return NextResponse.json(cached.body);

  let body: unknown;
  try {
    const url =
      `https://maps.googleapis.com/maps/api/place/nearbysearch/json` +
      `?location=${lat},${lng}&radius=${radius}&type=${encodeURIComponent(type)}` +
      `&language=ko&key=${encodeURIComponent(key)}`;
    const res = await fetch(url, { cache: "no-store" });
    const json = (await res.json()) as { status?: string; results?: GPlace[]; error_message?: string };
    if (json.status === "REQUEST_DENIED") {
      body = {
        configured: true,
        results: [],
        message: "Google Places API가 이 키에 활성화되어 있지 않습니다. (Cloud Console → Places API 사용 설정)"
      };
    } else if (json.status && json.status !== "OK" && json.status !== "ZERO_RESULTS") {
      body = { configured: true, results: [], message: json.error_message || `검색 실패 (${json.status})` };
    } else {
      const results = (json.results ?? [])
        .filter((p) => p.business_status !== "CLOSED_PERMANENTLY")
        .map((p) => {
          const plat = p.geometry?.location?.lat;
          const plng = p.geometry?.location?.lng;
          return {
            name: typeof p.name === "string" ? p.name : "",
            rating: typeof p.rating === "number" ? p.rating : 0,
            reviews: typeof p.user_ratings_total === "number" ? p.user_ratings_total : 0,
            priceLevel: typeof p.price_level === "number" ? p.price_level : null,
            vicinity: typeof p.vicinity === "string" ? p.vicinity : "",
            openNow: p.opening_hours?.open_now ?? null,
            lat: typeof plat === "number" ? plat : null,
            lng: typeof plng === "number" ? plng : null,
            distanceM:
              typeof plat === "number" && typeof plng === "number" ? haversineM(lat, lng, plat, plng) : null
          };
        })
        .filter((p) => p.name)
        .sort((a, b) => (a.distanceM ?? 9e9) - (b.distanceM ?? 9e9))
        .slice(0, 8);
      body = { configured: true, results };
    }
  } catch {
    body = { configured: true, results: [], message: "Places 서버에 연결하지 못했습니다." };
  }

  cache.set(cacheKey, { at: Date.now(), body });
  return NextResponse.json(body);
}

import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const apiKey =
  process.env.GOOGLE_MAPS_SERVER_KEY ?? process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

type GoogleDirectionsResponse = {
  status: string;
  routes: Array<{
    summary?: string;
    legs: Array<{
      duration?: { value: number };
      distance?: { value: number };
    }>;
  }>;
};

export async function GET(request: NextRequest) {
  if (!apiKey) {
    return NextResponse.json(
      { error: "directions integration not configured (missing GOOGLE_MAPS key)" },
      { status: 503 }
    );
  }

  const sp = request.nextUrl.searchParams;
  const originLat = sp.get("originLat");
  const originLng = sp.get("originLng");
  const destLat = sp.get("destLat");
  const destLng = sp.get("destLng");
  const mode = (sp.get("mode") ?? "walking").toLowerCase();

  if (!originLat || !originLng || !destLat || !destLng) {
    return NextResponse.json({ error: "missing origin/destination" }, { status: 400 });
  }
  const validMode = ["walking", "transit", "driving"].includes(mode) ? mode : "walking";

  const url = new URL("https://maps.googleapis.com/maps/api/directions/json");
  url.searchParams.set("origin", `${originLat},${originLng}`);
  url.searchParams.set("destination", `${destLat},${destLng}`);
  url.searchParams.set("mode", validMode);
  url.searchParams.set("region", "tw");
  url.searchParams.set("language", "ko");
  url.searchParams.set("key", apiKey);

  try {
    const response = await fetch(url.toString(), { cache: "no-store" });
    if (!response.ok) {
      return NextResponse.json({ error: "google directions request failed" }, { status: 502 });
    }
    const payload = (await response.json()) as GoogleDirectionsResponse;
    if (payload.status !== "OK") {
      return NextResponse.json(
        { error: `google directions status: ${payload.status}` },
        { status: 502 }
      );
    }
    const route = payload.routes[0];
    const leg = route?.legs?.[0];
    if (!route || !leg) {
      return NextResponse.json({ error: "no route found" }, { status: 404 });
    }
    return NextResponse.json({
      durationSeconds: leg.duration?.value ?? 0,
      distanceMeters: leg.distance?.value ?? 0,
      mode: validMode,
      summary: route.summary ?? ""
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown directions error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

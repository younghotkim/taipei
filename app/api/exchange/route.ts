import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
// cache the rate for an hour — FX doesn't move fast and we don't want to hammer the upstream
export const revalidate = 3600;

type ErApiResponse = {
  result?: string;
  base_code?: string;
  rates?: Record<string, number>;
};

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const from = (sp.get("from") ?? "TWD").toUpperCase();
  const to = (sp.get("to") ?? "KRW").toUpperCase();

  // Two free, no-key providers; try the first, fall back to the second.
  const sources = [
    {
      url: `https://open.er-api.com/v6/latest/${encodeURIComponent(from)}`,
      pick: (p: ErApiResponse) => p?.rates?.[to]
    },
    {
      url: `https://api.frankfurter.dev/v1/latest?base=${encodeURIComponent(from)}&symbols=${encodeURIComponent(to)}`,
      pick: (p: ErApiResponse) => p?.rates?.[to]
    }
  ];

  for (const source of sources) {
    try {
      const res = await fetch(source.url, { next: { revalidate: 3600 } });
      if (!res.ok) continue;
      const payload = (await res.json()) as ErApiResponse;
      const rate = source.pick(payload);
      if (typeof rate === "number" && rate > 0) {
        return NextResponse.json({ rate, base: from, to });
      }
    } catch {
      // try next source
    }
  }

  return NextResponse.json({ error: "exchange rate unavailable" }, { status: 502 });
}

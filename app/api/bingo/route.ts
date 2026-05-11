import { NextRequest, NextResponse } from "next/server";
import { normalizeBingoDone } from "@/lib/bingo";
import {
  createSupabaseServerClient,
  isSupabaseConfigured,
  tripId,
  type TripBingoRow
} from "@/lib/supabase-server";

export const runtime = "nodejs";

function tableMissing(message: string): boolean {
  return /relation .*trip_bingo.* does not exist|could not find the table/i.test(message);
}

export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ mode: "local", done: [] });
  }
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("trip_bingo")
    .select("*")
    .eq("trip_id", tripId)
    .maybeSingle();
  if (error) {
    if (tableMissing(error.message)) return NextResponse.json({ mode: "local", done: [] });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  const row = data as TripBingoRow | null;
  return NextResponse.json({ mode: "supabase", done: normalizeBingoDone(row?.done) });
}

export async function PUT(request: NextRequest) {
  const body = (await request.json()) as unknown;
  const raw = body && typeof body === "object" && "done" in body ? (body as { done: unknown }).done : body;
  const done = normalizeBingoDone(raw);
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ mode: "local", saved: false });
  }
  const supabase = createSupabaseServerClient();
  const row: TripBingoRow = { trip_id: tripId, done, updated_at: new Date().toISOString() };
  const { error } = await supabase.from("trip_bingo").upsert(row as never, { onConflict: "trip_id" });
  if (error) {
    if (tableMissing(error.message)) return NextResponse.json({ mode: "local", saved: false });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ mode: "supabase", saved: true });
}

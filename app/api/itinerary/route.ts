import { NextRequest, NextResponse } from "next/server";
import {
  createSupabaseServerClient,
  isSupabaseConfigured,
  tripId
} from "@/lib/supabase-server";
import type {
  DayRow,
  EssentialRow,
  StopPlanRow,
  StopRow
} from "@/lib/itinerary";

export const runtime = "nodejs";

type FullRemote = {
  stops: StopRow[];
  days: DayRow[];
  plans: StopPlanRow[];
  essentials: EssentialRow[];
  archived: string[];
};

export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ mode: "local", remote: null });
  }

  const supabase = createSupabaseServerClient();
  const [stopsResult, daysResult, plansResult, essentialsResult] = await Promise.all([
    supabase.from("trip_stops").select("*").eq("trip_id", tripId),
    supabase.from("trip_days").select("*").eq("trip_id", tripId),
    supabase.from("trip_stop_plans").select("*").eq("trip_id", tripId),
    supabase.from("trip_essentials").select("*").eq("trip_id", tripId)
  ]);

  const error =
    stopsResult.error || daysResult.error || plansResult.error || essentialsResult.error;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const stops = (stopsResult.data ?? []) as StopRow[];
  const archived = stops.filter((row) => row.archived).map((row) => row.stop_id);

  const remote: FullRemote = {
    stops: stops.filter((row) => !row.archived),
    days: (daysResult.data ?? []) as DayRow[],
    plans: (plansResult.data ?? []) as StopPlanRow[],
    essentials: (essentialsResult.data ?? []) as EssentialRow[],
    archived
  };
  return NextResponse.json({ mode: "supabase", remote });
}

// PUT replaces the editable state in one transaction-like batch.
// Body: { stops?, days?, plans?, essentials?, archivedIds? }
export async function PUT(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ mode: "local", saved: false });
  }

  const body = (await request.json()) as Partial<FullRemote>;
  const supabase = createSupabaseServerClient();

  if (Array.isArray(body.stops) && body.stops.length > 0) {
    const rows = body.stops.map((row) => ({ ...row, trip_id: tripId, archived: false }));
    const { error } = await supabase
      .from("trip_stops")
      .upsert(rows, { onConflict: "trip_id,stop_id" });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (Array.isArray(body.archived) && body.archived.length > 0) {
    const { error } = await supabase
      .from("trip_stops")
      .update({ archived: true, updated_at: new Date().toISOString() })
      .eq("trip_id", tripId)
      .in("stop_id", body.archived);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (Array.isArray(body.days) && body.days.length > 0) {
    const rows = body.days.map((row) => ({ ...row, trip_id: tripId }));
    const { error } = await supabase
      .from("trip_days")
      .upsert(rows, { onConflict: "trip_id,day" });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (Array.isArray(body.plans) && body.plans.length > 0) {
    const rows = body.plans.map((row) => ({ ...row, trip_id: tripId }));
    const { error } = await supabase
      .from("trip_stop_plans")
      .upsert(rows, { onConflict: "trip_id,stop_id" });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (Array.isArray(body.essentials)) {
    // For essentials we replace the entire list: delete then insert.
    const { error: deleteError } = await supabase
      .from("trip_essentials")
      .delete()
      .eq("trip_id", tripId);
    if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 500 });
    if (body.essentials.length > 0) {
      const rows = body.essentials.map((row) => ({ ...row, trip_id: tripId }));
      const { error } = await supabase.from("trip_essentials").insert(rows);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  return NextResponse.json({ mode: "supabase", saved: true });
}

// DELETE one stop permanently (hard delete from trip_stops row).
// Memories are kept (separate table). Use sparingly — usually archive instead.
export async function DELETE(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ mode: "local", saved: false });
  }
  const sp = request.nextUrl.searchParams;
  const stopId = sp.get("stopId");
  if (!stopId) return NextResponse.json({ error: "missing stopId" }, { status: 400 });

  const supabase = createSupabaseServerClient();
  const { error } = await supabase
    .from("trip_stops")
    .delete()
    .eq("trip_id", tripId)
    .eq("stop_id", stopId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ mode: "supabase", saved: true });
}

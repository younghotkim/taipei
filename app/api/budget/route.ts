import { NextRequest, NextResponse } from "next/server";
import { normalizeBudgetSettings } from "@/lib/budget";
import {
  createSupabaseServerClient,
  isSupabaseConfigured,
  tripId,
  type TripBudgetRow
} from "@/lib/supabase-server";

export const runtime = "nodejs";

function rowToSettings(row: Partial<TripBudgetRow>) {
  return normalizeBudgetSettings({
    targetTwd: row.target_twd,
    cashStartTwd: row.cash_start_twd,
    dailyLimitTwd: row.daily_limit_twd,
    notes: row.notes
  });
}

function settingsToRow(settings: ReturnType<typeof normalizeBudgetSettings>): TripBudgetRow {
  return {
    trip_id: tripId,
    target_twd: settings.targetTwd,
    cash_start_twd: settings.cashStartTwd,
    daily_limit_twd: settings.dailyLimitTwd,
    notes: settings.notes
  };
}

export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ mode: "local", settings: null });
  }
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("trip_budget")
    .select("*")
    .eq("trip_id", tripId)
    .maybeSingle();
  if (error) {
    if (/relation .*trip_budget.* does not exist|could not find the table/i.test(error.message)) {
      return NextResponse.json({ mode: "local", settings: null });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ mode: "supabase", settings: data ? rowToSettings(data as TripBudgetRow) : null });
}

export async function PUT(request: NextRequest) {
  const body = (await request.json()) as unknown;
  const raw = body && typeof body === "object" && "settings" in body
    ? (body as { settings: unknown }).settings
    : body;
  const settings = normalizeBudgetSettings(raw);
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ mode: "local", saved: false });
  }
  const supabase = createSupabaseServerClient();
  const { error } = await supabase
    .from("trip_budget")
    .upsert(settingsToRow(settings) as never, { onConflict: "trip_id" });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ mode: "supabase", saved: true });
}

import { NextRequest, NextResponse } from "next/server";
import { normalizeExpenseEntry, normalizeLedger, type ExpenseEntry } from "@/lib/expense-ledger";
import {
  createSupabaseServerClient,
  isSupabaseConfigured,
  tripId,
  type TripExpenseRow
} from "@/lib/supabase-server";

export const runtime = "nodejs";

function rowToEntry(row: Partial<TripExpenseRow>): ExpenseEntry | null {
  return normalizeExpenseEntry({
    id: row.id,
    day: row.day,
    amount: row.amount,
    category: row.category,
    payer: row.payer,
    method: row.method,
    label: row.label,
    at: row.at
  });
}

function entryToRow(e: ExpenseEntry): TripExpenseRow {
  return {
    trip_id: tripId,
    id: e.id,
    day: e.day,
    amount: e.amount,
    category: e.category,
    payer: e.payer,
    method: e.method,
    label: e.label,
    at: e.at
  };
}

export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ mode: "local", entries: [] });
  }
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase.from("trip_expenses").select("*").eq("trip_id", tripId);
  if (error) {
    // table not migrated yet — degrade to local instead of 500ing
    if (/relation .*trip_expenses.* does not exist|could not find the table/i.test(error.message)) {
      return NextResponse.json({ mode: "local", entries: [] });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  const entries = (data ?? []).map(rowToEntry).filter((e): e is ExpenseEntry => e !== null);
  return NextResponse.json({ mode: "supabase", entries });
}

export async function POST(request: NextRequest) {
  const body = (await request.json()) as unknown;
  const entry =
    body && typeof body === "object" && "entry" in body
      ? normalizeExpenseEntry((body as { entry: unknown }).entry)
      : null;
  if (!entry) {
    return NextResponse.json({ error: "Invalid expense entry." }, { status: 400 });
  }
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ mode: "local", saved: false });
  }
  const supabase = createSupabaseServerClient();
  const { error } = await supabase
    .from("trip_expenses")
    .upsert(entryToRow(entry) as never, { onConflict: "trip_id,id" });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ mode: "supabase", saved: true });
}

export async function PUT(request: NextRequest) {
  const body = (await request.json()) as unknown;
  const raw =
    body && typeof body === "object" && "entries" in body ? (body as { entries: unknown }).entries : body;
  const entries = normalizeLedger(raw);
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ mode: "local", saved: false });
  }
  const supabase = createSupabaseServerClient();
  const del = await supabase.from("trip_expenses").delete().eq("trip_id", tripId);
  if (del.error) {
    return NextResponse.json({ error: del.error.message }, { status: 500 });
  }
  if (entries.length > 0) {
    const { error } = await supabase.from("trip_expenses").insert(entries.map(entryToRow) as never);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }
  return NextResponse.json({ mode: "supabase", saved: true });
}

export async function DELETE(request: NextRequest) {
  const body = (await request.json()) as unknown;
  const id = body && typeof body === "object" && "id" in body ? (body as { id: unknown }).id : null;
  if (typeof id !== "string") {
    return NextResponse.json({ error: "Invalid id." }, { status: 400 });
  }
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ mode: "local", saved: false });
  }
  const supabase = createSupabaseServerClient();
  const { error } = await supabase.from("trip_expenses").delete().eq("trip_id", tripId).eq("id", id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ mode: "supabase", saved: true });
}

import { NextRequest, NextResponse } from "next/server";
import { isMemory, isMemoryBook, normalizeMemory, type Memory, type MemoryBook } from "@/lib/memory-types";
import {
  createSupabaseServerClient,
  isSupabaseConfigured,
  tripId,
  type TripMemoryRow
} from "@/lib/supabase-server";

export const runtime = "nodejs";

type SupabaseClient = ReturnType<typeof createSupabaseServerClient>;

// Upsert that self-heals if a newer column hasn't been migrated yet:
// on a "column ... does not exist" error, drop that column from every row and retry.
async function resilientUpsert(supabase: SupabaseClient, rows: TripMemoryRow[]) {
  let working: Record<string, unknown>[] = rows.map((row) => ({ ...row }));
  for (let attempt = 0; attempt < 4; attempt++) {
    const { error } = await supabase
      .from("trip_memories")
      .upsert(working as never, { onConflict: "trip_id,stop_id" });
    if (!error) return null;
    // Pull the first quoted identifier out of the error (works for both the
    // postgres form `column "x" of relation ...` and PostgREST's `Could not find the 'x' column ...`).
    const match = error.message.match(/["']([a-z_][a-z0-9_]*)["']/i);
    const missing = match?.[1];
    if (!missing || !(missing in (working[0] ?? {}))) return error.message;
    working = working.map((row) => {
      const next = { ...row };
      delete next[missing];
      return next;
    });
  }
  return "upsert failed after retries";
}

function rowToMemory(row: Partial<TripMemoryRow>) {
  return normalizeMemory({
    visited: row.visited,
    status: row.status,
    rating: row.rating,
    ratingY: row.rating_y,
    ratingS: row.rating_s,
    note: row.note,
    comments: row.comments,
    yComment: row.y_comment,
    sComment: row.s_comment,
    photoUrl: row.photo_url,
    photos: row.photos,
    expenseAmount: row.expense_amount,
    expenseCategory: row.expense_category,
    expensePayer: row.expense_payer,
    skippedReason: row.skipped_reason,
    updatedAt: row.updated_at
  });
}

function memoryToRow(stopId: string, memory: Memory): TripMemoryRow {
  return {
    trip_id: tripId,
    stop_id: stopId,
    visited: memory.visited,
    status: memory.status,
    rating: memory.rating,
    rating_y: memory.ratingY,
    rating_s: memory.ratingS,
    note: memory.note,
    comments: memory.comments,
    y_comment: "",
    s_comment: "",
    photo_url: memory.photoUrl,
    photos: memory.photos,
    expense_amount: memory.expenseAmount,
    expense_category: memory.expenseCategory,
    expense_payer: memory.expensePayer,
    skipped_reason: memory.skippedReason,
    updated_at: memory.updatedAt ?? new Date().toISOString()
  };
}

export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ mode: "local", memories: {} });
  }

  const supabase = createSupabaseServerClient();
  // `select("*")` so the route keeps working even if a newer column (e.g. photos,
  // expense_payer) has not been migrated yet — missing fields default in normalizeMemory.
  const { data, error } = await supabase
    .from("trip_memories")
    .select("*")
    .eq("trip_id", tripId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const memories = (data ?? []).reduce<MemoryBook>((book, row) => {
    book[row.stop_id] = rowToMemory(row);
    return book;
  }, {});

  return NextResponse.json({ mode: "supabase", memories });
}

export async function POST(request: NextRequest) {
  const body = (await request.json()) as unknown;
  if (!body || typeof body !== "object" || !("stopId" in body) || !("memory" in body)) {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { stopId, memory } = body as { stopId: unknown; memory: unknown };
  if (typeof stopId !== "string" || !isMemory(memory)) {
    return NextResponse.json({ error: "Invalid memory payload." }, { status: 400 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ mode: "local", saved: false });
  }

  const supabase = createSupabaseServerClient();
  const error = await resilientUpsert(supabase, [memoryToRow(stopId, normalizeMemory(memory))]);
  if (error) {
    return NextResponse.json({ error }, { status: 500 });
  }

  return NextResponse.json({ mode: "supabase", saved: true });
}

export async function PUT(request: NextRequest) {
  const body = (await request.json()) as unknown;
  const memories = body && typeof body === "object" && "memories" in body
    ? (body as { memories: unknown }).memories
    : body;

  if (!isMemoryBook(memories)) {
    return NextResponse.json({ error: "Invalid memories payload." }, { status: 400 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ mode: "local", saved: false });
  }

  const rows = Object.entries(memories).map(([stopId, memory]) =>
    memoryToRow(stopId, normalizeMemory(memory))
  );
  if (rows.length === 0) {
    return NextResponse.json({ mode: "supabase", saved: true });
  }

  const supabase = createSupabaseServerClient();
  const error = await resilientUpsert(supabase, rows);
  if (error) {
    return NextResponse.json({ error }, { status: 500 });
  }

  return NextResponse.json({ mode: "supabase", saved: true });
}

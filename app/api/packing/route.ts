import { NextRequest, NextResponse } from "next/server";
import { normalizePackBook, type PackItem } from "@/lib/packing";
import {
  createSupabaseServerClient,
  isSupabaseConfigured,
  tripId,
  type TripPackingRow
} from "@/lib/supabase-server";

export const runtime = "nodejs";

function rowToItem(row: Partial<TripPackingRow>): PackItem | null {
  return normalizePackBook([
    {
      id: row.id,
      label: row.label,
      category: row.category,
      owner: row.owner,
      packed: row.packed
    }
  ])[0] ?? null;
}

function itemToRow(item: PackItem): TripPackingRow {
  return {
    trip_id: tripId,
    id: item.id,
    label: item.label,
    category: item.category,
    owner: item.owner,
    packed: item.packed,
    updated_at: new Date().toISOString()
  };
}

export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ mode: "local", items: [] });
  }
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase.from("trip_packing").select("*").eq("trip_id", tripId);
  if (error) {
    if (/relation .*trip_packing.* does not exist|could not find the table/i.test(error.message)) {
      return NextResponse.json({ mode: "local", items: [] });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  const items = (data ?? []).map(rowToItem).filter((item): item is PackItem => item !== null);
  return NextResponse.json({ mode: "supabase", items });
}

export async function PUT(request: NextRequest) {
  const body = (await request.json()) as unknown;
  const raw = body && typeof body === "object" && "items" in body ? (body as { items: unknown }).items : body;
  const items = normalizePackBook(raw);
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ mode: "local", saved: false });
  }
  const supabase = createSupabaseServerClient();
  const del = await supabase.from("trip_packing").delete().eq("trip_id", tripId);
  if (del.error) return NextResponse.json({ error: del.error.message }, { status: 500 });
  if (items.length > 0) {
    const { error } = await supabase.from("trip_packing").insert(items.map(itemToRow) as never);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ mode: "supabase", saved: true });
}

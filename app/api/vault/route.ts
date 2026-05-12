import { NextRequest, NextResponse } from "next/server";
import { normalizeVaultBook, type VaultItem } from "@/lib/trip-vault";
import {
  createSupabaseServerClient,
  isSupabaseConfigured,
  tripId,
  type TripVaultRow
} from "@/lib/supabase-server";

export const runtime = "nodejs";

function rowToItem(row: Partial<TripVaultRow>): VaultItem | null {
  return normalizeVaultBook([
    {
      id: row.id,
      kind: row.kind,
      title: row.title,
      provider: row.provider,
      confirmation: row.confirmation,
      flightNo: row.flight_no,
      startAt: row.start_at,
      location: row.location,
      link: row.link,
      amount: row.amount,
      owner: row.owner,
      status: row.status,
      notes: row.notes,
      documentUrl: row.document_url
    }
  ])[0] ?? null;
}

function itemToRow(item: VaultItem): TripVaultRow {
  return {
    trip_id: tripId,
    id: item.id,
    kind: item.kind,
    title: item.title,
    provider: item.provider,
    confirmation: item.confirmation,
    flight_no: item.flightNo,
    start_at: item.startAt,
    location: item.location,
    link: item.link,
    amount: item.amount,
    owner: item.owner,
    status: item.status,
    notes: item.notes,
    document_url: item.documentUrl,
    updated_at: new Date().toISOString()
  };
}

export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ mode: "local", items: [] });
  }
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("trip_vault")
    .select("*")
    .eq("trip_id", tripId);
  if (error) {
    if (/relation .*trip_vault.* does not exist|could not find the table/i.test(error.message)) {
      return NextResponse.json({ mode: "local", items: [] });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  const items = (data ?? []).map(rowToItem).filter((item): item is VaultItem => item !== null);
  return NextResponse.json({ mode: "supabase", items });
}

export async function PUT(request: NextRequest) {
  const body = (await request.json()) as unknown;
  const raw = body && typeof body === "object" && "items" in body
    ? (body as { items: unknown }).items
    : body;
  const items = normalizeVaultBook(raw);
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ mode: "local", saved: false });
  }
  const supabase = createSupabaseServerClient();
  const del = await supabase.from("trip_vault").delete().eq("trip_id", tripId);
  if (del.error) return NextResponse.json({ error: del.error.message }, { status: 500 });
  if (items.length > 0) {
    const { error } = await supabase.from("trip_vault").insert(items.map(itemToRow) as never);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ mode: "supabase", saved: true });
}

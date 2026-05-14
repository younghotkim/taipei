import { NextRequest, NextResponse } from "next/server";
import {
  normalizeTravelerBook,
  travelerIds,
  type Traveler,
  type TravelerBook
} from "@/lib/travelers";
import {
  createSupabaseServerClient,
  isSupabaseConfigured,
  tripId,
  type TripTravelerRow
} from "@/lib/supabase-server";

export const runtime = "nodejs";

function rowToTraveler(row: Partial<TripTravelerRow>): Traveler | null {
  if (!row.id) return null;
  const book = normalizeTravelerBook([
    {
      id: row.id,
      passportName: row.passport_name,
      passportNo: row.passport_no,
      nationality: row.nationality,
      birthDate: row.birth_date,
      issueDate: row.issue_date,
      expiryDate: row.expiry_date,
      passportPhotoUrl: row.passport_photo_url,
      arrivalCardUrl: row.arrival_card_url,
      notes: row.notes
    }
  ]);
  return book[row.id as keyof TravelerBook] ?? null;
}

function travelerToRow(t: Traveler): TripTravelerRow {
  return {
    trip_id: tripId,
    id: t.id,
    passport_name: t.passportName,
    passport_no: t.passportNo,
    nationality: t.nationality,
    birth_date: t.birthDate,
    issue_date: t.issueDate,
    expiry_date: t.expiryDate,
    passport_photo_url: t.passportPhotoUrl,
    arrival_card_url: t.arrivalCardUrl,
    notes: t.notes,
    updated_at: new Date().toISOString()
  };
}

function isMissingTableError(message: string): boolean {
  return /relation .*trip_travelers.* does not exist|could not find the table/i.test(message);
}

export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ mode: "local", travelers: {} });
  }
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("trip_travelers")
    .select("*")
    .eq("trip_id", tripId);
  if (error) {
    if (isMissingTableError(error.message)) {
      return NextResponse.json({ mode: "local", travelers: {} });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  const merged: Partial<TravelerBook> = {};
  for (const row of data ?? []) {
    const traveler = rowToTraveler(row as Partial<TripTravelerRow>);
    if (traveler) merged[traveler.id] = traveler;
  }
  return NextResponse.json({ mode: "supabase", travelers: merged });
}

export async function PUT(request: NextRequest) {
  const body = (await request.json()) as unknown;
  const raw = body && typeof body === "object" && "travelers" in body
    ? (body as { travelers: unknown }).travelers
    : body;
  const book = normalizeTravelerBook(raw);
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ mode: "local", saved: false });
  }
  const supabase = createSupabaseServerClient();
  const rows = travelerIds.map((id) => travelerToRow(book[id]));
  const { error } = await supabase
    .from("trip_travelers")
    .upsert(rows as never, { onConflict: "trip_id,id" });
  if (error) {
    if (isMissingTableError(error.message)) {
      return NextResponse.json({ mode: "local", saved: false });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ mode: "supabase", saved: true });
}

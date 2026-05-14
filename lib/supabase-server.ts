import { createClient } from "@supabase/supabase-js";

export type TripMemoryRow = {
  trip_id: string;
  stop_id: string;
  visited: boolean;
  status: string;
  rating: number;
  rating_y?: number;
  rating_s?: number;
  note: string;
  comments: unknown;
  y_comment?: string;
  s_comment?: string;
  photo_url: string;
  photos: string[];
  expense_amount: number;
  expense_category: string;
  expense_payer: string;
  expense_method?: string;
  skipped_reason: string;
  updated_at?: string;
};

export type TripExpenseRow = {
  trip_id: string;
  id: string;
  day: number;
  amount: number;
  category: string;
  payer: string;
  method?: string;
  label: string;
  at: string;
};

export type TripVaultRow = {
  trip_id: string;
  id: string;
  kind: string;
  title: string;
  provider: string;
  confirmation: string;
  flight_no?: string;
  start_at: string;
  location: string;
  link: string;
  amount: number;
  owner: string;
  status: string;
  notes: string;
  document_url: string;
  updated_at?: string;
};

export type TripTravelerRow = {
  trip_id: string;
  id: string;
  passport_name: string;
  passport_no: string;
  nationality: string;
  birth_date: string;
  issue_date: string;
  expiry_date: string;
  passport_photo_url: string;
  arrival_card_url: string;
  notes: string;
  updated_at?: string;
};

export type TripPackingRow = {
  trip_id: string;
  id: string;
  label: string;
  category: string;
  owner: string;
  packed: boolean;
  updated_at?: string;
};

export const photoBucket = process.env.SUPABASE_PHOTO_BUCKET ?? "trip-photos";

const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const tripId = process.env.TRIP_ID ?? "taipei-2026";

export function isSupabaseConfigured() {
  return Boolean(supabaseUrl && serviceRoleKey);
}

export function createSupabaseServerClient() {
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Supabase server environment variables are missing.");
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
}

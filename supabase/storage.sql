-- Create a public bucket for trip photo uploads.
-- Run once with the Supabase service-role connection (e.g. via the SQL editor).
insert into storage.buckets (id, name, public)
values ('trip-photos', 'trip-photos', true)
on conflict (id) do update set public = excluded.public;

-- Allow public read so memory cards can render images without signed URLs.
create policy if not exists "trip-photos: public read"
  on storage.objects for select
  using (bucket_id = 'trip-photos');

-- Writes go through the Next.js API route using the service-role key, so no
-- anonymous insert/update/delete policies are needed.

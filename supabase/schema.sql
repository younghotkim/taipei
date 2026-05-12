create table if not exists public.trip_memories (
  trip_id text not null,
  stop_id text not null,
  visited boolean not null default false,
  status text not null default 'planned'
    check (status in ('planned', 'going', 'done', 'skipped')),
  rating integer not null default 0 check (rating >= 0 and rating <= 5),
  note text not null default '',
  comments jsonb not null default '[]'::jsonb,
  y_comment text not null default '',
  s_comment text not null default '',
  photo_url text not null default '',
  photos text[] not null default '{}',
  expense_amount integer not null default 0 check (expense_amount >= 0),
  expense_category text not null default 'none'
    check (expense_category in ('none', 'food', 'drink', 'transport', 'shopping', 'ticket', 'etc')),
  expense_payer text not null default 'none'
    check (expense_payer in ('none', 'y', 's', 'shared')),
  expense_method text not null default 'unknown'
    check (expense_method in ('unknown', 'cash', 'card')),
  skipped_reason text not null default '',
  updated_at timestamptz not null default now(),
  primary key (trip_id, stop_id)
);

create index if not exists trip_memories_trip_id_updated_at_idx
  on public.trip_memories (trip_id, updated_at desc);

alter table public.trip_memories enable row level security;

-- The Next.js API route uses SUPABASE_SERVICE_ROLE_KEY on the server, so browser users
-- do not need direct table policies. Keep client-side anonymous access closed by default.

-- If the table already exists, run these migration statements once:
alter table public.trip_memories add column if not exists status text not null default 'planned';
alter table public.trip_memories add column if not exists y_comment text not null default '';
alter table public.trip_memories add column if not exists s_comment text not null default '';
alter table public.trip_memories add column if not exists expense_amount integer not null default 0;
alter table public.trip_memories add column if not exists expense_category text not null default 'none';
alter table public.trip_memories add column if not exists skipped_reason text not null default '';
alter table public.trip_memories add column if not exists photos text[] not null default '{}';
alter table public.trip_memories add column if not exists expense_payer text not null default 'none';
alter table public.trip_memories add column if not exists comments jsonb not null default '[]'::jsonb;
alter table public.trip_memories add column if not exists expense_method text not null default 'unknown';

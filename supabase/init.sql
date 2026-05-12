-- ============================================================================
-- Taipei Trip Diary — Supabase init script (idempotent, safe to re-run)
-- Run this in Supabase Dashboard → SQL Editor for a fresh project.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. trip_memories — 각 스톱에 대한 기록 (메모/별점/사진/지출 등)
-- ---------------------------------------------------------------------------

create table if not exists public.trip_memories (
  trip_id text not null,
  stop_id text not null,
  visited boolean not null default false,
  status text not null default 'planned'
    check (status in ('planned', 'going', 'done', 'skipped')),
  rating integer not null default 0 check (rating >= 0 and rating <= 5),
  rating_y integer not null default 0 check (rating_y >= 0 and rating_y <= 5),
  rating_s integer not null default 0 check (rating_s >= 0 and rating_s <= 5),
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
-- writes go through Next.js server route with service-role key, so no anon policies needed

-- migrations for older deployments
alter table public.trip_memories add column if not exists status text not null default 'planned';
alter table public.trip_memories add column if not exists y_comment text not null default '';
alter table public.trip_memories add column if not exists s_comment text not null default '';
alter table public.trip_memories add column if not exists expense_amount integer not null default 0;
alter table public.trip_memories add column if not exists expense_category text not null default 'none';
alter table public.trip_memories add column if not exists skipped_reason text not null default '';
alter table public.trip_memories add column if not exists photos text[] not null default '{}';
alter table public.trip_memories add column if not exists expense_payer text not null default 'none';
alter table public.trip_memories add column if not exists expense_method text not null default 'unknown';
alter table public.trip_memories add column if not exists comments jsonb not null default '[]'::jsonb;
alter table public.trip_memories add column if not exists rating_y integer not null default 0;
alter table public.trip_memories add column if not exists rating_s integer not null default 0;

-- ---------------------------------------------------------------------------
-- 2. trip_days — Day 메타 (제목, 무드, 요약)
-- ---------------------------------------------------------------------------

create table if not exists public.trip_days (
  trip_id text not null,
  day integer not null,
  date text not null default '',
  title text not null default '',
  mood text not null default '',
  summary text not null default '',
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (trip_id, day)
);

alter table public.trip_days enable row level security;

-- ---------------------------------------------------------------------------
-- 3. trip_stops — 편집 가능한 스톱 데이터 (정적 기본값 위에 덧입혀짐)
-- ---------------------------------------------------------------------------

create table if not exists public.trip_stops (
  trip_id text not null,
  stop_id text not null,
  day integer not null,
  time text not null default '',
  title text not null default '',
  subtitle text not null default '',
  name_zh text not null default '',
  mrt text not null default '',
  phrase text not null default '',
  category text not null default 'sight'
    check (category in ('food', 'coffee', 'beer', 'whisky', 'sight', 'shopping', 'transit', 'hotel')),
  lat double precision not null default 25.043,
  lng double precision not null default 121.525,
  highlights text[] not null default '{}',
  prompt text not null default '',
  maps_query text not null default '',
  sort_order integer not null default 0,
  archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (trip_id, stop_id)
);

create index if not exists trip_stops_trip_day_sort_idx
  on public.trip_stops (trip_id, day, sort_order);

alter table public.trip_stops enable row level security;

-- ---------------------------------------------------------------------------
-- 4. trip_stop_plans — 우선순위/체류시간/대안/플렉스팁 (편집 가능)
-- ---------------------------------------------------------------------------

create table if not exists public.trip_stop_plans (
  trip_id text not null,
  stop_id text not null,
  priority text not null default 'optional'
    check (priority in ('must', 'optional', 'backup')),
  duration_minutes integer not null default 60 check (duration_minutes >= 0),
  alternatives text[] not null default '{}',
  flex_tip text not null default '',
  opening_hours text not null default '',
  booking_status text not null default '',
  risk_level text not null default 'low'
    check (risk_level in ('low', 'medium', 'high')),
  risk_note text not null default '',
  updated_at timestamptz not null default now(),
  primary key (trip_id, stop_id)
);

alter table public.trip_stop_plans enable row level security;

alter table public.trip_stop_plans add column if not exists opening_hours text not null default '';
alter table public.trip_stop_plans add column if not exists booking_status text not null default '';
alter table public.trip_stop_plans add column if not exists risk_level text not null default 'low';
alter table public.trip_stop_plans add column if not exists risk_note text not null default '';

-- ---------------------------------------------------------------------------
-- 5. trip_essentials — 준비 체크리스트 (항목 + 체크 상태)
-- ---------------------------------------------------------------------------

create table if not exists public.trip_essentials (
  trip_id text not null,
  item_id text not null,
  label text not null,
  sort_order integer not null default 0,
  checked boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (trip_id, item_id)
);

create index if not exists trip_essentials_trip_sort_idx
  on public.trip_essentials (trip_id, sort_order);

alter table public.trip_essentials enable row level security;

-- ---------------------------------------------------------------------------
-- 6. trip_expenses — 가계부 (스톱과 무관한 지출: 편의점/교통/간식 등)
-- ---------------------------------------------------------------------------

create table if not exists public.trip_expenses (
  trip_id text not null,
  id text not null,
  day integer not null default 0,
  amount integer not null default 0 check (amount >= 0),
  category text not null default 'none',
  payer text not null default 'none',
  method text not null default 'unknown',
  label text not null default '',
  at timestamptz not null default now(),
  primary key (trip_id, id)
);

create index if not exists trip_expenses_trip_idx
  on public.trip_expenses (trip_id, day, at);

alter table public.trip_expenses enable row level security;
-- writes go through the Next.js server route with the service-role key

alter table public.trip_expenses add column if not exists method text not null default 'unknown';

-- ---------------------------------------------------------------------------
-- 7. trip_bingo — 여행 빙고 보드 (완료한 칸 인덱스 목록)
-- ---------------------------------------------------------------------------

create table if not exists public.trip_bingo (
  trip_id text not null primary key,
  done integer[] not null default '{}',
  updated_at timestamptz not null default now()
);

alter table public.trip_bingo enable row level security;
-- writes go through the Next.js server route with the service-role key

-- ---------------------------------------------------------------------------
-- 8. trip_vault — 예약/문서 보관함
-- ---------------------------------------------------------------------------

create table if not exists public.trip_vault (
  trip_id text not null,
  id text not null,
  kind text not null default 'other',
  title text not null default '',
  provider text not null default '',
  confirmation text not null default '',
  start_at text not null default '',
  location text not null default '',
  link text not null default '',
  amount integer not null default 0 check (amount >= 0),
  owner text not null default 'shared',
  status text not null default 'confirmed',
  notes text not null default '',
  document_url text not null default '',
  updated_at timestamptz not null default now(),
  primary key (trip_id, id)
);

create index if not exists trip_vault_trip_start_idx
  on public.trip_vault (trip_id, start_at);

alter table public.trip_vault enable row level security;

-- ---------------------------------------------------------------------------
-- 9. trip_budget — 여행 예산 목표
-- ---------------------------------------------------------------------------

create table if not exists public.trip_budget (
  trip_id text not null primary key,
  target_twd integer not null default 0 check (target_twd >= 0),
  cash_start_twd integer not null default 0 check (cash_start_twd >= 0),
  daily_limit_twd integer not null default 0 check (daily_limit_twd >= 0),
  notes text not null default '',
  updated_at timestamptz not null default now()
);

alter table public.trip_budget enable row level security;

-- ---------------------------------------------------------------------------
-- 10. Storage bucket — 사진 업로드 (PhotoUploader 컴포넌트가 사용)
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('trip-photos', 'trip-photos', true)
on conflict (id) do update set public = excluded.public;

-- public read so MemoryEditor/RecapMode/PrintPage can render images directly
drop policy if exists "trip-photos: public read" on storage.objects;
create policy "trip-photos: public read"
  on storage.objects for select
  using (bucket_id = 'trip-photos');

-- 업로드/삭제는 service-role 키를 사용하는 /api/upload 서버 라우트로만 수행

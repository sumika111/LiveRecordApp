-- ライブ記録アプリ 初期セットアップ（Supabase SQL Editor でまとめて実行）
-- 実行順序の通りに実行してください。

-- ========== 1. profiles ==========
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', new.email))
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
drop policy if exists "プロフィールは読める" on public.profiles;
create policy "プロフィールは読める"
  on public.profiles for select using (true);
drop policy if exists "自分のプロフィールは更新できる" on public.profiles;
create policy "自分のプロフィールは更新できる"
  on public.profiles for update using (auth.uid() = id);
drop policy if exists "自分のプロフィールを登録" on public.profiles;
create policy "自分のプロフィールを登録"
  on public.profiles for insert with check (auth.uid() = id);

-- ========== 2. venues ==========
create table if not exists public.venues (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  prefecture text not null,
  city text,
  lat numeric(9,6),
  lng numeric(9,6),
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id)
);

create unique index if not exists venues_name_prefecture on public.venues (name, prefecture);

alter table public.venues enable row level security;
drop policy if exists "会場は誰でも読める" on public.venues;
create policy "会場は誰でも読める"
  on public.venues for select using (true);
drop policy if exists "認証済みは会場を登録できる" on public.venues;
create policy "認証済みは会場を登録できる"
  on public.venues for insert with check (auth.uid() is not null);

-- ========== 3. events ==========
create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid not null references public.venues(id) on delete restrict,
  event_date date not null,
  title text not null,
  artist_name text,
  memo text,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id)
);

create unique index if not exists events_venue_date_title on public.events (venue_id, event_date, title);

alter table public.events enable row level security;
drop policy if exists "公演は誰でも読める" on public.events;
create policy "公演は誰でも読める"
  on public.events for select using (true);
drop policy if exists "認証済みは公演を登録できる" on public.events;
create policy "認証済みは公演を登録できる"
  on public.events for insert with check (auth.uid() is not null);

-- ========== 4. attendances ==========
create table if not exists public.attendances (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  event_id uuid not null references public.events(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(user_id, event_id)
);

alter table public.attendances enable row level security;
drop policy if exists "参加記録は誰でも読める（ランキング用）" on public.attendances;
create policy "参加記録は誰でも読める（ランキング用）"
  on public.attendances for select using (true);
drop policy if exists "自分の参加記録を追加できる" on public.attendances;
create policy "自分の参加記録を追加できる"
  on public.attendances for insert with check (auth.uid() = user_id);
drop policy if exists "自分の参加記録を削除できる" on public.attendances;
create policy "自分の参加記録を削除できる"
  on public.attendances for delete using (auth.uid() = user_id);

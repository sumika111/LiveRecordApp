-- 1公演に複数アーティストを紐づける（フェス・対バン対応）
-- Supabase SQL Editor で実行してください。

create table if not exists public.event_artists (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  artist_name text not null,
  sort_order smallint not null default 0,
  created_at timestamptz not null default now(),
  unique(event_id, artist_name)
);

create index if not exists event_artists_event_id on public.event_artists (event_id);
create index if not exists event_artists_artist_name on public.event_artists (artist_name);

alter table public.event_artists enable row level security;

drop policy if exists "event_artists は誰でも読める" on public.event_artists;
create policy "event_artists は誰でも読める"
  on public.event_artists for select using (true);

drop policy if exists "認証済みは event_artists を追加できる" on public.event_artists;
create policy "認証済みは event_artists を追加できる"
  on public.event_artists for insert with check (auth.uid() is not null);

drop policy if exists "認証済みは event_artists を削除できる" on public.event_artists;
create policy "認証済みは event_artists を削除できる"
  on public.event_artists for delete using (auth.uid() is not null);

drop policy if exists "認証済みは event_artists を更新できる" on public.event_artists;
create policy "認証済みは event_artists を更新できる"
  on public.event_artists for update using (auth.uid() is not null);

-- 既存の events の artist_name を event_artists に移行
insert into public.event_artists (event_id, artist_name, sort_order)
select id, trim(artist_name), 0
from public.events
where artist_name is not null and trim(artist_name) <> ''
on conflict (event_id, artist_name) do nothing;

comment on table public.event_artists is '公演に紐づくアーティスト（複数可）。フェス・対バン対応。';

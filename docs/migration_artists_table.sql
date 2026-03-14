-- アーティストマスタ（記録フォームの候補・ランキング検索用）
-- Supabase SQL Editor で実行してください。

create table if not exists public.artists (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now(),
  constraint artists_name_unique unique (name)
);

create index if not exists artists_name_lower on public.artists (lower(name));

alter table public.artists enable row level security;

drop policy if exists "アーティストは誰でも読める" on public.artists;
create policy "アーティストは誰でも読める"
  on public.artists for select using (true);

drop policy if exists "認証済みはアーティストを登録できる" on public.artists;
create policy "認証済みはアーティストを登録できる"
  on public.artists for insert with check (auth.uid() is not null);

-- 既存の events からアーティスト名をマスタに投入（任意。artist_name のみ。公演名は入れない）
insert into public.artists (name)
select distinct trim(artist_name) from public.events
where artist_name is not null and trim(artist_name) <> ''
on conflict (name) do nothing;

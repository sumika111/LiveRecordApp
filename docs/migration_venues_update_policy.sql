-- 会場の住所を認証ユーザーが更新できるようにする
-- Supabase SQL Editor で実行してください。

drop policy if exists "認証済みは会場の住所を更新できる" on public.venues;
create policy "認証済みは会場の住所を更新できる"
  on public.venues for update using (auth.uid() is not null);

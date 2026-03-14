-- 自分が参加している公演を更新できるようにする
-- Supabase の SQL Editor で実行してください。

drop policy if exists "参加している公演は更新できる" on public.events;
create policy "参加している公演は更新できる"
  on public.events for update
  using (
    exists (
      select 1 from public.attendances
      where attendances.event_id = events.id
        and attendances.user_id = auth.uid()
    )
  );

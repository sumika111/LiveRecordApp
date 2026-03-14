-- 通報した本人が自分の通報を取り消せるようにする
-- 実行: Supabase Dashboard > SQL Editor で実行

-- INSERT 後に .select("id") で返す値を見るため、自分が送った通報のみ SELECT を許可
DROP POLICY IF EXISTS "自分が送った通報のみ読める" ON public.reports;
CREATE POLICY "自分が送った通報のみ読める"
  ON public.reports FOR SELECT TO authenticated
  USING (auth.uid() = reporter_id);

DROP POLICY IF EXISTS "自分が送った通報のみ削除できる" ON public.reports;
CREATE POLICY "自分が送った通報のみ削除できる"
  ON public.reports FOR DELETE TO authenticated
  USING (auth.uid() = reporter_id);

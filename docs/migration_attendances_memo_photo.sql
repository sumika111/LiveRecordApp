-- 参加記録に「楽しかったこと」メモと写真1枚用URLを追加
-- 実行: Supabase Dashboard > SQL Editor で実行

ALTER TABLE attendances
  ADD COLUMN IF NOT EXISTS memo text,
  ADD COLUMN IF NOT EXISTS photo_url text;

COMMENT ON COLUMN attendances.memo IS 'その日の楽しかったこと（任意）';
COMMENT ON COLUMN attendances.photo_url IS '思い出の写真1枚のURL（Supabase Storage）';

-- 自分の参加記録の memo / photo_url を更新できるようにする
DROP POLICY IF EXISTS "自分の参加記録を更新できる" ON public.attendances;
CREATE POLICY "自分の参加記録を更新できる"
  ON public.attendances FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

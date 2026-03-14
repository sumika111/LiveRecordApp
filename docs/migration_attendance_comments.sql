-- 参加記録（TLの1件）へのコメント・返信
-- 親コメント削除時は子（返信）もまとめて削除（ON DELETE CASCADE）
-- 実行: Supabase Dashboard > SQL Editor で実行

CREATE TABLE IF NOT EXISTS public.attendance_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  attendance_id uuid NOT NULL REFERENCES public.attendances(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  parent_id uuid REFERENCES public.attendance_comments(id) ON DELETE CASCADE,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (trim(body) <> '')
);

CREATE INDEX IF NOT EXISTS attendance_comments_attendance_id ON public.attendance_comments (attendance_id);
CREATE INDEX IF NOT EXISTS attendance_comments_parent_id ON public.attendance_comments (parent_id);
CREATE INDEX IF NOT EXISTS attendance_comments_user_id ON public.attendance_comments (user_id);

-- updated_at を更新するトリガー
CREATE OR REPLACE FUNCTION public.set_attendance_comments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS attendance_comments_updated_at ON public.attendance_comments;
CREATE TRIGGER attendance_comments_updated_at
  BEFORE UPDATE ON public.attendance_comments
  FOR EACH ROW EXECUTE PROCEDURE public.set_attendance_comments_updated_at();

ALTER TABLE public.attendance_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "コメントは誰でも読める（TL表示用）" ON public.attendance_comments;
CREATE POLICY "コメントは誰でも読める（TL表示用）"
  ON public.attendance_comments FOR SELECT USING (true);

DROP POLICY IF EXISTS "ログイン済みはコメント投稿できる" ON public.attendance_comments;
CREATE POLICY "ログイン済みはコメント投稿できる"
  ON public.attendance_comments FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "自分のコメントのみ編集できる" ON public.attendance_comments;
CREATE POLICY "自分のコメントのみ編集できる"
  ON public.attendance_comments FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "自分のコメントのみ削除できる（返信はCASCADEで削除）" ON public.attendance_comments;
CREATE POLICY "自分のコメントのみ削除できる（返信はCASCADEで削除）"
  ON public.attendance_comments FOR DELETE USING (auth.uid() = user_id);

COMMENT ON TABLE public.attendance_comments IS '参加記録へのコメント。parent_id があると返信。親削除で子も削除';

-- コメント・返信へのいいね
-- 実行: Supabase Dashboard > SQL Editor で実行

CREATE TABLE IF NOT EXISTS public.comment_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  comment_id uuid NOT NULL REFERENCES public.attendance_comments(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, comment_id)
);

CREATE INDEX IF NOT EXISTS comment_likes_comment_id ON public.comment_likes (comment_id);
CREATE INDEX IF NOT EXISTS comment_likes_user_id ON public.comment_likes (user_id);

ALTER TABLE public.comment_likes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "コメントいいねは誰でも読める" ON public.comment_likes;
CREATE POLICY "コメントいいねは誰でも読める"
  ON public.comment_likes FOR SELECT USING (true);

DROP POLICY IF EXISTS "自分でコメントにいいねできる" ON public.comment_likes;
CREATE POLICY "自分でコメントにいいねできる"
  ON public.comment_likes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "自分でコメントいいね解除できる" ON public.comment_likes;
CREATE POLICY "自分でコメントいいね解除できる"
  ON public.comment_likes FOR DELETE USING (auth.uid() = user_id);

COMMENT ON TABLE public.comment_likes IS 'TLコメント・返信へのいいね';

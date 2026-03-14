-- 友達（フォロー）・いいね用テーブル
-- 実行: Supabase Dashboard > SQL Editor で実行

-- ========== follows（誰が誰をフォローしているか） ==========
CREATE TABLE IF NOT EXISTS public.follows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  following_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(follower_id, following_id),
  CHECK (follower_id != following_id)
);

CREATE INDEX IF NOT EXISTS follows_follower_id ON public.follows (follower_id);
CREATE INDEX IF NOT EXISTS follows_following_id ON public.follows (following_id);

ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "自分のフォロー関係を読める" ON public.follows;
CREATE POLICY "自分のフォロー関係を読める"
  ON public.follows FOR SELECT
  USING (
    auth.uid() = follower_id OR auth.uid() = following_id
  );

DROP POLICY IF EXISTS "自分でフォローを追加できる" ON public.follows;
CREATE POLICY "自分でフォローを追加できる"
  ON public.follows FOR INSERT
  WITH CHECK (auth.uid() = follower_id);

DROP POLICY IF EXISTS "自分でフォローを解除できる" ON public.follows;
CREATE POLICY "自分でフォローを解除できる"
  ON public.follows FOR DELETE
  USING (auth.uid() = follower_id);

-- ========== likes（どの記録にいいねしたか） ==========
CREATE TABLE IF NOT EXISTS public.likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  attendance_id uuid NOT NULL REFERENCES public.attendances(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, attendance_id)
);

CREATE INDEX IF NOT EXISTS likes_attendance_id ON public.likes (attendance_id);
CREATE INDEX IF NOT EXISTS likes_user_id ON public.likes (user_id);

ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "いいねは誰でも読める（タイムライン表示用）" ON public.likes;
CREATE POLICY "いいねは誰でも読める（タイムライン表示用）"
  ON public.likes FOR SELECT USING (true);

DROP POLICY IF EXISTS "自分でいいねできる" ON public.likes;
CREATE POLICY "自分でいいねできる"
  ON public.likes FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "自分でいいね解除できる" ON public.likes;
CREATE POLICY "自分でいいね解除できる"
  ON public.likes FOR DELETE USING (auth.uid() = user_id);

COMMENT ON TABLE public.follows IS 'フォロー関係（follower が following をフォロー）';
COMMENT ON TABLE public.likes IS '参加記録へのいいね';

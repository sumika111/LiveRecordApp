-- 管理者への要望（ユーザーが送信し、管理者が確認）
-- 実行: Supabase Dashboard > SQL Editor で実行

CREATE TABLE IF NOT EXISTS public.admin_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (trim(body) <> '')
);

CREATE INDEX IF NOT EXISTS admin_requests_created_at ON public.admin_requests (created_at DESC);
CREATE INDEX IF NOT EXISTS admin_requests_user_id ON public.admin_requests (user_id);

ALTER TABLE public.admin_requests ENABLE ROW LEVEL SECURITY;

-- ログイン済みは自分用の要望のみ送信可能
DROP POLICY IF EXISTS "ログイン済みは要望を送信できる（自分のuser_idで）" ON public.admin_requests;
CREATE POLICY "ログイン済みは要望を送信できる（自分のuser_idで）"
  ON public.admin_requests FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- SELECT は RLS では許可しない（管理者は API で service role を使って取得）
COMMENT ON TABLE public.admin_requests IS '管理者への要望。ユーザーが送信し、管理者画面で確認';

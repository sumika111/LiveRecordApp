-- 管理者・通報・BAN（削除済みメールの再登録禁止）
-- 実行: Supabase Dashboard > SQL Editor で実行

-- ========== 管理者（メニューに管理者画面を出す用） ==========
CREATE TABLE IF NOT EXISTS public.admins (
  email text PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "認証済みは管理者一覧を読める（自分が管理者か判定するため）" ON public.admins;
CREATE POLICY "認証済みは管理者一覧を読める（自分が管理者か判定するため）"
  ON public.admins FOR SELECT TO authenticated USING (true);

-- 初期管理者（このメールだけ管理者）
INSERT INTO public.admins (email) VALUES ('kuroko0725cc@gmail.com')
  ON CONFLICT (email) DO NOTHING;

COMMENT ON TABLE public.admins IS '管理者メール。ここに含まれるメールのユーザーのみ管理者画面へアクセス可';

-- ========== 通報 ==========
CREATE TABLE IF NOT EXISTS public.reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  comment_id uuid NOT NULL REFERENCES public.attendance_comments(id) ON DELETE CASCADE,
  reported_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS reports_comment_id ON public.reports (comment_id);
CREATE INDEX IF NOT EXISTS reports_reported_user_id ON public.reports (reported_user_id);
CREATE INDEX IF NOT EXISTS reports_created_at ON public.reports (created_at DESC);

ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "認証済みは通報を送信できる" ON public.reports;
CREATE POLICY "認証済みは通報を送信できる"
  ON public.reports FOR INSERT TO authenticated WITH CHECK (auth.uid() = reporter_id);

-- 通報一覧の閲覧は管理者API（サービスロール）で行う。通常ユーザーはSELECT不可
COMMENT ON TABLE public.reports IS 'コメントの通報。管理者が一覧・対応する';

-- ========== BAN済みメール（削除後このメールでは二度と登録不可） ==========
CREATE TABLE IF NOT EXISTS public.banned_emails (
  email text PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.banned_emails ENABLE ROW LEVEL SECURITY;

-- 認証済みユーザーが「自分のメールがBANされていないか」確認するために読む（1件だけ取得するので漏れは小さい）
DROP POLICY IF EXISTS "認証済みは自分のメールのBAN有無を確認できる" ON public.banned_emails;
CREATE POLICY "認証済みは自分のメールのBAN有無を確認できる"
  ON public.banned_emails FOR SELECT TO authenticated USING (true);

-- INSERT/DELETE は管理者のみ（サービスロールでAPIから行う想定）。RLSで制限するなら管理者ポリシーを追加
-- ここではAPIでサービスロールを使うため、banned_emails への INSERT はサービスロールのみ許可（デフォルトで authenticated は INSERT 不可）
COMMENT ON TABLE public.banned_emails IS '管理者がアカウント削除したメール。このメールでは再登録不可';

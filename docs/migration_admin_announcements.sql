-- 管理者のお知らせ（「〜直しました」など。ログイン画面に表示、1日で自動非表示）
-- 実行: Supabase Dashboard > SQL Editor で実行

CREATE TABLE IF NOT EXISTS public.admin_announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (trim(body) <> '')
);

CREATE INDEX IF NOT EXISTS admin_announcements_created_at ON public.admin_announcements (created_at DESC);

ALTER TABLE public.admin_announcements ENABLE ROW LEVEL SECURITY;

-- 一般ユーザーは SELECT しない（公開用は API で 24 時間以内のものだけ返す）
-- 管理者の CRUD は API で service role を使用
COMMENT ON TABLE public.admin_announcements IS '管理者のお知らせ。ログイン画面に表示。24時間経過で非表示。';

CREATE OR REPLACE FUNCTION public.set_admin_announcements_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS admin_announcements_updated_at ON public.admin_announcements;
CREATE TRIGGER admin_announcements_updated_at
  BEFORE UPDATE ON public.admin_announcements
  FOR EACH ROW EXECUTE PROCEDURE public.set_admin_announcements_updated_at();

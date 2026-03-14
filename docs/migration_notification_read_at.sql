-- 通知・管理者通知の「最後に開いた時刻」（未読リセット用）
-- 実行: Supabase Dashboard > SQL Editor で実行

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS notification_read_at timestamptz,
  ADD COLUMN IF NOT EXISTS admin_notification_read_at timestamptz;

COMMENT ON COLUMN public.profiles.notification_read_at IS '最後に通知画面を開いた時刻。これより後のいいね・コメントを未読としてカウント';
COMMENT ON COLUMN public.profiles.admin_notification_read_at IS '管理者が最後に管理者画面を開いた時刻。これより後の通報・要望を未読としてカウント';

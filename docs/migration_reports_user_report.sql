-- ユーザー通報（コメント以外の通報）に対応するため comment_id を nullable に
-- 実行: Supabase Dashboard > SQL Editor で実行

ALTER TABLE public.reports
  ALTER COLUMN comment_id DROP NOT NULL;

COMMENT ON COLUMN public.reports.comment_id IS 'コメントを通報した場合はID。ユーザーを通報した場合はNULL';

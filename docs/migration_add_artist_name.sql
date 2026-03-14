-- 既存プロジェクト用: events にアーティスト名カラムを追加
-- Supabase の SQL Editor で実行してください。

ALTER TABLE public.events
ADD COLUMN IF NOT EXISTS artist_name text;

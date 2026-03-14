-- プロフィールに「好きなアーティスト」を追加（#アーティスト名 形式で複数保存）
-- 実行: Supabase Dashboard > SQL Editor で実行

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS favorite_artists text;

COMMENT ON COLUMN profiles.favorite_artists IS '好きなアーティスト（1件ずつ "||" で区切り。例: ONE OK ROCK||BUMP OF CHICKEN）';

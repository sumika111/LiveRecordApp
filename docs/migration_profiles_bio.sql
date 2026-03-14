-- プロフィールに「一言」を追加（アイコンは既存の avatar_url を使用）
-- 実行: Supabase Dashboard > SQL Editor で実行

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS bio text;

COMMENT ON COLUMN profiles.bio IS '一言・自己紹介（任意、他ユーザーに表示）';

-- 長さ制限（任意。200文字までなど）
-- ALTER TABLE profiles ADD CONSTRAINT profiles_bio_length CHECK (char_length(bio) <= 200);
